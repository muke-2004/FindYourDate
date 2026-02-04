const mongoose = require("mongoose");
const faceMatchSchema = new mongoose.Schema({
  source_user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userdb",
  },
  matched_user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userdb",
  },
  distance: Number,
  confidence: Number,
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("face_match", faceMatchSchema);
