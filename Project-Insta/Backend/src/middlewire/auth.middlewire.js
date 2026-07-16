const jwt = require('jsonwebtoken');

async function identifyUser(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    let decode=null;
    try {
        decode = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    // Added the decoded user information to the request object for further use in the route handlers
    req.user = decode;
    next(); // Proceed to the next middleware or route handler
}

module.exports = identifyUser;
