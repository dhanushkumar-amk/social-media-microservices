const mongoose = require('mongoose')


const refreshTokenSchema = new mongoose.Schema({
    token : {
        type : String,
        required : true,
        unique : true
    },
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref  : 'User',
        required : true
    },
  expiresAt : {
    type : Date,
    required : true
  }
},
 {
    timestamps : true
    }
)

// indexing on expiresAt field
refreshTokenSchema.index(
    { expiresAt: 1 },  // Indexing the 'expiresAt' field in ascending order (1)
    { expireAfterSeconds: 0 }  // Setting expireAfterSeconds to 0, meaning documents won't automatically expire
);

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
module.exports = RefreshToken;
