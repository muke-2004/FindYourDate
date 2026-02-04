const mongoose = require("mongoose");

const database = mongoose
  .connect("mongodb://127.0.0.1:27017/MUNGO")
  .then(() => {
    console.log("Database connected MONGOSE DB");
  })
  .catch((err) => {
    console.log(`error occured${err}`);
  });

module.exports = database;
