const mongoose = require("mongoose");

const rewardSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        required: true
    },

    pointsRequired: {
        type: Number,
        required: true,
        min: 0
    },

    stock: {
        type: Number,
        required: true,
        min: 0
    },

    status: {
        type: String,
        enum: ["available", "hidden"],
        default: "available"
    },

    image: {
        type: String,
        required: true,
        default: null
    }, 

    category: {
        type: String,
        required: true,
        default: "Quà tặng"
    },

    group: {
        type: String,
        enum: ["financial", "green_gift", "voucher"],
        required: true,
        default: "green_gift"
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
    
}, { 
    timestamps: true 
});

rewardSchema.virtual("id").get(function () {
    return this._id.toHexString();
});
rewardSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model('Reward', rewardSchema);