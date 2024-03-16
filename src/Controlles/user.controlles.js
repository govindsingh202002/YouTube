import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessTokenAndrefreshToken=async(userId)=>{
    try{
        const user=await User.findById(userId);
        const AccessToken=user.generateAccessToken();
        const RefreshToken=user.generateRefreshToken();
        
        user.refreshToken=RefreshToken;
        await user.save({validationBeforeSave:false});
        return {AccessToken,RefreshToken} ;
    }catch(error){
        throw new ApiError(400,"Error in method generateAccessAndRefreshToken")
    }
}
//Register
const registerUser=asyncHandler(async (req,res)=>{ 
    /* 
get user details from frontend
validate user details -> emplty or some other conditons
check if user is already exist
check for image
upload images to cloudinary
create user object
remove user password and refreshToken
check for user creataion
return response

*/
// console.log(res);
const {fullName,email,username,password}=req.body;
// console.log(fullName,email,username,password);
//  console.log(req.body)

//validation of user details
if([fullName,email,password,username].some((field)=> field?.trim()==="")){
    throw new ApiError(400,"All flieds are required");
}

// check for user existance
const existedUser=await User.findOne({
    $or : [{username},{email}]
})
if(existedUser){
    throw new ApiError(409,"User with email or username is already exist");
}

// check for image
let avatarLocalPath;

if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length>0){
    avatarLocalPath=req.files.avatar[0].path;
}

let coverImageLocalPath;

if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
    coverImageLocalPath=req.files.coverImage[0].path;
}

// console.log(avatarLocalPath);
// console.log(coverImageLocalPath);
if(!avatarLocalPath){
throw new ApiError(400,"Avatar is required")
}

//upload on cloudinary

const avatar=await uploadOnCloudinary(avatarLocalPath);
const coverImage=await uploadOnCloudinary(coverImageLocalPath);
// console.log("avatar",avatar);
if(!avatar){
    throw new ApiError(400,"Error while uploding avatar")
}

const user =await User.create({
    username,
    avatar:avatar.url,
    coverImage:coverImage?.url,
    email,
    fullName,
    password
})

//removing password and refreshToken 
const createdUser=await User.findById(user._id).select("-password -refreshToken")

//check for user creataion
if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering user")

}
// return  response
return res.status(201).json(
    new ApiResponse(200,createdUser,"User register succussfully")
)

})

//Login
const loginUser=asyncHandler(
/*
data-> req.body
login using username or email
findout user
password check
access and refreshToken
send cookies
*/
async (req,res)=>{
const {username,email,password}=await req.body;
// console.log("email",email,"username",username,"password",password);
if(!email && !username){
    throw new ApiError(400,"username or email is required");
}

const user=await User.findOne({
    $or:[{email},{username}]
})
if(!user){
    throw new ApiError(404,"User doen't exist")
}
if(password.trim()===""){
    throw new ApiError(400,"password is required");
}
const isPasswordValid=await user.isPasswordCorrect(password);

if(!isPasswordValid){
    throw new ApiError(400,"Password is invalid")
}

const {AccessToken,RefreshToken}=await generateAccessTokenAndrefreshToken(user._id);

const loggedinUser=await User.findById(user._id).select("-password -refreshToekn");

const options={
    httpOnly:true,
    secure:true
}

return res.status(200).cookie("accessToken",AccessToken,options).cookie("refreshToken",RefreshToken,options).json(200,{user:loggedinUser,AccessToken,RefreshToken},"loggedin succussfully")

}

)

//logout
const logoutUser=asyncHandler(async(req,res)=>{
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )
    const options={
        httpOnly:true,
        secure:true
    }
return res.status(200)
.clearCookie("accessToken",options)
.clearCookie("refreshToken",options)
.json(new ApiResponse(200,{},"user logged out"))
})

const refreshAccessToken=asyncHandler(async (req,res)=>{
const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken ;
if(!incomingRefreshToken){
    throw new ApiError(401,"unauthorized request in file user.controlles.js");
}

const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
const user=await User.findById(decodedToken?._id)
// console.log(user);
if(!user){
    throw new ApiError(401,"Invalid refreshToken")
}
if(incomingRefreshToken!==user?.refreshToken){
    throw new (401,"refresh token is expired or used")
}
const options={
    httpOnly:true,
    secure:true
}
// console.log("token",await generateAccessTokenAndrefreshToken(user?._id))

//name of below constant should be same as defined in generateAcces..... function AccesToken,RefreshToken

const {AccessToken,RefreshToken}=await generateAccessTokenAndrefreshToken(user?._id);
// console.log("AccessToken",AccessToken);
// console.log("RefreshToken",RefreshToken);
return res.status(200).cookie("accessToken",AccessToken,options).cookie("refreshToken",RefreshToken,options).json(
    new ApiResponse(200,{AccessToken,RefreshToken},"Access Token refreshed")
)

})

const updateUserPassword=asyncHandler(async(req,res)=>{
    const {OldPassword,NewPassword}=req.body
    if(!OldPassword || !NewPassword){
        throw new ApiError(404,"Old and New password are required!!")
    }
    const user=await User.findById(req.user?._id);
    if(!user){
        throw new ApiError(400,"Please login before changin password")
    }
    const isPasswordValid=await user.isPasswordCorrect(OldPassword)
    if(!isPasswordValid){
        throw new ApiError(404,"Please enter correct old password!!")
    }
    user.password=NewPassword
    user.save({validateBeforeSave:false});
    return res.status(200).json(new ApiResponse(200,user,"Password changed successfully"))
})

const getCurrentUser=asyncHandler(async (req,res)=>{
    const user=await User.findById(req.user?._id);
    if(!user){
        throw new ApiError(404,"Please login or register")
    }
    return res.status(200).json(new ApiResponse(200,user,"succsessfully returned user"))
})

const updateAccountDetails=asyncHandler(async (req,res)=>{
    const {NewFullName,NewEmail}=req.body
    if(!NewFullName || !NewEmail){
        throw new ApiError(400,"Please enter FullName and Email !!")
    }
    const user=await User.findByIdAndUpdate(req.user?._id,
        {
          $set:{
            fullName:NewFullName,
            email:NewEmail
          }  
        },
        {new:true}
    ).select("-password")
    return res.status(200).json(new ApiResponse(200,user,"User details updated succusefully"))
})

const updateAvatarFile=asyncHandler(async (req,res)=>{
    // make sure user is log in and run multer middleware(for accept files) 
    const AvatarLocalPath= req.file?.path // we write here file not files because we are taking a single file as an input
    if(!AvatarLocalPath){
        throw new ApiError(404,"Please provide a avatar file")
    }
    const avatar=await uploadOnCloudinary(AvatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400,"Error while uploading updated avatar on cloudinary")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {
            new:true
        }
    ).select("-password")

    return res.status(200).json(new ApiResponse(200,user,"avatar file updated sucssesfully"))

})

const updateCoverImageFile=asyncHandler(async (req,res)=>{
    // make sure user is log in and run multer middleware(for accept files) 
    const CoverImageLocalPath= req.file?.path // we write here file not files because we are taking a single file as an input
    if(!CoverImageLocalPath){
        throw new ApiError(404,"Please provide a Cover Image file")
    }
    const coverImage=await uploadOnCloudinary(CoverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading updated coverImage on cloudinary")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {
            new:true
        }
    ).select("-password")

    return res.status(200).json(new ApiResponse(200,user,"coverImage file updated sucssesfully"))

})

const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {username}=req.params
    if(!username.trim()){
        throw new ApiError(404,"No channel exist with this username");
    }
    // console.log("username",`${username}`)
    const channel=await User.aggregate([
       //first pileline
        {
            $match:{
                username:username
            }
        },
        //2nd pipeline->subscriber of user
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        //3rd pipeline->user subscribed
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribed"
            }
        },
        //add above both field
        {
        $addFields:{
            //count of subscriber
            subscribercounts:{
                    $size:"$subscribers"
            },
            //count of subscribed channel
            channelSubscribedToCount:{
                $size:"$subscribed"
            },
            //does user subscribe this channel
            isSubscribed:{
                $cond:{
                    if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                    then:true,
                    else:false
                }
            }

                  }
        },
        //will provide only selected values to frontend
        {
        $project:{
            fullName:1,
            username:1,
            avatar:1,
            coverImage:1,
            subscribercounts:1,
            channelSubscribedToCount:1,
            isSubscribed:1
      
          }
      }
    ])
    
    // console.log("channel",channel);
    if(!channel?.length){
        throw new ApiError(404,"channel doen't exist");
    }
    return res.status(200).json(new ApiResponse(200,channel[0],"channel found sccesfully"))
})

const getWatchHistory=asyncHandler(async(req,res)=>{
    const user=await User.aggregate([
        {
            $match:{
            _id:new mongoose.Types.ObjectId(req.user?._id)
        }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"WatchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },{
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    // console.log("user",user);
    return res.status(200).json(new ApiResponse(200,user[0].watchHistory,"watch History successed"))
})

export {registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    updateUserPassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatarFile,
    updateCoverImageFile,
    getUserChannelProfile,
    getWatchHistory
};