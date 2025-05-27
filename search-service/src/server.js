require('dotenv').config()
const express = require('express');
const Redis = require('ioredis')
const cors = require('cors')
const helmet = require('helmet')
const errorHandler = require('./middleware/errorHandler')
const connectDB = require('./config/db')
const logger = require('./utils/logger');
const { connectToRabbitMq, consumeEvents } = require('./utils/rabitmq');
const { search } = require('./routes/searchRoutes');
const { handlePostCreated } = require('./eventHandler/searchEvntHandlers');


const app = express();
const PORT = process.env.PORT || 3004

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

app.use("/api/search", search)

//error handlers
app.use(errorHandler);

async function startServer() {
    try {
        await connectToRabbitMq();

        // consume to events/ suscribe to the events
        await  consumeEvents("post-created", handlePostCreated)

        app.listen(PORT, () => {
    logger.info(`Search service running on port : ${PORT}` )
    })
    } catch (error) {
        logger.error("Failed to connect to server", error)
        process.exit(1);
    }
}

startServer();
