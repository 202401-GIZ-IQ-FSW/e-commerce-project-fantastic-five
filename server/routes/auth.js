const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const User = require('../models/user');
const ensureAuthenticated = require('../middleware/ensureAuthenticated');

// changed
// const sendResponse = require('../middleware/sendResponse');
const isBrowser = require('../middleware/isBrowser');

// Handles sign in request coming from sign in page
router.post('/signin', async (req, res) => {

    const { email, password} = req.body;

    // User must exist in the database for sign in request
    const user = await User.findOne({ email });

    // changed
    if (!user) {
      if (isBrowser(req, res)) {
        return res.status(400).render('user/signin', { error: 'Wrong email' });
      }
        return res.status(400).send({ message: 'Wrong email' });
    }

    // bcrypt compare is used to validate the plain text password sent in the request body with the hashed password stored in the database
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      if (isBrowser(req, res)) {
        return res.status(400).render('user/signin', { error: 'Wrong password' });
      }
        return res.status(400).send({ error: 'Wrong password' });
    }
  
    if (req.session?.user) {
      if (isBrowser(req, res)) {
        return res.status(400).redirect('/');
      }
        return res.status(400).send({ message: 'User already signed in' });
    }

    // If password is valid, it's a sign in success User details is returned in response and session
    res.setHeader('user', user._id);
    req.session.user = user;
    if (isBrowser(req, res)) {
      return res.status(200).redirect('/user/authenticated');
    }
    return res.json({ message: 'SignIn Success', user });
  });
  
  // Handles sign up request coming from sign up page
  router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    // User must not exist in the database for sign up request
    let user = await User.findOne({ email });
    if (user) {
      if (isBrowser(req, res)) {
        return res.status(400).render('user/signup', { error: `${email}: email already exist` });
      }
        return res.status(400).send({ error: `${email}: email already exist` });
    }
  
    // bcrypt is used to hash the user's plain text password with 10 salt rounds
    /* The higher the saltRounds value, the more time the hashing algorithm takes.
    should select a number that is high enough to prevent attacks,
    but not slower than potential user patience. The default value is 10.
    */
    const password_hash = await bcrypt.hash(password, 10);
  
    // Create the user record on the database
    user = await User.create({name,email,password: password_hash});
  
    // Once user record is created, it's a sign up success user details is returned in response and session
    res.setHeader('user', user._id);
    req.session.user = user;
    if (isBrowser(req, res)) {
      return res.status(201).redirect('/user/authenticated');
    }
    return res.status(201).json({ message: 'SignUp Success', user });
  });
  
  // Handles sign out request
  router.get('/signout', ensureAuthenticated(), (req, res) => {
    // express session destroy function is used to destroy the session and unset the req.session property
    req.session.destroy();
    if (isBrowser(req, res)) {
      return res.status(200).redirect('/');
    }
    return res.status(200).send({ message: 'SignOut Success'});
  });
  
// changed
// Renders sign up page
router.get('/signup', (req, res) => {
  // If user session is active, then they cannot sign up redirect to home page
  if (!req.session?.user) res.render('user/signup');
  else res.redirect('/');
});

// Renders sign in page
router.get('/signin', (req, res) => {
  // If user session is active, then they cannot sign in so redirect to home page
  if (!req.session?.user) res.render('user/signin');
  else res.redirect('/');
});

// Renders intermediate page after authentication which auto-redirects to home page after 3 seconds
router.get('/authenticated', ensureAuthenticated('/'), (req, res) => {
  res.render('user/authenticated');
});

router.get('/sucess', ensureAuthenticated, (req, res) => {
  const userid = req.ensureAuthenticated.user.id;
  res.json(userid);
});

module.exports = router;
