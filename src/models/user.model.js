/*     User Model       
id------------------string
watchingHistory-----Object[]
username------------string
email---------------string
fullName------------string
avatar--------------string
coverImage----------string
password------------string
refreshToken--------string
createAt------------Date
updatedAt-----------Date
*/

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';


const userSchema=new mongoose.Schema({
    userName:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullName:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String,
    },
    coverImage:{
        type:String,
    },
    watchHistory:[
        {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"
       }
    ],
    password:{
        type:Boolean,
        required:[true,"Password is required"]
    },
    refreshToken:{
        type:String
    },
},{timestamps:true});

// password encryption using pre middleware hook on event "save"

userSchema.pre("save",async function(next){
    if(this.isModified("password")){
        this.password=bcrypt.hash(this.password,10);
    }
    next();
});

//defing method to compare input password with correct password
userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password);
}


userSchema.methods.generateAccessToken=function(){
    return jwt.sign(
        {
            _id:this._id,
            userName:this.userName,
            email:this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefershToken=function(){
    return jwt.sign(
        {
            _id:this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User=mongoose.model("User",userSchema);