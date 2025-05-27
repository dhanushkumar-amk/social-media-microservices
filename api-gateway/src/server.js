const dotenv = require('dotenv').config()
const express = require('express')
const cors = require('cors')
const Redis = require('ioredis')
const helmet = require('helmet')
const { rateLimit } = require('express-rate-limit')
const { RedisStore } = require('rate-limit-redis')
const logger = require('./utils/logger')
const proxy = require('express-http-proxy')
const errorHandler = require('./middleware/errorHandler')
const { validateToken } = require('./middleware/auth-midlleware')



const app = express();
const PORT = process.env.PORT || 3000

// redis client creation
const redisClient = new Redis(process.env.REDIS_URL);

// midllewares
app.use(helmet())
app.use(cors())
app.use(express.json())


// ip based rate limiting for sensitive endpoints middleware
const RateLimit = rateLimit({
    windowMs : 15 * 60 * 1000, // time
    max : 100, // request
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
app.use(RateLimit);

// logging purpose middleware only for logging
app.use((req, res, next) => {
    logger.info(`Received ${req.method} request  to ${req.url}`)
    logger.info(`Request body, ${req.body}`)
    next();
})

 // localhost:3000/v1/auth/register ======> localhost:3001/api/auth/register

//  main proxy for converting v1 to api
const proxyOptions = {
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1/, "/api"); // replace v1 => api
    },
    proxyErrorHandler: (err, res, next) => {
        logger.error(`Proxy error : ${err.message}`);
        res.status(500).json({
            message: "internal server error",
            error: err.message
        });
    }
};

// setting up proxy for our identity service
app.use('/v1/auth', proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator : (proxyReqOpts, srcReq) => {  // request headers used by multiple headers
        proxyReqOpts.headers['Content-Type'] = "application/json"
        return proxyReqOpts
    },
    userResDecorator : (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response received from identity service: ${proxyRes.statusCode} `)
        return proxyResData
    }
}));

// setting up proxy for our post service
app.use('/v1/post', validateToken ,proxy(process.env.POST_SERVICE_URL,{
    ...proxyOptions,
     proxyReqOptDecorator : (proxyReqOpts, srcReq) => {  // request headers used by multiple headers
        proxyReqOpts.headers['Content-Type'] = "application/json"
        proxyReqOpts.headers['x-user-id'] = srcReq.user.userId; // for post controller in cretePost
        return proxyReqOpts
    },
     userResDecorator : (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response received from post service: ${proxyRes.statusCode} `)
        return proxyResData
    }
}))

 // setting up proxy for our media service
app.use('/v1/media', validateToken, proxy(process.env.MEDIA_SERVICE_URL, {
  ...proxyOptions,
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    if (srcReq.user && srcReq.user.userId) {
      proxyReqOpts.headers['x-user-id'] = srcReq.user.userId;
    }

    const contentType = srcReq.headers['content-type'];
    if (contentType && !contentType.startsWith('multipart/form-data')) {
      proxyReqOpts.headers['Content-Type'] = 'application/json';
    }

    return proxyReqOpts;
  },
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    logger.info(`Response received from media service: ${proxyRes.statusCode}`);
    return proxyResData;
  },
  parseReqBody: false
}));

 // setting up proxy for our search service
app.use('/v1/search', validateToken ,proxy(process.env.SEARCH_SERVICE_URL,{
    ...proxyOptions,
     proxyReqOptDecorator : (proxyReqOpts, srcReq) => {  // request headers used by multiple headers
        proxyReqOpts.headers['Content-Type'] = "application/json"
        proxyReqOpts.headers['x-user-id'] = srcReq.user.userId; // for post controller in cretePost
        return proxyReqOpts
    },
     userResDecorator : (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response received from search service: ${proxyRes.statusCode} `)
        return proxyResData
    }
}))


// error handler middleware
app.use(errorHandler)


app.listen(PORT, () => {
    logger.info(`API Gateway is running on PORT : ${PORT}`)
    logger.info(`Identity service is running on PORT : ${process.env.IDENTITY_SERVICE_URL}`)
    logger.info(`post service is running on PORT : ${process.env.POST_SERVICE_URL}`)
    logger.info(`media service is running on PORT : ${process.env.MEDIA_SERVICE_URL}`)
    logger.info(`search service is running on PORT : ${process.env.SEARCH_SERVICE_URL}`)
    logger.info(`Redis Url is running on PORT : ${process.env.REDIS_URL}`)
})
