const mongoose = require('mongoose')
const argon2 =require('argon2')

const userSchema = new mongoose.Schema({
    userName : {
        type : String,
        required : true,
        unique : true,
        trim : true,
    },
    email : {
        type : String,
        required : true,
        unique : true,
        trim : true,
        lowercase : true,
    },
    password : {
        type : String,
        required : true,
    },
    createdAt : {
        type : Date,
        default : Date.now()
    }
},
    {
    timestamps : true
    }
)

// hash the password and verify the password

// it hash the password before the save function called
userSchema.pre('save', async function(next) {
    if(this.isModified('password')){
        try {
            this.password = await argon2.hash(this.password)
        } catch (error) {
            return next(error);
        }
    }
})

// compare the passwrd with this password and user given password
userSchema.methods.comparePassword = async function(candiadatePassword){
    try {
        return await argon2.verify(this.password, candiadatePassword)
    } catch (error) {
        throw error
    }
}

// create the indexing top on username
userSchema.index({userName : 'text'})

const User = mongoose.model("User", userSchema);
module.exports = User;
