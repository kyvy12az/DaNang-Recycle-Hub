const mongoose = require("mongoose");

// Schema cho phản hồi/trả lời bình luận
const replySchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },

    userName: {
        type: String,
        required: true,
        default: null,
    },

    avatar: {
        type: String,
        default: null,
    },

    content: {
        type: String,
        required: true,
        default: null,
    },

    likes: {
        type: Number,
        default: 0
    },

    likedBy: [{ type: String }],

    createdAt: {
        type: Date,
        default: Date.now,
    }
});

// Schema cho bình luận
const commentSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },

    userName: {
        type: String,
        required: true,
        default: null,
    },

    avatar: {
        type: String,
        default: null,
    },

    content: {
        type: String,
        required: true,
        default: null,
    },

    likes: {
        type: Number,
        default: 0
    },

    likedBy: [{ type: String }],

    replies: [replySchema],

    createdAt: {
        type: Date,
        default: Date.now,
    }
});

// Schema chính cho bài viết giáo dục
const educationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },

    description: {
        type: String,
        required: true,
    },

    content: {
        type: String,
        required: true,
    },

    category: {
        type: String,
        enum: ['recycling', 'saving', 'environment'],
        default: 'recycling',
    },

    status: {
        type: String,
        enum: ['published', 'draft'],
        default: 'draft'
    },

    featured: {
        type: Boolean,
        default: false,
    },

    image: {
        type: String,
        default: '📄',
    },

    coverImage: {
        type: String,
        default: ''
    },

    co2SavedKg: {
        type: Number,
        default: 0
    },

    waterSavedL: {
        type: Number,
        default: 0
    },

    greenPoints: {
        type: Number,
        default: 5
    },

    readMinutesForPoints: {
        type: Number,
        default: 3
    },

    readMinutes: {
        type: Number,
        default: 5
    },

    likes: {
        type: Number,
        default: 0
    },

    likedBy: [{ type: String }], // Lưu danh sách userId đã thích để xử lý toggleLike
    comments: [commentSchema]
}, { 
    timestamps: true 
});

educationSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});

module.exports = mongoose.model('Education', educationSchema);

