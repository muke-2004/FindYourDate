require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { v4: uuidv4 } = require("uuid");
const { validateTokenForUser, createTokenForUser } = require("./auth");
// const database = require("./connection");
const userdb = require("./models/userModel");
const chatdb = require("./models/chatModel");
const cookieParser = require("cookie-parser");
const restrictToLoggedinUserOnly = require("./middleware/auth");
const bcrypt = require("bcrypt");
const { Server } = require("socket.io");
const http = require("http");
const server = http.createServer(app);
const io = new Server(server);
const { checkForAuthenticationCookie } = require("./middleware/authentication");

// ================== MULTER ==================
const multer = require("multer");
// const { restrictToLoggedInUserOnly } = require("../MANGOO/middleware/auth");

// Multer storage-> allows us to have access how to store image data in our folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const ai_folder = ["ai_half_photo"];
    // const ai_proof = ["ai_half_photo"];
    if (ai_folder.includes(file.fieldname)) {
      cb(null, "uploads/ai_faces");
    } else {
      cb(null, "uploads/");
    }
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// ================== APP SETUP ==================
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(cookieParser());
app.use(checkForAuthenticationCookie("uid"));
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

// ================== DATABASE ==================

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((e) => console.log(e));

// ================== SOCKET IO ==================
io.on("connection", (socket) => {
  // console.log("User connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    // console.log(roomId);
    socket.join(roomId);
  });

  socket.on("messageFromUser", async (data) => {
    try {
      // console.log(data.roomId);

      let chatRoom = await chatdb.findOne({ room_Id: data.roomId });

      // console.log(chatRoom);
      if (!chatRoom) {
        chatRoom = new chatdb({
          room_Id: data.roomId,
          messages: [
            {
              message: data.message,
              senderId: data.senderId,
            },
          ],
        });
      } else {
        chatRoom.messages.push({
          message: data.message,
          senderId: data.senderId,
        });
      }

      await chatRoom.save();

      io.to(data.roomId).emit("messageFromUser", data);
    } catch (error) {
      console.log("error saving message", error);
    }
  });
});

// ================== ROUTES ==================

app.get("/", (req, res) => {
  // res.render("signup");
  // console.log(new Date().toLocaleString("en-IN").split(",")[1]);
  // return res.send("main page route /");
  // console.log("mian page route /");
  return res.redirect("login");
});

// ================== SIGNUP FOR CREATING LOGIN ==================

// app.get("/signup", (req, res) => {
//   res.render("signup");
// });

app.get("/login/signup", (req, res) => {
  return res.render("signup");
});

app.post(
  "/login/signup",
  upload.fields([
    { name: "profile_photo" },
    { name: "ai_half_photo" },
    { name: "ai_full_photo" },
  ]),
  async (req, res) => {
    try {
      let user = new userdb({
        name: req.body.name,
        email_id: req.body.email,
        password: req.body.password,
        ai_half_photo: req.files.ai_half_photo
          ? req.files.ai_half_photo[0].filename
          : "",
        ai_full_photo: req.files.ai_full_photo
          ? req.files.ai_full_photo[0].filename
          : "",
        profile_photo: req.files.profile_photo
          ? req.files.profile_photo[0].filename
          : "",
      });

      await user.save();
      return res.redirect("/login");
    } catch (error) {
      if (error.code === 11000) {
        return res.render("signup", { error: "Email already exists" });
      }
      return res.render("signup", { error: "something went wrong! Try Again" });
    }
  },
);

// ================== LOGIN ==================

app.get("/login", (req, res) => {
  if (req.user) {
    return res.redirect("/myprofile");
  }
  return res.render("login");
});

app.post("/login", async function (req, res) {
  try {
    const { email, password } = req.body;

    const user = await userdb.findOne({ email_id: email }).select("+password");

    if (!user) {
      // console.log("user not found");
      return res.render("login", {
        error: "User not found Try Creating new Account",
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.render("login", {
        error: "incorrect email or password",
      });
    }

    // ================== creating a session id for security instead of using id from the database as before ==================

    // const sessionId = uuidv4(); only used for stateless authentication

    const token = createTokenForUser(user);

    res.cookie("uid", token);
    // console.log(user);
    // console.log(cookieCreated);

    return res.redirect("/myprofile");
  } catch (error) {
    return res.render("login", {
      error: "Something went wrong! Try again later",
    });
  }
});

// ================== COMPARISON ROUTE ==================
app.post("/compare/:id", restrictToLoggedinUserOnly, async (req, res) => {
  // console.log("COMPARE REQUEST FOR USER ID:", req.params.id);
  try {
    const userA = await userdb.findById(req.params.id);
    if (!userA) return res.status(404).send("User not found");

    // Full path to the current user's aigen photo
    if (!userA.ai_half_photo) {
      return res.status(400).send("Current user has no AI half photo");
    }

    const imgPath = path.resolve("uploads/ai_faces", userA.ai_half_photo);

    // Get all AI images except for the current user
    const otherUsers = await userdb.find({ _id: { $ne: userA._id } });
    const profileImages = otherUsers
      .filter((u) => u.profile_photo)
      .map((u) => path.resolve("uploads", u.profile_photo));

    // If no other AI images, return empty result immediately
    if (profileImages.length === 0) {
      userA.face_matches = [];
      await userA.save();
      return res.render("result", { matches: [] });
    }

    // Create temporary folder for AI images
    const tempDir = path.resolve("uploads/temp_profile_faces");
    fs.mkdirSync(tempDir, { recursive: true });

    // Copy only other users' AI images to temp folder
    profileImages.forEach((img) => {
      const dest = path.join(tempDir, path.basename(img));
      fs.copyFileSync(img, dest);
    });

    const pythonPath = process.env.PYTHON_PATH;

    const python = spawn(pythonPath, [
      path.join(__dirname, "compare.py"),
      imgPath,
      tempDir,
    ]);

    let output = "";
    let errorOutput = "";

    python.stdout.on("data", (data) => (output += data.toString()));
    python.stderr.on("data", (data) => (errorOutput += data.toString()));

    python.on("close", async (code) => {
      // Delete temp folder after processing
      fs.rmSync(tempDir, { recursive: true, force: true });

      if (code !== 0) {
        // console.error("Python Error:", errorOutput);
        return res.status(500).json({ error: "AI script failed" });
      }

      // console.log("PYTHON RAW OUTPUT >>>", output);

      try {
        output = output.toString().trim();

        const matchArray = output.match(/\[[\s\S]*\]/);
        if (!matchArray) {
          return res.status(500).json({
            error: "Invalid AI output format",
            raw: output,
          });
        }

        const parsed = JSON.parse(matchArray[0]);
        const THRESHOLD = 0.68;

        userA.face_matches = [];

        const validMatches = parsed.filter((m) => m.distance < THRESHOLD);

        for (const match of validMatches) {
          const identityFile = path.basename(match.identity);

          const matchedUser = await userdb.findOne({
            profile_photo: identityFile, // IMPORTANT
          });

          // 🚫 Prevent self-match
          if (!matchedUser) continue;
          if (matchedUser._id.equals(userA._id)) continue;

          const roomId = [userA._id, matchedUser._id].sort().join("_");

          userA.face_matches.push({
            matched_user_id: matchedUser._id,
            room_Id: roomId,
            ai_image: "uploads/" + identityFile,
            distance: match.distance,
            confidence: Number(match.confidence),
          });

          const alreadyExisting = matchedUser.face_matches_by_else.some(
            (matches) => matches.matched_user_id.equals(userA._id),
          );

          if (!alreadyExisting) {
            matchedUser.face_matches_by_else.push({
              matched_user_id: userA._id,
              ai_image: userA.profile_photo,
              distance: match.distance,
              confidence: Number(match.confidence),
              room_Id: roomId,
            });
          }

          await matchedUser.save();
        }

        await userA.save();
        // console.log(userA);
        return res.render("myprofile", {
          user: userA,
          success: "Matches found successfully!",
        });
      } catch (e) {
        return res.status(500).json({ error: "Parsing error: " + e.message });
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ================== chats ==================
// app.get("/chats", restrictToLoggedinUserOnly, async (req, res) => {
//   // console.log(req.user);
//   const user = await userdb
//     .findById(req.user._id)
//     .populate("face_matches.matched_user_id", "name");

//   // console.log(JSON.stringify(user, null, 2));
//   // console.log(user.face_matches[0].matched_user_id);

//   const room_id = req.user.face_matches[0]?.room_Id;

//   return res.render("chats", {
//     userA: user,
//     userB: user.face_matches,
//     room_Id: user.face_matches[0]?.room_Id,
//     // oldMessages: chatRoom ? chatRoom.messages : [],
//   });
// });

// ================== MYROOM ==================

app.get("/myroom", restrictToLoggedinUserOnly, async (req, res) => {
  try {
    const user = await userdb
      .findById(req.user._id)
      .populate("face_matches.matched_user_id", "name profile_photo");

    return res.render("myroom", { user: user });
  } catch (error) {
    res.clearCookie("uid");
    res.render("login", { error: "Try login again!" });
  }
});

app.get("/myroomchat/:id", restrictToLoggedinUserOnly, async (req, res) => {
  try {
    // const userA = await userdb.find({ "face_matches.room_Id": req.params.id });
    const userA = req.user;

    const userB = await userdb.find({
      "face_matches_by_else.room_Id": req.params.id,
    });

    // console.log(userA.profile_photo);
    // console.log(userB[0].profile_photo);

    const chatRoom = await chatdb.findOne({ room_Id: req.params.id });

    return res.render("myroomchats", {
      userA: userA,
      userB: userB,
      room_Id: req.params.id,
      oldMessages: chatRoom ? chatRoom.messages : [],
    });
  } catch (error) {
    res.clearCookie("uid");
    return res.render("login", { error: "Try login again" });
  }
});

// ================== ROOMBYELSE ==================

app.get("/roombyelse", restrictToLoggedinUserOnly, async (req, res) => {
  try {
    const user = await userdb
      .findById({ _id: req.user._id })
      .populate("face_matches_by_else.matched_user_id", "name profile_photo");
    // console.log(chat.face_matches_by_else[0].matched_user_id);

    return res.render("roombyelse", { user: user });
  } catch (error) {
    res.clearCookie("uid");
    return res.render("login", { error: "Try login again!" });
  }
});

app.get("/roombyelsechat/:id", restrictToLoggedinUserOnly, async (req, res) => {
  try {
    // const userA = await userdb.find({
    //   "face_matches_by_else.room_Id": req.params.id,
    // });
    const userA = req.user;
    // const userB = userdb.find({});
    // console.log(userA);

    const userB = await userdb.find({
      "face_matches.room_Id": req.params.id,
    });
    // console.log(userB);
    // const room_id = user.face_matches_by_else[0]?.room_Id;
    const chatRoom = await chatdb.findOne({ room_Id: req.params.id });

    res.render("roombyelsechats", {
      userA: userA,
      userB: userB,
      room_Id: req.params.id,
      oldMessages: chatRoom ? chatRoom.messages : [],
    });
  } catch (error) {
    res.clearCookie("uid");
    return res.render("login", { error: "Try login again!" });
  }
});

// ================== PROFILE ==================

app.get("/myprofile", restrictToLoggedinUserOnly, (req, res) => {
  return res.render("myprofile", { user: req.user });
});

// ================== LOGOUT ==================

app.get("/logout", (req, res) => {
  res.clearCookie("uid");
  return res.redirect("/login");
});

// ================= SERVER ==================
const port = process.env.PORT || 8000;
server.listen(port, () => {
  console.log("Server running on http://localhost:8000");
});
console.log("Python", process.env.PYTHON_PATH);
console.log("Loaded Python Path:", process.env.PYTHON_PATH);
