
const RefreshTokenModel = require('../models/refreshToken')
const logger = require('../utils/logger')
const { validateRegistration } = require('../utils/validation')
const User = require('../models/userModel')
const genrateTokens = require('../utils/generateToken')

const registerUser = async(req, res) => {
    logger.info("Register endpoint hit...")
    try {
        const { error } = validateRegistration(req.body);

        if(error){
         logger.warn('validation error', error.details[0].message);
         return res.status(400).json({
            success : false,
            message : error.details[0].message
         })
        }

        const {userName, email, password} = req.body;

        // check user already present or not
        let user = await User.findOne({ $or : [{email}, {userName}]})
        if(user){
            logger.warn('User already exists');
            return res.status(400).json({
            success : false,
            message : "User already exists"
         })
        }

        //if not present then create the user
        user = new User({
            userName,
            email,
            password
        })
        await user.save()
        logger.warn('User created successfully', user._id);

        const { accessToken, refreshToken } = await genrateTokens(user)
        res.status(201).json({
            success : true,
            message : "user register successfully",
            accessToken,
            refreshToken
        })
    } catch (error) {
        logger.error("registeration error", error)
        res.status(500).json({
            success : false,
            message : "internal server error"
        })
    }
}


module.exports = { registerUser }
