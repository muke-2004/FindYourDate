# Real-Time Chat Application

FaceMatch lets users upload an AI-generated half-face image. The app compares it against other users' profile photos using Python's DeepFace library (ArcFace model + RetinaFace detector). When a match is found below the distance threshold, both users are linked in a persistent, real-time chat room powered by Socket.io.

🛠️ Tech Stack

Layer | Technology
Runtime | Node.js + Express.js
Database | MongoDB via Mongoose ODM
Authentication | JWT (jsonwebtoken) + bcrypt, cookie-based
Real-time | Socket.io
Templating | EJS
File Uploads | Multer (disk storage)
AI / Face Matching | Python · DeepFace · ArcFace · RetinaFace
Frontend | Bootstrap 5.3 + vanilla JS

📁 Project Structure
facematch/
├── app.js # Express server, Socket.io, all routes
├── auth.js # createTokenForUser / validateTokenForUser (JWT)
├── compare.py # DeepFace face-matching script
├── .env # MONGO_URL, SECRET, PORT, PYTHON_PATH
├── middleware/
│ ├── auth.js # restrictToLoggedinUserOnly (full DB user)
│ └── authentication.js # checkForAuthenticationCookie (sets req.user)
├── models/
│ ├── userModel.js # User schema with face_matches arrays
│ └── chatModel.js # Chat room + messages schema
├── views/
│ ├── partials/
│ │ ├── nav.ejs
│ │ └── messagebox.ejs
│ ├── signup.ejs / login.ejs / myprofile.ejs
│ ├── myroom.ejs # Matches you initiated
│ ├── myroomchats.ejs # Chat for your matches
│ ├── roombyelse.ejs # Matches others initiated with you
│ └── roombyelsechats.ejs # Chat for others' matches
└── uploads/
├── <profile photos>
└── ai_faces/ #AI generated images

🔄 How It Works
Step 1 — Sign Up
• Fill in name, email, password, a profile photo, and an AI-generated half-face image.
• Password is hashed with bcrypt (10 salt rounds) before saving.
• On success you are redirected to /login.

Step 2 — Log In
• Server verifies bcrypt hash, issues a JWT (7-day expiry), and sets it as the uid cookie.
• Every protected route validates this JWT and fetches the full user document from MongoDB.

Step 3 — Face Compare
• Click Compare on /myprofile.
• Server copies all other users' profile photos to a temporary folder.
• Python compare.py runs DeepFace.find() using ArcFace + RetinaFace.
• Matches with distance < 0.68 are saved to user.face*matches.
• The matched user receives a reciprocal entry in their face_matches_by_else array.
• A shared room_Id is generated: [userA._id, userB._id].sort().join('*').
• Temp folder is deleted after processing.

Step 4 — Real-Time Chat
• Navigate to /myroom (matches you found) or /roombyelse (matches found by others).
• Clicking a match opens a dedicated chat page.
• Socket.io joinRoom places both users in the same named room.
• Messages are persisted to MongoDB on every send.
• Previous messages are loaded server-side and rendered in the EJS template.
• Page auto-scrolls to the latest message on load.

# Anyone intrested on this project can make changes to it.

1 · Prerequisites
• Node.js ≥ 18
• MongoDB running locally or a MongoDB Atlas URI
• Python 3.8–3.10 with pip

2 · Install Node dependencies
npm install

3 · Install Python dependencies
pip install deepface tensorflow requests

4 · Create .env file
MONGO_URL=mongodb://localhost:27017/facematch
SECRET=replace_with_a_long_random_string
PORT=8000
PYTHON_PATH=python3 # or 'python' on Windows

5 · Start the server
node app.js
Then open http://localhost:8000

🧠 Future Improvements

•Move file storage to Cloudinary / AWS S3
•Add Typing status
•Add online status
•Add pagination for public feed

⚠️ Known Limitations
• Comparing route is too slow because of the logic. The python file runs for every comparision of an ai-image with the every profile image.

👨‍💻 Author
Developed by <strong>Manchikatla Mukeshchandra</strong>
-This idea can be make into industrial level project any one intrested can take up the project and make it live
