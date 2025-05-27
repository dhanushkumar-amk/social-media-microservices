
const mongoose = require('mongoose')
const logger = require('../utils/logger')

 async function connectDB() {
    try {
        await mongoose.connect("mongodb+srv://dk6032907:ty7PoPDiLw389n0X@cluster-mern.bwafrzq.mongodb.net/microservices-auth?retryWrites=true&w=majority&appName=cluster-mern");
        logger.info("mongoDB connected successfully")
    } catch (error) {
        logger.error("mongoDB connection error ",error)
    }
}

module.exports = connectDB;
