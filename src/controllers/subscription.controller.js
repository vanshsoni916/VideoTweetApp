import mongoose,{isValidObjectId} from "mongoose";
import { Subscription } from "../model/subscription.model.js";
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponses.js"

//Toggle Subscription :
const toggleSubscription = asyncHandler(async(req,res)=>{
    const {channelId} = req.params

    //validate channel:
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid Channel Id")
    }
    //Prevent Self Subscription:
    if(channelId.toString()===req.user?._id.toString()){
        throw new ApiError(400,"You can't subscribe to yourself")
    }
    //existing subscriber:
    const existedSubscriber = await Subscription.findOne({
        subscriber:req.user?._id,
        channel:channelId
    });

    if(existedSubscriber){
        await Subscription.findByIdAndDelete(existedSubscriber._id);
        return res
               .status(200)
               .json(new ApiResponse(200,{subscribed:false},"unsubscribed successfully"))
    }
    await Subscription.create({
        subscriber:req.user?._id,
        channel:channelId
    });

    return res
           .status(200)
           .json(new ApiResponse(200,{subscribed:true},"subscribed succssfully"))
})
// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async(req,res)=>{
    const {channelId} = req.params;
    if(!isValidObjectId(channelId)){
        return new ApiError(400,"Invalid Channel Id")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscriber"
            }
        },
        {
            $unwind:"$subscriber"
        },
        {
            $project:{
                _id:0,
                subscriberId:"$subscriber._id",
                username:"$subscriber.username",
                fullname:"$subscriber.fullname",
                avatar:"$subscriber.avatar.url",
                subscribedAt:"$createdAt"
            }
        }
    ])

    return res
           .status(200)
           .json(
            new ApiResponse(
                200,
                {
                    totalSubscriber:subscribers.length,
                    subscribers
                },
                "Subscriber Fetched Successfully"
            )
           )
})
// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async(req,res)=>{
    const {subscribedId} = req.params
    if(!isValidObjectId(subscribedId)){
        return new ApiError(400,"Invalid subscribedId")
    }
    const channels = await Subscription.aggregate([
        {
            $match:{
                subscriber:new mongoose.Types.ObjectId(subscribedId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"channel"
            }
        },
        {
            $unwind:"$channel"
        },
        {
            $project: {
                _id: 0,
                channelId: "$channel._id",
                username: "$channel.username",
                fullName: "$channel.fullName",
                avatar: "$channel.avatar",
                subscribedAt: "$createdAt"
            }
        },
    ])
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalChannels: channels.length,
                channels
            },
            "Subscribed channels fetched successfully"
        )
    );
})
export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}