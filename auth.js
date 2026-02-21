// const sessionToUserMap = new Map();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const secret = process.env.SECRET;

function createTokenForUser(user) {
  // sessionToUserMap.set(id, user);

  return jwt.sign(
    {
      _id: user._id,
      email: user.email_id,
    },
    secret,
    {
      expiresIn: "7d",
    },
  );
}

function validateTokenForUser(token) {
  // return sessionToUserMap.get(id);
  if (!token) {
    return null;
  }

  return jwt.verify(token, secret);
}

module.exports = { createTokenForUser, validateTokenForUser };
