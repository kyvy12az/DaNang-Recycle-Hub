const Listing = require("../models/Listing");
const User = require("../models/User");

// Pass io instance from server.js
let io = null;

exports.setIO = (ioInstance) => {
  io = ioInstance;
};

exports.createListing = async (req, res) => {
  try {
    const { items, totalPrice, totalWeight, greenPoints, note, pickupTime, imageUrl, address: customAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Vui lòng thêm ít nhất một loại rác thải" });
    }
    if (!pickupTime) {
      return res.status(400).json({ message: "Vui lòng chọn thời gian thu gom" });
    }

    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Ưu tiên dùng địa chỉ từ request body, nếu không có mới dùng địa chỉ từ profile
    const finalAddress = customAddress || user.address || "";
    if (!finalAddress) {
      return res.status(400).json({ message: "Vui lòng cung cấp địa chỉ thu gom" });
    }

    const addressParts = finalAddress.split(",");
    const district = addressParts.length > 1
      ? addressParts[addressParts.length - 2]?.trim()
      : "";

    const listing = await Listing.create({
      sellerId: user._id,
      sellerName: user.name,
      sellerAvatar: user.avatar || null,
      items: items.map((item) => ({
        wasteTypeId: item.wasteType.id,
        wasteTypeName: item.wasteType.name,
        wasteTypeCategory: item.wasteType.category,
        wasteTypeColor: item.wasteType.color,
        pricePerKg: item.wasteType.pricePerKg,
        quantity: item.quantity,
        estimatedPrice: item.estimatedPrice,
      })),
      totalPrice,
      totalWeight,
      greenPoints: greenPoints || Math.round(totalWeight * 10),
      address: finalAddress,
      district,
      note: note || "",
      pickupTime,
      imageUrl: imageUrl || null,
    });

    // Emit real-time update to all connected clients
    if (io) {
      io.emit('new:listing', {
        _id: listing._id,
        sellerId: listing.sellerId,
        sellerName: listing.sellerName,
        sellerAvatar: listing.sellerAvatar,
        items: listing.items,
        totalPrice: listing.totalPrice,
        totalWeight: listing.totalWeight,
        address: listing.address,
        district: listing.district,
        note: listing.note,
        pickupTime: listing.pickupTime,
        status: listing.status,
        createdAt: listing.createdAt,
        imageUrl: listing.imageUrl,
        greenPoints: listing.greenPoints,
      });

      // Also notify the seller about their new listing
      io.to(req.userId).emit('seller:listing:created', {
        listing,
        message: "Đăng bài thành công",
      });
    }

    return res.status(201).json({
      message: "Đăng bài thành công",
      listing,
    });
  } catch (error) {
    console.error("Lỗi tạo listing:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};


exports.getListings = async (req, res) => {
  try {
    const { district, status = "available", page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) {
      if (status.includes(",")) {
        filter.status = { $in: status.split(",") };
      } else {
        filter.status = status;
      }
    }
    if (district) filter.district = district;

    const listings = await Listing.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Listing.countDocuments(filter);

    return res.status(200).json({ listings, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error("Lỗi lấy listings:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};


exports.getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    return res.status(200).json({ listing });
  } catch (error) {
    console.error("Lỗi lấy listing by id:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};


exports.getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ sellerId: req.userId }).sort({ createdAt: -1 });
    return res.status(200).json({ listings });
  } catch (error) {
    console.error("Lỗi lấy my listings:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};