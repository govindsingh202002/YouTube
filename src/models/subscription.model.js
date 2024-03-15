import mongoose from "mongoose";

const SubscriptionSchema=new mongoose.Schema({
    chennel:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    subscriber:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true})

export const Subscription=mongoose.model("Subscription",SubscriptionSchema);