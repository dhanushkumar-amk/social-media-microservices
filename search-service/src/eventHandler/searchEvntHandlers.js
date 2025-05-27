const Search = require("../models/search");
const logger = require("../utils/logger");

async function handlePostCreated(event) {

    try {
        const newSearchPost = new Search({
            postId : event.postId,
            userId : event.userId,
            content : event.content,
            createdAt : event.createdAt
        })

        await newSearchPost.save();

        logger.info("Search posr created : ", event.postId, newSearchPost._id.toString())

    } catch (error) {
        logger.error("Error handling on ")
    }
}

module.exports = { handlePostCreated }
