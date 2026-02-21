# 🎭 FaceMatch – Real-Time AI Face Matching Chat Application

FaceMatch allows users to upload an AI-generated half-face image and match it against other users' profile photos using AI-powered face recognition.

When a match is detected below a defined similarity threshold, both users are automatically linked in a persistent real-time chat room powered by Socket.IO.

---

## 🚀 Core Features

- 🔐 **Secure Authentication** (JWT + Cookies)
- 🖼️ **AI Face Matching** using DeepFace (ArcFace + RetinaFace)
- 🤝 **Automatic Mutual Match Linking**
- 💬 **Persistent Real-Time Chat** (Socket.IO)
- 📁 **Profile & AI Image Uploads** (Multer)
- 🏠 **Room-based private chat system**
- 🗄️ **MongoDB persistent message storage**
- ⚡ **Auto-scroll & real-time UI updates**

---

## 🔧 Tech Stack

| Layer              | Technology                  |
| ------------------ | --------------------------- |
| Runtime            | Node.js + Express.js        |
| Database           | MongoDB + Mongoose          |
| Authentication     | JWT (jsonwebtoken) + bcrypt |
| Real-Time          | Socket.IO                   |
| Templating         | EJS                         |
| File Uploads       | Multer (disk storage)       |
| AI / Face Matching | Python + DeepFace           |
| Face Model         | ArcFace                     |
| Face Detector      | RetinaFace                  |
| Frontend           | Bootstrap 5.3 + Vanilla JS  |

---

## 📁 Project Structure

```
facematch/
├── app.js
├── auth.js
├── compare.py
├── .env
├── middleware/
│   ├── auth.js
│   └── authentication.js
├── models/
│   ├── userModel.js
│   └── chatModel.js
├── views/
│   ├── partials/
│   │   ├── nav.ejs
│   │   └── messagebox.ejs
│   ├── signup.ejs
│   ├── login.ejs
│   ├── myprofile.ejs
│   ├── myroom.ejs
│   ├── myroomchats.ejs
│   ├── roombyelse.ejs
│   └── roombyelsechats.ejs
└── uploads/
    ├── profile_photos/
    └── ai_faces/
```

---

## 🔄 Application Flow

### 1️⃣ Sign Up

User provides:

- Name, Email, Password
- Profile Photo
- AI-generated Half-Face Image

Password is hashed using **bcrypt** (10 salt rounds), then the user is redirected to `/login`.

### 2️⃣ Login

- Server verifies password using bcrypt
- JWT token with **7-day expiry** is created and stored in the `uid` cookie
- All protected routes validate the JWT and fetch the full user document from MongoDB

### 3️⃣ AI Face Comparison

Triggered from `/myprofile` when the user clicks **Compare**.

**Process:**

1. Server copies all other users' profile photos to a temporary folder
2. Python script `compare.py` runs `DeepFace.find()` with:
   - Model: **ArcFace**
   - Detector: **RetinaFace**
   - Match threshold: `distance < 0.68`
3. If matched:
   - Entry saved in `user.face_matches`
   - Reciprocal entry saved in the matched user's `face_matches_by_else`
   - Shared room ID generated: `[userA._id, userB._id].sort().join('_')`
4. Temporary folder is deleted after processing

### 4️⃣ Real-Time Chat System

**Room Types:**

- `/myroom` → Matches initiated by you
- `/roombyelse` → Matches initiated by others

**Chat Flow:**

1. Clicking a match opens a dedicated room
2. Socket.IO `joinRoom` connects both users
3. Messages are stored in MongoDB, emitted in real-time, and rendered via EJS
4. Page auto-scrolls to the newest message on load

---

## 🔒 Authentication Architecture

| Middleware                     | Purpose                                           |
| ------------------------------ | ------------------------------------------------- |
| `checkForAuthenticationCookie` | Reads JWT from cookie, sets `req.user` globally   |
| `restrictToLoggedinUserOnly`   | Guards protected routes, fetches full DB document |

`res.locals.user = req.user` makes the logged-in user available across all EJS templates.

---

## ⚙️ Installation Guide

### 1️⃣ Prerequisites

- Node.js ≥ 18
- MongoDB (local or Atlas)
- Python 3.8 – 3.10

### 2️⃣ Install Node Dependencies

```bash
npm install
```

### 3️⃣ Install Python Dependencies

```bash
pip install deepface tensorflow requests
```

### 4️⃣ Create `.env` File

```env
MONGO_URL=mongodb://localhost:27017/facematch
SECRET=replace_with_a_long_random_string
PORT=8000
PYTHON_PATH=python3
```

> On Windows, use `python` instead of `python3`

### 5️⃣ Start the Server

```bash
node app.js
```

Open: [http://localhost:8000](http://localhost:8000)

---

## ⚠️ Known Limitations

- Face comparison runs synchronously — slow for large user bases
- Python script spawns fresh on every comparison with no embedding cache
- Temporary folder copy process is inefficient
- No background job queue for async processing

---

## 🛠️ Future Improvements

- [ ] Add typing indicator (code already in place — just uncomment)
- [ ] Add online / offline status
- [ ] Add pagination for long chat histories
- [ ] Implement background job queue (BullMQ / Redis)
- [ ] Cache face embeddings to speed up comparisons
- [ ] Add rate limiting on login and compare routes
- [ ] Add image validation & compression on upload
- [ ] Move file storage to AWS S3 / Cloudinary
- [ ] Improve overall UI/UX

---

## 🏭 Potential Industrial-Level Upgrades

- Microservice architecture with a dedicated AI service
- Use **FastAPI** for the Python face-matching service
- Use **Redis pub/sub** for horizontal Socket.IO scaling
- Containerise with **Docker**
- Deploy behind a load balancer for horizontal scaling
- Replace request-response pattern with event-driven architecture
- Store face embeddings in DB instead of reprocessing images on every compare

---

## 👤 Author

**Developed by Manchikatla Mukeshchandra**

This project demonstrates integration of:

- AI + Web Backend
- Real-time communication
- Secure authentication
- Cross-language system (Node.js + Python)

Anyone interested can contribute and scale this into a production-grade AI social matching platform.
