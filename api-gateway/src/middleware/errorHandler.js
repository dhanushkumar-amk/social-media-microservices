const logger = require('../utils/logger')
const errorHandlers = (err, req, res, next) => {
    logger.error(err.stack);
    res.status(err.status  || 500)
    .json({
        message : err.message || "Internal server error"
    })
}

module.exports = errorHandlers;
