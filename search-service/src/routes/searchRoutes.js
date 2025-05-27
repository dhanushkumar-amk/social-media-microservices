const express = require('express')
const { isAuthenticatedRequest } = require('../middleware/authmidlleware');
const { searchPostController } = require('../controllers/searcController');

const router = express.Router();

 //create middleware to check if the user is login or not for every request
router.use(isAuthenticatedRequest)

router.get("/search", searchPostController)

module.exports = router;
