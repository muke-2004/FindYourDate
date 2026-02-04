const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  message: {
    type: String,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  created_At: {
    type: Date,
    default: Date.now(),
  },
});

const chatSchema = new mongoose.Schema({
  room_Id: {
    type: String,
  },
  messages: [messageSchema],
});
const chatdb = mongoose.model("chatdb", chatSchema);
module.exports = chatdb;
