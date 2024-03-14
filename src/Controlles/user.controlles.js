import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';


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
    coverImage:coverImage.url,
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
console.log("email",email,"username",username,"password",password);
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
const isPasswordValid=await User.isPasswordCorrect(password);

if(!isPasswordValid){
    throw new ApiError(400,"Password is invalid")
}

const {AccessToken,RefreshToken}=await generateAccessTokenAndrefreshToken(user._id);

const loggedinUser=await User.findById(user._id).select("-password -refreshToekn");

const options={
    httpOnly:true,
    secure:true
}

return res.status(200).cookie("accessToekn",AccessToken,options).cookie("refreshToken",RefreshToken,options).json(200,{user:loggedinUser,AccessToken,RefreshToken},"loggedin succussfully")

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

export {registerUser,loginUser,logoutUser};