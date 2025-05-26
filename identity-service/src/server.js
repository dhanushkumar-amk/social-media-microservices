const express = require('express')
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const helmet = require('helmet')
const cors = require('cors');
const logger = require('./utils/logger');
const Redis = require('ioredis')
const { RateLimiterRedis } = require('rate-limiter-flexible')
const { rateLimit } = require('express-rate-limit')
const { RedisStore } = require("rate-limit-redis")
const routes = require('./routes/identity-service');
const errorHandlers = require('./middleware/errorHandler');


dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001

// database
connectDB()

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

// prevent DDos attack and implement Rate Limiting
const rateLimter = new RateLimiterRedis({
    storeClient : redisClient, // local redis connection
    keyPrefix : 'middleware', // prefix for all key that are store in redis there are many so it is used to identify easily so every key added the front, ex : User =>  ("midlwareUser") like this
    points : 10, // max request
    duration : 1, // make 10 request on one second
})

// ratelimeter based on ip address
app.use((req, res, next) => {
    rateLimter.consume(req.ip).then(() => next()).catch(() => {
        logger.warn(`Rate limiter exceedd for IP : ${req.ip}`)
        res.status(429).json({
            success : false,
            message : "Too many request..."
        })
    })
})


// ip based rate limiting for sensitive endpoints
const sesitiveEndPointLimiter = rateLimit({
    windowMs : 15 * 60 * 1000, // time
    max : 50, // request
    standardHeaders : true, // say the rate limter includes the response headers or not
    legacyHeaders : false,
    handler : (req, res) => {
        logger.warn(`Sensitive endpoint rate limit exceeded for IP : ${req.ip}`)
         res.status(429).json({
            success : false,
            message : "Too many request..."
        })
    },
    store : new RedisStore({
        sendCommand : (...args) => redisClient.call(...args),
    }),
})

// apply sesitiveEndPointLimiter to our routes
app.use('/api/auth/register', sesitiveEndPointLimiter)

// routes
app.use("/api/auth", routes)


// error handlers
app.use(errorHandlers)


app.listen(PORT, () => {
    logger.info(`Identity service running on port : ${PORT}` )
})

// unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason instanceof Error ? reason.stack : JSON.stringify(reason)}`);
    process.exit(1); // Optionally exit the process or handle gracefully
});
