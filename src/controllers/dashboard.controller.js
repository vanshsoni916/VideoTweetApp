import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponses.js";
import {Subscriber} from "../model/subscription.model.js"
import {Video} from "../model/video.model.js"
import mongoose, { isValidObjectId } from "mongoose";

const getChannelStats = asyncHandler(async(req,res)=>{
    //Get the channel stats like total video views, total subscribers , total videos , total likes etc
    const {channelId} = req.params 
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid channelId")
    }
    // const totalVideos  = await Video.countDocuments({
    //     owner:channelId
    // })
    // const totalSubscribers = await Subscriber.countDocuments({
    //     channel:channelId
    // })
    
    // //get all videos of this channel for total views
    // const videos = await Video.find(
    //     {
    //         owner:channelId
    //     },
    //     {
    //         _id:1,views:1
    //     }
    // )

    // const totalViews = videos.reduce((acc,videos)=>acc+videos.views,0)

    // const videoIds = videos.map(video=>videos._id)

    // const totalLikes = await Like.countDocuments({
    //     video:{$in:videoIds}
    // })

    // return res
    //        .status(200)
    //        .json(
    //         new ApiResponse(
    //             200,
    //             {
    //                 totalVideos,
    //                 totalViews,
    //                 totalLikes,
    //                 totalSubscribers
    //             },
    //             "Total channel stats fetched successfully"
    //         )
    //        )

    const stats = await Video.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"likes"
            }
        },
        {
            $addFields:{
                likeCount:{$size:"$likes"}
            }
        },
        {
            $group:{
                _id:null,
                totalVideos:{$sum:1},
                totalLikes:{$sum:"$likeCount"},
                totalViews:{$sum:"$views"}
            }
        }
    ])

    const totalSubscribers = await Subscriber.countDocuments({
        channel:channelId
    })

    const result = stats[0] || {
        totalVideos:0,
        totalLikes:0,
        totalViews:0
    }

    return res
           .status(200)
           .json(
            new ApiResponse(
                200,
                {
                    ...result,
                    totalSubscribers
                },
                "All stats data fetched successfully"
            )
           )
})