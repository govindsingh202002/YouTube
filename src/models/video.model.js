/*     Video Model       
id------------------string
owner---------------ObjectId
videofile-----------string
thumnail------------string
description---------string
title---------------string
duration------------Number
viewa---------------Number
ispublished---------boolean
createAt------------Date
updatedAt-----------Date
*/

import mongoose from 'mongoose';
import mongooseAggragatePaginate from 'mongoose-aggregate-paginate-v2';


const videoSchema=new mongoose.Schema({
    videoFile:{
        type:String,
        required:true,
    },
    thumNail:{
        type:String,
        required:true,
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    title:{
        type:String,
    },
    description:{
        type:String,
    },
    isPublished:{
        type:Boolean,
        required:[true,"Password is required"]
    },
    duration:{
        type:Number
    },
    views:{
        type:Number
    }
},{timestamps:true});

videoSchema.plugin(mongooseAggragatePaginate);

export const Video=mongoose.model("Video",videoSchema);