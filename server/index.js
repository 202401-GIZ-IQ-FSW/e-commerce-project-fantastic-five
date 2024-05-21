// Importing Requirements
const express = require("express");
require("dotenv").config();
const session = require('express-session');

// Importing Database connection info
const connectToMongo = require("./db/connection");

// Importing Routes
const adminRoutes = require('./routes/admin');
const customerRoutes = require('./routes/customer');
const authRouter = require('./routes/auth');

// Importing Middlewares
const ensureAuthenticated = require('./middleware/ensureAuthenticated');
const ensureAdmin = require('./middleware/ensureAdmin');

// Importing CORS 
const cors = require("cors");

const app = express();
const port =
  process.env.NODE_ENV === "test"
    ? process.env.NODE_LOCAL_TEST_PORT
    : process.env.NODE_LOCAL_PORT;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Use CORS middleware globally
app.use(cors());

// Configure session options
const sessionOptions = {
  secret: process.env.SECRET_KEY,
  name: 'sid',
  resave: false, // don't save the sessions back to the session store
  saveUninitialized: false, // don't save uninitialized sessions to the session store
  cookie: {},
};

// check if in production environment
const isProduction = app.get('env') === 'production';

if (isProduction) {
  app.set('trust proxy', 1); // trust first proxy
  sessionOptions.cookie.secure = true; // serve secure cookies
}

// use the session
app.use(session(sessionOptions));

// attach user to session
function attachUser(req, res, next) {
  res.locals.user = req.session?.user ?? null;
  next();
}

// use the attachUser function
app.use(attachUser)

// Using Routes for User Auth
app.use('/user', authRouter);

// Using Routes for admin
app.use('/admin', ensureAuthenticated, ensureAdmin, adminRoutes);

// Using Routes for customers
app.use("/customer", ensureAuthenticated, customerRoutes);

app.listen(port, async () => {
  console.log(`Server listening on port ${port}`);
  // Connecting to the Database
  await connectToMongo();
});

module.exports = app;
