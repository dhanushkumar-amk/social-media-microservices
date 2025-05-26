
const mongoose = require('mongoose')
const logger = require('../utils/logger')

 async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        logger.info("mongoDB connected successfully")
    } catch (error) {
        logger.error("mongoDB connection error ",error)
    }
}

module.exports = connectDB;
