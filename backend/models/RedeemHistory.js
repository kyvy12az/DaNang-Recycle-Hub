const mongoose = require("mongoose");

const redeemHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rewardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reward',
        required: true
    },
    rewardName: {
        type: String,
        required: true
    },
    pointsSpent: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "completed", "cancelled"],
        default: "completed" 
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model("RedeemHistory", redeemHistorySchema);