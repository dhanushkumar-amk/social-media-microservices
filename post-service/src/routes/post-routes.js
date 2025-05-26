const express = require('express')
const { createPost, getAllPost, getSinglepost, deletePost } = require('../controllers/postControllers')
const { isAuthenticatedRequest } = require('../middleware/authmidlleware')


const router = express.Router();

 //create middleware to check if the user is login or not for every request
router.use(isAuthenticatedRequest)

router.post("/create-post", createPost )
router.get("/posts", getAllPost )
router.get("/single-post/:id", getSinglepost )
router.delete("/delete/:id", deletePost )



module.exports = router;
