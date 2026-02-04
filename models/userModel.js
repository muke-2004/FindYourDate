const mongoose = require("mongoose");
// const { createHmac, randomBytes } = require("crypto");
const bcrypt = require("bcrypt");

const faceMatchSchema = new mongoose.Schema({
  matched_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userdb",
  },
  room_Id: {
    type: String,
  },
  ai_image: String,
  distance: Number,
  confidence: Number,
});

const elseFaceMatchSchema = new mongoose.Schema({
  matched_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userdb",
  },
  room_Id: {
    type: String,
  },
  ai_image: String,
  distance: Number,
  confidence: Number,
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email_id: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  password: {
    type: String,
    required: true,
    select: false,
  },
  ai_half_photo: String,
  // ai_full_photo: String,
  profile_photo: {
    type: String,
    required: true,
  },
  uploaded_at: {
    type: Date,
    default: Date.now,
  },
  face_matches: [faceMatchSchema],
  face_matches_by_else: [elseFaceMatchSchema],
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

const userdb = mongoose.model("userdb", userSchema);
module.exports = userdb;
