
function sendResponse(req, res, status, action, target, key, message, user={}) {
    const responseObject = {};
    responseObject[key] = message;
    if (req.headers['user-agent'] && req.headers['user-agent'].includes('Postman')) {
        if (Object.keys(user).length === 0) {
            return res.status(status).send(responseObject);
          }
        return res.status(status).send({ ...responseObject, user });
    } else {
      if (action === 'redirect') {
        return res.status(status).redirect(target);
      } else if (action === 'render') {
        return res.status(status).render(target, responseObject);
      }
    }
  }

  module.exports = sendResponse; 