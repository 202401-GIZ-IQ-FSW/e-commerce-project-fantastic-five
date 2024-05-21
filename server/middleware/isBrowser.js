
function isBrowser(req, res) {

    if (req.headers['user-agent'] && req.headers['user-agent'].includes('Postman')) {
        return false;
    } else {
        return true;
    }
};

module.exports = isBrowser; 