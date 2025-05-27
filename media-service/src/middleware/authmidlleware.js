const logger = require('../utils/logger')


const isAuthenticatedRequest = (req, res, next) => {
    const userId = req.headers["x-user-id"] // get from api gateway

    if(!userId){
        logger.warn("Access attempted without user id");
        res.status(401).json({
            success : false,
            message : "Authntication required, pls login to continue"
        })
    }
    req.user = { userId };
    next();
}


module.exports = { isAuthenticatedRequest }
