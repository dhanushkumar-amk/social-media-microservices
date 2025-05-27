

const Post = require('../models/post')
const logger = require('../utils/logger');
const { publishEvent } = require('../utils/rabitmq');
const { validateCreatePost } = require('../utils/validation');

async function invalidatePostcache(req, input) {

    const cachedKey = `post:${input}`
    await req.redisClient.del(cachedKey);

    const keys  = await req.redisClient.keys("post:*");
    if(keys.length > 0){
        await req.redisClient.del(keys)
    }
}

const createPost = async(req, res) =>  {
    logger.info("create post endpoint hit")
    try {

        const { error } = validateCreatePost(req.body);

        if(error){
         logger.warn('validation error', error.details[0].message);
         return res.status(400).json({
            success : false,
            message : error.details[0].message
         })
        }

        const {content, mediaIds} = req.body;
        const newlyCreatedPost = new Post({
            user : req.user.userId,  // it get from auth middleware
            content,
            mediaIds : mediaIds || []
        })

        await newlyCreatedPost.save();
        await invalidatePostcache(req, newlyCreatedPost._id.toString())
        logger.info("Post created successflly", newlyCreatedPost)
       return res.status(201).json({
            success : true,
            message : "Post created successflly"
        })

    } catch (error) {
        logger.error("Error on creating post....");
        res.status(500).json({
            success : false,
            message : "Internal error",
            error : error.message
        })
    }
}

const getAllPost = async(req, res) =>  {
    logger.info("get allPost endpoint hit")
    try {

        // pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10
        const startIndex = (page - 1) * limit;

        const cacheKey = `post:${page}:${limit}`; // for a key identification on redis purpose
        const cachedPosts = await req.redisClient.get(cacheKey) // on server.js file

        // if post is already in redis cache then simply return it
        if(cachedPosts){
            return res.json(JSON.parse(cachedPosts))
        }

        const posts = await Post
        .find({})
        .sort({createdAt : -1}) // sort by createdAt in descending order
        .skip(startIndex) // skip the first n posts
        .limit(limit); // limit the number of posts

        const totalNumberOfPosts = await Post.countDocuments()

        const results = {
            posts,
            currentPage : page,
            totalPages : Math.ceil(totalNumberOfPosts / limit),
            totalPosts : totalNumberOfPosts
        }

        // save your posts on redis cache
        await req.redisClient.setex(cacheKey, 300, JSON.stringify(results)) // the post will automatically deletd after 300sec =>5 mins

        res.json(results);

    } catch (error) {
        logger.error("Error on fetching all  post....");
        res.status(500).json({
            success : false,
            message : "Internal error"
        })
    }
}

const getSinglepost = async(req, res) =>  {
    logger.info("get single post endpoint hit")
    try {

        const postId = req.params.id;
        const cacheKey = `post:${postId}`
        const cachedPost = await req.redisClient.get(cacheKey);

        if(cachedPost){
            return res.json(JSON.parse(cachedPost))
        }

        const singlePostDetailsById = await Post.findById(postId);
        if(!singlePostDetailsById){
            return res.status(404).json({
                message : "Post not found",
                success : false
            })
        }

        await req.redisClient.setex(cacheKey, 3600, JSON.stringify(singlePostDetailsById))

        res.json(singlePostDetailsById);

    } catch (error) {
        logger.error("Error on get post....");
        res.status(500).json({
            success : false,
            message : "Internal error",
            error : error.message
        })
    }
}

const deletePost = async(req, res) =>  {
    logger.info("delete post endpoint hit")
    try {
        const post = await Post.findOneAndDelete({
            _id : req.params.id,
            user : req.user.userId
        })

        if(!post){
            return res.status(404).json({
                message : "Post not found",
                success : false
            })
        }

        // publish post delete evnet via RabbitMQ
        await publishEvent('post.deleted', {
            postId : post._id.toString(),
            userId : req.user.userId,
            mediaIds : post.mediaIds
        });

        await invalidatePostcache(req, req.params.id)

        res.json({
            message : "post deleted sucessfully",
        })

    } catch (error) {
        logger.error("Error on delete post....");
        res.status(500).json({
            success : false,
            message : "Internal error"
        })
    }
}




module.exports = { createPost, getAllPost, getSinglepost, deletePost }
