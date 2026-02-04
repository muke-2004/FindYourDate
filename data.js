const mongoose = require("mongoose");
const userdb = require("./models/userModel");

main()
  .then(() => {
    console.log("connection successful");
  })
  .catch((e) => {
    console.log(e);
  });

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/mungo");
}

// User.insertMany([
//   {
//     name: "mukeshchandra",
//     email_id: "mukeshchandra@gamil.com",
//     ai_half_photo: "uploads/ai_faces/me_only_aishwarya.png",
//     profile_photo: "uploads/me-only.png",
//     uploaded_at: new Date(),
//   },
// ]);
// .then((data) => console.log(data))
// .catch((err) => console.log(err));
