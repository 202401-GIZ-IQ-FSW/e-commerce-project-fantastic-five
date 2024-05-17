module.exports = (req, res, next) => {
    // Check if user session is active, that is if user is already authenticated
    if (!req.session?.user) {
      // The HTTP 403 Forbidden response status code is sent which indicates that the server refuses to authorize the request.
      res.status(403).send({ message: "Unauthorized the user is not signed in"});
    } else {
      // if the user is signed in, we allow the request to be processed by passing the execution to the next function
      next();
    }
  };

