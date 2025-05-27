const logger = require("../utils/logger")
const Search = require('../models/search')


const searchPostController = async(req, res) => {
    logger.info("Search post controller called")
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ message: "Query is required" });
        }

        // Assuming Search is the model for the search posts
        const Search = req.app.get('SearchModel'); // Get the Search model from app locals

        // Perform text search on the content field
        const results = await Search.find({ $text: { $search: query }}, {score : {$meta : 'textScore'}})
            .sort({ createdAt: -1 }) // Sort by createdAt in descending order
            .limit(10); // Limit results to 10

        res.status(200).json(results);
    } catch (error) {
        logger.error("Error in search post controller", error)
        res.status(500).json({ message: "Internal Server Error" })
    }
}

module.exports =  {searchPostController}
