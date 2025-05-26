
const RefreshTokenModel = require('../models/refreshToken')
const logger = require('../utils/logger')
const { validateRegistration, validateLogin } = require('../utils/validation')
const User = require('../models/userModel')
const genrateTokens = require('../utils/generateToken')
const RefreshToken = require('../models/refreshToken')

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

const loginUser = async(req, res) => {
     logger.info("login endpoint hit...")
    try {
        const {error} = validateLogin(req.body);
        if(error){
         logger.warn('validation error', error.details[0].message);
         return res.status(400).json({
            success : false,
            message : error.details[0].message
         })
        }

         const {email, password} = req.body;

        // check user prsent or not
        let user = await User.findOne({email})

        // if not present
        if(!user){
            logger.warn('Invalid user');
            return res.status(400).json({
            success : false,
            message : "User not found"
         })
        }

        // if user is present then check valid passord or not(for a particular user)
        const isValidPasword = await user.comparePassword(password);
        if(!isValidPasword){
            logger.warn('Invalid password');
            return res.status(400).json({
            success : false,
            message : "Invalid password"
         })
        }

        // genrateTokens
        const {accessToken, refreshToken} = await genrateTokens(user)
        res.status(201).json({
            accessToken,
            refreshToken,
            userId : user._id
        })

    } catch (error) {
        logger.error("Login error", error)
        res.status(500).json({
            success : false,
            message : "internal server error"
        })
    }
}

const refreshTokenUser = async(req, res) => {
    logger.info("Refreshtoken endpoint hit...")
    try {

        // get refresh token
        const { refreshToken } = req.body
        if(!refreshToken){
            logger.warn('Refresh token not found');
            return res.status(400).json({
            success : false,
            message : "Invalid password"
         })
        }

        // store the token in db for a particular user
        const storeTokenFromDB = await RefreshToken.findOne( {token : refreshToken} )

        // check if token is presentand not expired
        if(!storeTokenFromDB || storeTokenFromDB.expiresAt < new Date()){
            logger.warn("Invalid or expired refresh token")
             return res.status(401).json({
            success : false,
            message : "Invalid or expired refresh token"
         })
        }

        // find the user for a particulr token
        const user = await User.findById(storeTokenFromDB.user)
          if(!user){
            logger.warn('user not found');
            return res.status(400).json({
            success : false,
            message : "User not found"
         })
        }

        // genrate new Tokens for a particular user
        const { accessToken : newAccessToken, refreshToken : newRefreshToken } = await genrateTokens(user)

        // delete the old Tokens
        await RefreshToken.deleteOne({_id : storeTokenFromDB._id})

        return res.json({
            accessToken : newAccessToken,
            refreshToken : newRefreshToken
        })

    } catch (error) {
        logger.error("error", error)
        res.status(500).json({
            success : false,
            message : "internal server error"
        })
    }
}

const logoutUser = async(req, res) => {
    logger.info("logout endpoint hit...")
    try {

         // get refresh token
        const { refreshToken } = req.body
        if(!refreshToken){
            logger.warn('Refresh token not found');
            return res.status(400).json({
            success : false,
            message : "Invalid password"
         })
        }

        await RefreshToken.deleteOne({token : refreshToken})
        logger.info("Refresh token deleted successfully")

        res.status(200).json({
            success : true,
            message : "Logout successfully"
        })

    } catch (error) {
       logger.error("logout error", error)
        res.status(500).json({
            success : false,
            message : "internal server error"
        })
    }
}

module.exports = { registerUser, loginUser, refreshTokenUser,  logoutUser}
