const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const User = require('../models/user');

const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME, TEST_DB_HOST, ADMIN_EMAIL, ADMIN_PASS } =
  process.env;

const DB_URI = `mongodb://${DB_USER}:${DB_PASSWORD}@${
  process.env.NODE_ENV === "test" ? TEST_DB_HOST : DB_HOST
}:${DB_PORT}/${DB_NAME}?authSource=admin`;

const url = DB_URI;

const connectToMongo = async () => {
  mongoose.connect(url, { useNewUrlParser: true });

  db = mongoose.connection;

  db.once("open", () => {
    console.log("Database connected: ", url);
  });

  db.on("error", (err) => {
    console.error("Database connection error: ", err);
  });
  // Create the root admin and add it to the database for initial start
  const adminExists = await User.exists({ email: ADMIN_EMAIL});
  // If admin root doesn't exist, we create it
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash(ADMIN_PASS, 10); // Hash the password
    const admin = await new User({
      name: 'Root Admin',
      email: ADMIN_EMAIL,
      password: hashedPassword,
      isAdmin: true
    });
    await admin.save();
    console.log('Admin root user created');
  } else {
    console.log('Admin root user already exists');
  }
};

module.exports = connectToMongo;
