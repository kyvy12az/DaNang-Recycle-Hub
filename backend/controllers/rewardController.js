const { createClient } = require("@supabase/supabase-js");
const Reward = require("../models/Reward");
const RedeemHistory = require("../models/RedeemHistory");
const User = require("../models/User");

// cấu hình Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// lấy danh sách toàn bộ phần thưởng
exports.getAllRewards = async (req, res) => {
    try {
        const rewards = await Reward.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: rewards.length,
            data: rewards
        });
    } catch (error) {
        console.log("Lỗi khi lấy danh sách phần thưởng: ", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// chi tiết phần thưởng theo ID
exports.getRewardById = async (req, res) => {
    try {
        const reward = await Reward.findById(req.params.id);
        if (!reward) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phần thưởng này",
            });
        }
        res.status(200).json({
            success: true,
            data: reward,
        });
    } catch (error) {
        console.log("Lỗi khi lấy chi tiết phần thưởng: ", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// thêm mới phần thưởng
exports.createReward = async (req, res) => {
    try {
        let imageUrl = req.body.image || "";

        if (req.file && supabase) {
            const file = req.file;
            const fileExt = file.originalname.split(".").pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `rewards/${fileName}`;

            const { error } = await supabase.storage
                .from("reward_images")
                .upload(filePath, file.buffer, {
                    contentType: file.mimetype,
                    upsert: true
                });

            if (error) throw error;

            const { data: publicUrlData } = supabase.storage
                .from("reward_images")
                .getPublicUrl(filePath);

            imageUrl = publicUrlData.publicUrl;
        }

        const newReward = new Reward({
            ...req.body,
            image: imageUrl
        });

        await newReward.save();

        if (global.io) global.io.emit("reward_created", newReward);

        res.status(201).json({ success: true, data: newReward });
    } catch (error) {
        console.log("Lỗi khi thêm phần thưởng mới: ", error);
        return res.status(400).json({
            success: false,
            message: error.message
        })
    }
}

// Cập nhật phần thưởng theo ID
exports.updateReward = async (req, res) => {
    try {
        let imageUrl = req.body.image;

        if (req.file && supabase) {
            const file = req.file;
            const fileExt = file.originalname.split(".").pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `rewards/${fileName}`;

            const { error } = await supabase.storage
                .from("reward_images")
                .upload(filePath, file.buffer, {
                    contentType: file.mimetype,
                    upsert: true
                });

            if (error) throw error;

            const { data: publicUrlData } = supabase.storage
                .from("reward_images")
                .getPublicUrl(filePath);

            imageUrl = publicUrlData.publicUrl;
        }

        const updatedData = { ...req.body };
        if (imageUrl !== undefined) {
            updatedData.image = imageUrl;
        }

        const reward = await Reward.findByIdAndUpdate(
            req.params.id,
            updatedData,
            { new: true, runValidators: true }
        );

        if (!reward) {
            return res.status(404).json({ success: false, message: "Không tìm thấy quà thưởng để cập nhật" });
        }

        if (global.io) global.io.emit("reward_updated", reward);

        res.status(200).json({ success: true, data: reward });
    } catch (error) {
        console.error("Lỗi cập nhật quà thưởng:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// xóa phần thưởng theo ID
exports.deleteReward = async (req, res) => {
    try {
        const reward = await Reward.findByIdAndDelete(req.params.id);

        if (!reward) {
            return res.status(404).json({ success: false, message: "Không tìm thấy quà thưởng" });
        }

        if (global.io) global.io.emit("reward_deleted", reward._id);

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        console.log("Lỗi khi xóa phần thưởng: ", error);
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
};

// đổi thưởng quà
exports.redeemReward = async (req, res) => {
    try {
        const { rewardId } = req.body;
        const userId =
            req.user?.id ||
            req.user?._id ||
            req.userId ||
            req.auth?.id ||
            req.auth?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Không xác định được người dùng. Vui lòng đăng nhập lại.',
            });
        }

        const reward = await Reward.findById(rewardId);
        if (!reward) {
            return res.status(404).json({ success: false, message: "Không tìm thấy phần thưởng này" });
        }

        if (reward.status === "hidden") {
            return res.status(400).json({ success: false, message: "Phần thưởng hiện đang ngưng áp dụng" });
        }
        if (reward.stock <= 0) {
            return res.status(400).json({ success: false, message: "Phần thưởng này đã hết số lượng trong kho" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "Không tìm thấy thông tin tài khoản" });
        }

        if (user.greenPoints < reward.pointsRequired) {
            return res.status(400).json({
                success: false,
                message: `Bạn không đủ điểm. Cần thêm ${reward.pointsRequired - user.greenPoints} điểm nữa.`
            });
        }

        user.greenPoints -= reward.pointsRequired;
        reward.stock -= 1;

        await user.save();
        await reward.save();

        const historyLog = await RedeemHistory.create({
            userId: user._id,
            rewardId: reward._id,
            rewardName: reward.name,
            pointsSpent: reward.pointsRequired,
            status: "completed"
        });

        if (global.io) {
            global.io.emit("reward_stock_updated", { rewardId: reward._id, stock: reward.stock });
            global.io.to(userId.toString()).emit("user_points_updated", { greenPoints: user.greenPoints });
        }

        return res.status(200).json({
            success: true,
            message: `Đổi thành công ${reward.name}!`,
            data: {
                remainingPoints: user.greenPoints,
                history: historyLog
            }
        });

    } catch (error) {
        console.error("Lỗi đổi thưởng xử lý BE:", error);
        return res.status(500).json({ success: false, message: "Có lỗi xảy ra trên máy chủ" });
    }
};

// Lấy lịch sử đổi quà của một cá nhân User
exports.getRedeemHistory = async (req, res) => {
    try {
        const userId =
            req.user?.id ||
            req.user?._id ||
            req.userId ||
            req.auth?.id ||
            req.auth?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Không xác định được người dùng. Vui lòng đăng nhập lại.',
            });
        }
        const history = await RedeemHistory.find({ userId })
            .populate('rewardId', 'image category')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error("Lỗi lấy lịch sử đổi quà:", error);
        return res.status(500).json({ success: false, message: "Không tải được lịch sử đổi quà" });
    }
};
