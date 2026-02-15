import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponses";
import { ApiError } from "../utils/ApiError";
import mongoose,{ isValidObjectId } from "mongoose"; 
import {Like} from "../model/like.model.js"

const toggleVideoLike = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid videoId")
    }

    const userId = req.user._id;

    const existingLike = await Like.findOne({
        video:videoId,
        likedBy:userId
    })

    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)

        return res
               .status(200)
               .json(
                new ApiResponse(
                    200,
                    {isLiked:false},
                    "Video unliked successfully"
                )
               )
    }

    const createdLike = await Like.create({
        video:videoId,
        likedBy:userId
    })

    if(!createdLike){
        throw new ApiError(403,"Something went wrong")
    }

    return res
           .status(200)
           .json(
            new ApiResponse(
                200,
                {isLiked:true},
                "Video Liked Successfully"
            )
           )
})

const toggleTweetLike = asyncHandler(async(req,res)=>{
    const {tweetId} = req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid tweetId")
    }

    const userId = req.user._id
    const existingLike = await Like.findOne({
        tweet:tweetId,
        likedBy:userId
    })

    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)

        return res
               .status(200)
               .json(
                new ApiResponse(
                    200,
                    {isLiked:false},
                    "tweet is unliked successfully"
                )
               )
    }

    const likedTweet = await Like.create({
        tweet:tweetId,
        likedBy:userId
    })

    if(!likedTweet){
        throw new ApiError(403,"Something went wrong")
    }

    return res
           .json(
            new ApiResponse(
                200,
                {isLiked:true},
                "Tweet Liked Successfully"
            )
           )
})

const toggleCommentLike = asyncHandler(async(req,res)=>{
    const {commentId} = req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid commentId")
    }

    const userId = req.user._id
    const existingLike = await Like.findOne({
        comment:commentId,
        likedBy:userId
    })

    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)

        return res
               .status(200)
               .json(
                new ApiResponse(
                    200,
                    {isLiked:false},
                    "comment is unliked successfully"
                )
               )
    }

    const likedTweet = await Like.create({
        comment:commentId,
        likedBy:userId
    })

    if(!likedTweet){
        throw new ApiError(403,"Something went wrong")
    }

    return res
           .json(
            new ApiResponse(
                200,
                {isLiked:true},
                "Comment Liked Successfully"
            )
           )
})

const getAllLikedVideos = asyncHandler(async(req,res)=>{
    const {userId} = req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid userId")
    }

    const {page=1,limit=10} = req.query

    const skip = (Number(page)-1)*Number(limit)

    const likedVideos  = await Like.aggregate([
        {
            $match:{
                likedBy : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as : "video"
            }
        },
        {
            $unwind : "$video"
        },
        {
            $lookup :{
                from:"users",
                localField:"video.owner",
                foreignField:"_id",
                as:"video.owner"
            }
        },
        {
            $unwind : "$video.owner"
        },
        {
            $project:{
                _id : "$video._id",
                title : "$video.title",
                thumbnail:"$video.thumbnail",
                duration : "$video.duration",
                views :"$video.views",
                createdAt :"$video.createdAt",

                owner : {
                    _id : "$video.owner._id",
                    username:"$video.owner.username",
                    avatar : "$video.owner.avatar"
                }
            }
        },
        //now my pagination:
        {$sort:{craatedAt:-1}},
        {$skip:skip},
        {$limit:Number(limit)}
    ])

    if(likedVideos.length === 0){
        throw new ApiError(403,"No Videos Found")
    }

    return res
           .status(200)
           .json(
            new ApiResponse(
                200,
                {
                    page:Number(page),
                    limit : Number(limit),
                    likedVideosCount:likedVideos.length,
                    videos : likedVideos
                }
            )
           )
})

export {
    toggleVideoLike,
    toggleTweetLike,
    toggleCommentLike,
    getAllLikedVideos
}