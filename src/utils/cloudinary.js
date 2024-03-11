import {v2 as cloudinary} from "cloudinary";
import fs from 'fs';
//fs=file system

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary=async (localFilePath)=>{
    try{
        if(!localFilePath) return null;
        const response=await cloudinary.uploader.upload(localFilePath,{resource_type:"auto"});
        console.log("File uploaded successfull on Cloudinary",response.url);
        return response;
    }catch(error){
        // we got localFilePath it means our file is uploaded in local server so firstly we will remove this file
        fs.unlinkSync(localFilePath);
        return null;
    }
}

export {uploadOnCloudinary};