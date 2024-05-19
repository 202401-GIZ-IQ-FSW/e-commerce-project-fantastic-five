const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const User = require('../models/user');
const ensureAuthenticated = require('../middleware/ensureAuthenticated');

// Handles sign in request coming from sign in page
router.post('/signin', async (req, res) => {

  const { email, password } = req.body;

  // User must exist in the database for sign in request
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).send({ message: 'Wrong username' });
  }

  // bcrypt compare is used to validate the plain text password sent in the request body with the hashed password stored in the database
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(400).send({ message: 'Wrong password' });
  }

  // If password is valid, it's a sign in success User details is returned in response and session
  res.setHeader('user', user._id);
  req.session.user = user;
  res.json({ message: 'SignIn Success', user });
});

// Handles sign up request coming from sign up page
router.post('/signup', async (req, res) => {
  const {
    name,
    email,
    password
  } = req.body;

  // User must not exist in the database for sign up request
  let user = await User.findOne({ email });
  if (user) {
    return res.status(400).send({ message: `${email}: email already exist` });
  }

  // bcrypt is used to hash the user's plain text password with 10 salt rounds
  /* The higher the saltRounds value, the more time the hashing algorithm takes.
  should select a number that is high enough to prevent attacks,
  but not slower than potential user patience. The default value is 10.
  */
  const password_hash = await bcrypt.hash(password, 10);

  // Create the user record on the database
  user = await User.create({
    name,
    email,
    password: password_hash
  });

  // Once user record is created, it's a sign up success user details is returned in response and session
  res.setHeader('user', user._id);
  req.session.user = user;
  res.status(201).json({ message: 'SignUp Success', user });
});

// Handles sign out request
router.get('/signout', ensureAuthenticated, (req, res) => {
  // express session destroy function is used to destroy the session and unset the req.session property
  req.session.destroy();
  res.send({ message: 'SignOut Success' });
});




router.get('/sucess', ensureAuthenticated, (req, res) => {
  const userid = req.ensureAuthenticated.user.id;
  res.json(userid);
});

module.exports = router;
