const Jwt = require('jsonwebtoken')
const crypto = require('crypto');
const RefreshToken = require('../models/refreshToken');

const genrateTokens = async(user) => {
    const accessToken = Jwt.sign({
        userId : user._id,
        userName : user.userName,
    }, process.env.JWT_SECRET, {expiresIn : '60m'})

    const refreshToken = crypto.randomBytes(40).toString('hex'); // gnerate the long and strong token
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // refresh token expires in 7days

    await RefreshToken.create({
        token : refreshToken,
        user : user._id,
        expiresAt : expiresAt
    })

    return {accessToken, refreshToken}
}

module.exports = genrateTokens;
