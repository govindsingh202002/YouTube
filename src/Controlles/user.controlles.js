import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';

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

const registerUser=asyncHandler(async (req,res)=>{ 
    
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
const avatarLocalPath=req.files?.avatar[0]?.path;
const coverImageLocalPath=req.files?.coverImage[0]?.path;
console.log(avatarLocalPath);
if(!avatarLocalPath){
throw new ApiError(400,"Avatar is required")
}

//upload on cloudinary
const avatar=await uploadOnCloudinary(avatarLocalPath);
const coverImage=await uploadOnCloudinary(coverImageLocalPath);

if(!avatar){
    throw new ApiError(400,"Error while uploding avatar")
}

const user =await User.create({
    username:username.tolowerCase(),
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
export {registerUser};