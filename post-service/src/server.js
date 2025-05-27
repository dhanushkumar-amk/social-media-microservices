const dotenv = require('dotenv').config();

const express = require('express')
const Redis = require('ioredis')
const cors = require('cors')
const helmet = require('helmet')


const errorHandler = require('./middleware/errorHandler')
const connectDB = require('./config/db')
const logger = require('./utils/logger');
const  post  = require('./routes/post-routes');
const { connectToRabbitMq } = require('./utils/rabitmq');


const app = express();
const PORT = process.env.PORT || 3002

// mongoDB connection
connectDB();

// create the redis client
const redisClient = new Redis(process.env.REDIS_URL)


// middlewares
app.use(helmet())
app.use(cors())
app.use(express.json())

// logging purpose middleware only for logging
app.use((req, res, next) => {
    logger.info(`Received ${req.method} request  to ${req.url}`)
    logger.info(`Request body, ${req.body}`)
    next();
})

// routes and pass redis client
app.use('/api/post', (req, res, next) =>{
    req.redisClient = redisClient // we use redis client on controllers
    next()
}, post)

//error handlers
app.use(errorHandler);

async function startServer() {
    try {
        await connectToRabbitMq();
        app.listen(PORT, () => {
    logger.info(`Post service running on port : ${PORT}` )
    })
    } catch (error) {
        logger.error("Failed to connect to server", error)
        process.exit(1);
    }
}

startServer();
