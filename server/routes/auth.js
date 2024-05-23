const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const User = require('../models/user');
const ensureAuthenticated = require('../middleware/ensureAuthenticated');

// Handles sign in request coming from sign in page
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // User must exist in the database for sign in request
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send({ message: 'Wrong email' });
    }

    // bcrypt compare is used to validate the plain text password sent in the request body with the hashed password stored in the database
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).send({ message: 'Wrong password' });
    }

    // If the user is already signed in don't sign in again
    if (req.session?.user) {
      return res.status(400).send({ message: 'User already signed in' });
    }

    // Regenerate session ID is used to prevent session fixation attacks
    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).send({ message: 'Could not regenerate session' });
      }
      // If password is valid, it's a sign in success. User details are returned in response and session
      req.session.user = user;
      res.json({ message: 'SignIn Success', user });
    });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

// Handles sign up request coming from sign up page
router.post('/signup', async (req, res) => {
  try {
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

    // Create the user record on the database
    user = await User.create({
      name,
      email,
      password
    });

    // Once user record is created, it's a sign up success user details is returned in response and session
    // Regenerate session ID is used to prevent session fixation attacks
    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).send({ message: 'Could not regenerate session' });
      }
      req.session.user = user;
      res.status(201).json({ message: 'SignUp Success', user });
    });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

// Handles sign out request
router.get('/signout', ensureAuthenticated, async (req, res) => {
  try {
      // express session destroy function is used to destroy the session and unset the req.session property
      req.session.destroy();
      res.send({ message: 'SignOut Success' });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

module.exports = router;
