import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponses.js";
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

const getAllVideosOfChannel = asyncHandler(async(req,res)=>{
    //get all videos uploaded by the channel 
    const {channelId}  = req.params
    const {page=1,limit=10,query,sortBy,sortType,userId} =  req.query

    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid channelId")
    }

    const matchStage = {
        owner:new mongoose.Types.ObjectId(channelId)
    }

    if(query){
        matchStage.title = {$regex :query,$options:"i"}
    }

    const sortStage = {}
    if(sortBy){
        sortStage[sortBy] = sortType==="asc"? 1:-1
    }
    else sortStage[sortBy] = -1

    const skip = (Number(page)-1)*Number(limit)

    const videos = await Video.aggregate([
        {
            $match:matchStage
        },
        {
            $lookup :{
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"likes"
            }
        },
        {
            $addFields:{
                likeCount :{$size:"$likes"}
            }
        },
        //project:
        {
            $project:{
                title:1,
                description:1,
                thumbnail:1,
                views:1,
                createdAt:1,
                likeCount:1
            }
        },
        {$sort:sortStage},
        {$skip:skip},
        {$limit:Number(limit)}
    ])

    return res
           .status(200)
           .json(
            new ApiResponse(
                200,
                videos,
                "All videos fetched successfully"
            )
           )
})

export {
    getChannelStats,
    getAllVideosOfChannel
}