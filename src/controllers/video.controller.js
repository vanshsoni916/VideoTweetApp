import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../model/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponses.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {v2 as cloudinary} from "cloudinary"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //ToDo: get all videos based on query, sort, pagination
    const matchStage = {
        isPublished: true
    }

    //search by title:
    if (query) {
        matchStage.title = {
            $regex: query,
            $options: "i"
        }
    }

    //search by userId:
    if (userId && isValidObjectId(userId)) {
        matchStage.owner = new mongoose.Types.ObjectId(userId)
    }

    //sorting logic:
    const sortStage = {}
    if (sortBy) {
        sortStage[sortBy] = sortType === "asc" ? 1 : -1
    }
    else {
        sortStage.createdAt = -1;
    }

    const skip = (Number(page) - 1) * Number(limit)

    const videos = await Video.aggregate([
        {
            $match: matchStage
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                duration: 1,
                views: 1,
                createdAt: 1,
                "owner.id": 1,
                "owner.username": 1,
                "owner.avatar.url": 1
            }
        },
        { $sort: sortStage },
        { $skip: skip },
        { $limit: Number(limit) }
    ])

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {
                page: Number(page),
                limit: Number(limit),
                videos
            },
            "videos fetched succesfully"
        ))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    if (!title || !description) {
        throw new ApiError(400, "title and description are required")
    }
    const videoLocalPath = req.files.videoFile[0]?.path
    if (!videoLocalPath) {
        throw new ApiError(400, "video file is required")
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath, "video")
    if (!videoFile) {
        throw new ApiError(400, "Failed to upload video file")
    }
    const thumbnailLocalPath = req.files.thumbnail[0]?.path
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail is required")
    }
    const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath, "thumbnail")
    if (!thumbnailFile) {
        throw new ApiError(400, "Failed to upload thumbnail")
    }

    const video = await Video.create({
        title,
        description,
        videoFile: {
            url: videoFile.url,
            public_id: videoFile.public_id
        },
        thumbnail: {
            url: thumbnailFile.url,
            public_id: thumbnailFile.public_id
        },
        duration: videoFile.duration,
        isPublished: true,
        owner: req.user._id,
        views: 0
    })

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                video,
                "video published successfully"
            )
        )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    //aggrgation pipeline:
    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId),
                isPublished: true
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                videoFile: 1,
                duration: 1,
                views: 1,
                createdAt: 1,
                "owner._id": 1,
                "owner.username": 1,
                "owner.fullname": 1,
                "owner.avatar.url": 1
            }
        }
    ])

    if (!video.length) {
        throw new ApiError(400, "video not found")
    }

    await Video.findByIdAndUpdate(
        videoId,
        {
            $inc: { views: 1 }
        }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                video[0],
                "video fetched successfully"
            )
        )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id")
    }
    //update video title,description,thumbnail:
    const {title,description} = req.body
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400,"No video found")
    }
    if(video.owner.toString()!==req.user._id.toString()){
        throw new ApiError(400,"You are not allowed to update the video details")
    }
    const updateFields ={}
    if(title){
        updateFields.title=title
    }
    if(description){
        updateFields.description=description
    }
    if(req.file?.path){
        const thumbnailLocalPath = req.file?.path
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath,"thumbnail")
        if(!thumbnail.url){
            throw new ApiError(400,"Thumbnail update failed")
        }
        updateFields.thumbnail={
            url:thumbnail.secure_url,
            public_id :thumbnail.public_id
        }
        //delete old thumbnail by its public id :
        if(video.thumbnail?.public_id){
            await cloudinary.uploader.destroy(
                video.thumbnail.public_id,
                {resourceType:"image"}
            )
        }
    }

    if(Object.keys(updateFields).length===0){
        throw new ApiError(400,"Nothing to update")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:updateFields
        },
        {
            new :true
        }
    )
    if(!updatedVideo){
        throw new ApiError(404,"Video not Found")
    }
    return res
           .status(200)
           .json(
            new ApiResponse(
                200,
                updatedVideo,
                "Video updated successfully"
            )
           )
})

const deleteVideo = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid Video Id")
    }
    //check ownership:
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"video not found")
    }
    if(video.owner?.toString()!==req.user?._id.toString()){
        throw new ApiError(403,"You are not allowed to delete this video")
    }
    //delete files from cloudinary:
    if(video.videoFile?.public_id){
        await cloudinary.uploader.destroy(
            video.videoFile.public_id,
            {resource_type:"video"}
        )
    }
    if(video.thumbnail?.public_id){
        await cloudinary.uploader.destroy(
            video.thumbnail.public_id,
            {resource_type:"image"}
        )
    }
    //Delete from DB:
    await Video.findByIdAndDelete(videoId)

    return res
           .status(200)
           .json(
            new ApiResponse(
                200,
                {},
                "Video is Deleted successfully"
            )
           )
})

const togglePublishStatus = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    //validation:
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid Video Id")
    }
    //authorization :
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"video not found")
    }
    if(video.owner.toString()!==req.user?._id.toString()){
        throw new ApiError(400,"You are not allowed to do the following request")
    }
    //toggle logic: 
    video.isPublished= !video.isPublished
    await video.save()

    return res
           .status(200)
           .json(
            new ApiResponse(
                200,
                {
                    isPublished: video.isPublished
                },
                `Video ${video.isPublished ? "published" : "unpublished"} successfully`
            )
           )
})
export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}