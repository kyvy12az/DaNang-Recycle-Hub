const express = require("express");
const router = express.Router();
const rewardController = require("../controllers/rewardController");
const { protect } = require("../middleware/auth");

const multer = require("multer");
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } 
});

// api lấy danh sách quà tặng và thêm quà tặng mới
router.get("/", rewardController.getAllRewards);
router.post("/", upload.single("file"), rewardController.createReward);

// api lấy thông tin chi tiết quà tặng, cập nhật và xóa quà tặng
router.get("/:id", rewardController.getRewardById);
router.put("/:id", upload.single("file"), rewardController.updateReward);
router.delete("/:id", rewardController.deleteReward);

// api đổi thưởng và lấy lịch sử đổi thưởng
router.post("/redeem", protect, rewardController.redeemReward);
router.get("/history/me", protect, rewardController.getRedeemHistory);
router.get("/admin/history", protect, rewardController.getAllRedeemHistoryForAdmin);

module.exports = router;