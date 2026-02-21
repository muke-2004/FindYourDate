🎭 FaceMatch – Real-Time AI Face Matching Chat Application

FaceMatch allows users to upload an AI-generated half-face image and match it against other users' profile photos using AI-powered face recognition.

When a match is detected below a defined similarity threshold, both users are automatically linked in a persistent real-time chat room powered by Socket.IO.

🚀 Core Features

🔐 Secure Authentication (JWT + Cookies)

🖼 AI Face Matching using DeepFace (ArcFace + RetinaFace)

🤝 Automatic Mutual Match Linking

💬 Persistent Real-Time Chat (Socket.IO)

📁 Profile & AI Image Uploads (Multer)

🗂 Room-based private chat system

📦 MongoDB persistent message storage

⚡ Auto-scroll & real-time UI updates

🛠 Tech Stack
Layer Technology
Runtime Node.js + Express.js
Database MongoDB + Mongoose
Authentication JWT (jsonwebtoken) + bcrypt
Real-Time Socket.IO
Templating EJS
File Uploads Multer (disk storage)
AI / Face Matching Python + DeepFace
Face Model ArcFace
Face Detector RetinaFace
Frontend Bootstrap 5.3 + Vanilla JS
📁 Project Structure
facematch/
│
├── app.js
├── auth.js
├── compare.py
├── .env
│
├── middleware/
│ ├── auth.js
│ └── authentication.js
│
├── models/
│ ├── userModel.js
│ └── chatModel.js
│
├── views/
│ ├── partials/
│ │ ├── nav.ejs
│ │ └── messagebox.ejs
│ ├── signup.ejs
│ ├── login.ejs
│ ├── myprofile.ejs
│ ├── myroom.ejs
│ ├── myroomchats.ejs
│ ├── roombyelse.ejs
│ └── roombyelsechats.ejs
│
└── uploads/
├── profile_photos/
└── ai_faces/
🔄 Application Flow
1️⃣ Sign Up

User provides:

Name

Email

Password

Profile Photo

AI-generated Half-Face Image

Password is hashed using bcrypt (10 salt rounds)

User is redirected to /login

2️⃣ Login

Server verifies password using bcrypt

JWT token (7-day expiry) is created

Token stored in uid cookie

Protected routes validate JWT and fetch full user document

3️⃣ AI Face Comparison

Triggered from /myprofile when user clicks Compare.

Process:

Server copies all other users’ profile photos to a temporary folder

Python script compare.py runs:

DeepFace.find()

Model: ArcFace

Detector: RetinaFace

Matches with:

distance < 0.68

If matched:

Entry saved in user.face_matches

Reciprocal entry saved in face_matches_by_else

Shared room ID generated:

[userA._id, userB._id].sort().join('')

Temporary folder deleted

4️⃣ Real-Time Chat System
Room Types

/myroom → Matches initiated by you

/roombyelse → Matches initiated by others

Chat Flow

Clicking a match opens a dedicated room

Socket.IO joinRoom connects both users

Messages:

Stored in MongoDB

Emitted in real-time

Rendered via EJS

Page auto-scrolls to newest message

🔐 Authentication Architecture
Middleware Used

checkForAuthenticationCookie

Reads JWT from cookie

Sets req.user

restrictToLoggedinUserOnly

Ensures user is authenticated

Fetches full DB document

Global access:

res.locals.user = req.user
⚙️ Installation Guide
1️⃣ Prerequisites

Node.js ≥ 18

MongoDB (local or Atlas)

Python 3.8 – 3.10

2️⃣ Install Node Dependencies
npm install
3️⃣ Install Python Dependencies
pip install deepface tensorflow requests
4️⃣ Create .env File
MONGO_URL=mongodb://localhost:27017/facematch
SECRET=replace_with_a_long_random_string
PORT=8000
PYTHON_PATH=python3

(On Windows, use python instead of python3)

5️⃣ Start Server
node app.js

Open:

http://localhost:8000
🧠 Known Limitations

Face comparison is slow

Python script runs for every comparison

No caching mechanism

Temporary folder copy process is inefficient

No async background processing queue

🔮 Future Improvements

Move storage to AWS S3 / Cloudinary

Add typing indicator

Add online/offline status

Add pagination for feed

Implement background job queue (BullMQ / Redis)

Optimize AI comparison using embeddings caching

Add rate limiting

Add image validation & compression

Improve UI/UX

🏗 Potential Industrial-Level Upgrade Ideas

Microservice architecture (separate AI service)

Use FastAPI for Python service

Use Redis pub/sub for socket scaling

Deploy via Docker

Horizontal scaling with load balancer

Replace polling with event-driven architecture

Store face embeddings instead of reprocessing images

👨‍💻 Author

Developed by Manchikatla Mukeshchandra

This project demonstrates integration of:

AI + Web Backend

Real-time communication

Secure authentication

Cross-language system (Node.js + Python)

Anyone interested can contribute and scale this into a production-grade AI social matching platform.
