const Order = require("../models/Order");
const User = require("../models/User");

const getPaymentAmount = (order) => order.actualPrice ?? order.estimatedPrice ?? 0;
const getGreenPoints = (order) => order.actualGreenPoints ?? order.estimatedGreenPoints ?? 0;

let io = null;

function setIO(ioInstance) {
  io = ioInstance;
}

function emitWalletUpdate(user) {
  if (!io || !user?._id) return;

  io.to(user._id.toString()).emit("wallet:updated", {
    userId: user._id.toString(),
    walletBalance: user.walletBalance ?? 50000,
    greenPoints: user.greenPoints ?? 0,
    totalWeight: user.totalWeight ?? 0,
    totalTransactions: user.totalTransactions ?? 0,
    updatedAt: new Date().toISOString(),
  });
}

async function settleCompletedOrder(orderId) {
  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      paymentStatus: "completed",
      paymentSettledAt: null,
    },
    { $set: { paymentSettledAt: new Date() } },
    { new: true }
  );

  if (!order) {
    return { settled: false, order };
  }

  const amount = getPaymentAmount(order);
  const points = getGreenPoints(order);

  if (amount <= 0) {
    return { settled: true, order };
  }

  await User.updateMany(
    {
      _id: { $in: [order.buyerId, order.sellerId] },
      walletBalance: null,
    },
    { $set: { walletBalance: 50000 } }
  );

  const buyer = await User.findById(order.buyerId);
  if (!buyer) {
    throw new Error("Người mua không tồn tại");
  }

  if ((buyer.walletBalance ?? 0) < amount) {
    order.paymentStatus = "failed";
    order.paymentSettledAt = null;
    await order.save();
    throw new Error("Số dư ví người mua không đủ để thanh toán");
  }

  const updatedBuyer = await User.findByIdAndUpdate(
    order.buyerId,
    {
      $inc: {
        walletBalance: -amount,
        greenPoints: points,
        totalTransactions: 1,
      },
    },
    { new: true }
  );

  const updatedSeller = await User.findByIdAndUpdate(
    order.sellerId,
    {
      $inc: {
        walletBalance: amount,
        greenPoints: points,
        totalWeight: order.actualWeight ?? order.estimatedWeight ?? 0,
        totalTransactions: 1,
      },
    },
    { new: true }
  );

  emitWalletUpdate(updatedBuyer);
  emitWalletUpdate(updatedSeller);

  return { settled: true, order, buyer: updatedBuyer, seller: updatedSeller };
}

module.exports = {
  settleCompletedOrder,
  setIO,
};
