require("dotenv").config();
const userdb = require("../models/userModel");
const jwt = require("jsonwebtoken");
const secret = process.env.SECRET;
const { validateTokenForUser } = require("../auth");

const restrictToLoggedinUserOnly = async (req, res, next) => {
  const token = req.cookies?.uid;

  if (!token) {
    return res.redirect("/login");
  }

  try {
    const decoded = validateTokenForUser(token);

    // 🔥 FETCH FULL USER FROM DB
    const user = await userdb.findById(decoded._id);

    if (!user) {
      return res.redirect("/login");
    }

    req.user = user; // FULL USER DOCUMENT
    return next();
  } catch (err) {
    return res.redirect("/login");
  }
};

module.exports = restrictToLoggedinUserOnly;
