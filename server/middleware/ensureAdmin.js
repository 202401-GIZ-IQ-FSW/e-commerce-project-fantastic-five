const User = require('../models/user');
const sendResponse = require('./sendResponse');

const ensureAdmin = async (req, res, next) => {
    //  Check if the user exist in the database
    const user = await User.findById(req.session?.user?._id)
    // If the user is not found
    if (!user) {
        return sendResponse(req, res, 403, 'redirect', '/user/signin', 'error', 'Unauthorized the user either does not exist or is not signed in');
    }
    // If the user is found, we check if he is an admin or not
    if (!user.isAdmin) {
        return sendResponse(req, res, 403, 'redirect', '/', 'error', 'Unauthorized the user is not an admin');
    }
    // If the user is found and he is an admin, we allow the request to be processed by passing the execution to the next function
    next();
}

module.exports = ensureAdmin;
