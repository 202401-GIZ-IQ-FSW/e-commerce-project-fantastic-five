// Importing Requirements
const express = require("express");
require("dotenv").config();

// Importing Database connection info
const connectToMongo = require("./db/connection");

// Importing Routes
const adminRouter = require('./routes/admin');

const app = express();
const port =
  process.env.NODE_ENV === "test"
    ? process.env.NODE_LOCAL_TEST_PORT
    : process.env.NODE_LOCAL_PORT;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Using Routes
app.use('/admin', adminRouter)


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  // Connecting to the Database
  connectToMongo();
});

module.exports = app;
