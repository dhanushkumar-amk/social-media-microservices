const logger = require("../utils/logger");
const jwt = require('jsonwebtoken')

const validateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];

    if(!token){
        logger.warn("Access attempt without valid token")
        return res.status(401).json({
            success : false,
            message : "Authentication required",
        })
    }

jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
    if(error){
        logger.warn("invalid token")
        return res.status(429).json({
            success : false,
            message : "invalid token",
        })
    }
    req.user = user;
    next();
})
}

module.exports = { validateToken }
