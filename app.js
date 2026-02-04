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

// ================== MULTER ==================
const multer = require("multer");
const { isKeyObject } = require("util/types");

// ================== APP SETUP ==================
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(cookieParser());

// ================== DB ==================

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((e) => console.log(e));

// ================== Socket io sockets means users ==================
io.on("connection", (socket) => {
  // console.log("A new user connected");

  // whenever user disconnects
  // socket.on("userDisconnect", (message)=>{
  //  io.emit("message","user disconnected")
  // });

  // broadcast when a user connnects
  // socket.emit('connect',"user connected")
  // scoket.broadcast.emit('message','user connected')

  // whenever user sends a message from frontend
  // socket.on("userMessage", (data) => {
  // console.log("user sent message", message);

  // sever sends the same message to all the users
  // io.emit("message", data);
  // });

  console.log("User connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    console.log(roomId);
    socket.join(roomId);
  });

  socket.on("messageFromUser", async (data) => {
    try {
      let chatRoom = await chatdb.findOne({ room_Id: data.roomId });

      if (!chatRoom) {
        chatRoom = new chatdb({
          room_Id: data.roomId,
          messages: [{ message: data.message, senderId: data.senderId }],
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

  // socket.on("typing", (data) => {
  //   socket.to(data.roomId).emit("typing", data);
  // });
});

app.get("/matchedroom", restrictToLoggedinUserOnly, async (req, res) => {
  // console.log(req.user);
  const user = await userdb
    .findById(req.user._id)
    .populate("face_matches.matched_user_id", "name");

  // console.log(JSON.stringify(user, null, 2));
  // console.log(user.face_matches[0].matched_user_id);

  const room_id = req.user.face_matches[0]?.room_Id;

  const chatRoom = await chatdb.findOne({ room_Id: room_id });

  return res.render("matchedroom", {
    userA: user,
    userB: user.face_matches,
    room_Id: user.face_matches[0]?.room_Id,
    oldMessages: chatRoom ? chatRoom.messages : [],
  });
});

// app.post("/matchedroom", restrictToLoggedinUserOnly, async (req, res) => {
//   console.log("user form the login info" + req.user);
//   // const chat = await new chatdb({
//   //   room_Id: ,
//   // });
//   return res.redirect("matchedroom");
// });

app.get("/roombyelse", restrictToLoggedinUserOnly, async (req, res) => {
  const user = await userdb
    .findById(req.user._id)
    .populate("face_matches_by_else.matched_user_id", "name ai_image");

  // console.log(JSON.stringify(user, null, 2));
  const room_id = user.face_matches_by_else[0]?.room_Id;
  const chatRoom = await chatdb.findOne({ room_Id: room_id });

  // console.log(chatRoom.messages.created_At.toString());
  // const oldMessages = await chatdb
  //   .find({ room_Id: room_id })
  //   .populate("sender_id", "name")
  //   .sort({ created_at: 1 });
  res.render("roombyelse", {
    userA: user,
    userB: user.face_matches_by_else,
    room_Id: user.face_matches_by_else[0]?.room_Id,
    oldMessages: chatRoom ? chatRoom.messages : [],
    // created_At: created_At,
  });
});

// ================== ROUTES ==================

app.get("/", (req, res) => {
  // res.render("signup");
  return res.send("main page route /");
  // console.log("mian page route /");
});

// Multer storage-> allows us to haves access how to store image data in our folder
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
    // console.log(req.files);
    // console.log(req.body);

    // const password = req.body.password;
    // const hashedpassword = await bcrypt.hash(password, 10);

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
  },
);

// ================== LOGIN ==================
app.get("/login", (req, res) => {
  return res.render("login");
});

app.post("/login", async function (req, res) {
  // const { userid } = req.query;
  // if (!userid) return res.render("login");
  // res.redirect(`/login/${userid}/myprofile`);
  const { email, password } = req.body;

  const user = await userdb.findOne({ email_id: email }).select("+password");

  if (!user) {
    // console.log("user not found");
    return res.redirect("/login");
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  // console.log(isValidPassword);
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
});

app.get("/myprofile", restrictToLoggedinUserOnly, (req, res) => {
  return res.render("myprofile", { user: req.user });
});

// ================== LOGOUT ==================

app.post("/logout", (req, res) => {
  res.clearCookie("uid").redirect("/login");
});

// ================== COMPARISON ROUTE ==================
app.post("/compare/:id", async (req, res) => {
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

    //Use double backslashes so JavaScript reads the path correctly
    // const pythonPath = "C:\\Users\\mukes\\AppData\\Local\\Programs\\Python\\Python312\\python.exe";
    // const pythonPath = "C:\\Users\\mukes\\AppData\\Local\\Programs\\Python\\Python311\\python.exe";
    const pythonPath = "C:\\Python310\\python.exe";
    // Or use forward slashes (Windows understands these too and they are easier to read)
    // const pythonPath = "C:/Users/mukes/AppData/Local/Programs/Python/Python312/python.exe";

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
        const THRESHOLD = 0.5;

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
            (matches) => {
              matches.matched_user_id.equals(userA._id);
            },
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
        // return res.redirect("/matchedroom");
        // return res.json.status(200).json({
        //   success:true,
        // });
      } catch (e) {
        return res.status(500).json({ error: "Parsing error: " + e.message });
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ================== Get Route For MatchedRooms ==================
// app.get("/compare/matchedroom", restrictToLoggedinUserOnly, (req, res) => {
//   console.log(req.user);
//   res.redirect("matchedroom");
// });

// ================= SERVER ==================
const port = process.env.PORT || 8000;
server.listen(port, () => {
  console.log("Server running on http://localhost:8000");
});
