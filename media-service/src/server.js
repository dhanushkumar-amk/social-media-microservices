require('dotenv').config();
const express = require('express')
const connectDB = require('./config/db')
const helmet = require('helmet')
const cors = require('cors');
const logger = require('./utils/logger');
const mediaRoutes = require('./routes/media-routes');
const errorHandlers = require('./middleware/errorHandler');
const { connectToRabbitMq, consumeEvents } = require('./utils/rabbitmq');
const { handlePostDeleted } = require('./eventHandlers/mediaEventHanlders');



const app = express();
const PORT = process.env.PORT || 3003

// database
connectDB()


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

app.use('/api/media', mediaRoutes)

// error handlers
app.use(errorHandlers)

async function startServer() {
    try {
      await connectToRabbitMq();
      // consume all events
      await consumeEvents('post.deleted', handlePostDeleted)
      
     app.listen(PORT, () => {
    logger.info(`media service running on port : ${PORT}` )
    })
    } catch (error) {
        logger.error("Failed to connect to server", error)
        process.exit(1);
    }
}

startServer();
