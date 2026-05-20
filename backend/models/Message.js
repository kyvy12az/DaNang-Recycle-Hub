const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    text: {
      type: String,
      required: false,  
      trim: true,
      default: '',      
    },
    isRead: { 
      type: Boolean, 
      default: false 
    },
    mediaUrl: {
       type: String 
      },
    mediaType: { 
      type: String, 
      enum: ['image', 'video'] 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);