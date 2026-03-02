import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponses.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Comment} from "../model/comment.model.js"
import mongoose,{isValidObjectId} from "mongoose"


const getVideoComment = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid videoId")
    }
    const {page=1,limit=10} = req.query

    const skip = (Number(page)-1)*Number(limit)

    const comments = await Comment.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner"
            }
        },
        {
            $unwind:"$owner"
        },
        {
            $project:{
                content:1,
                createdAt:1,
                "owner._id":1,
                "owner.username":1,
                "owner.avatar":1
            }
        },
        {$sort:{createdAt:-1}},
        {$skip:skip},
        {$limit:Number(limit)}
    ])
    
    return res
           .status(200)
           .json(
            new ApiResponse(
                200,
                {
                    page:Number(page),
                    limit:Number(limit),
                    comments
                },
                "Video Comments Fetched Successfully"
            )
           )
})

const addComment = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    const {content} = req.body

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid videoId")
    }
    if(!content || content.trim().length===0){
        throw new ApiError(400,"comment content is required")
    }
    const userId = req.user._id

    const commentAdded = await Comment.create({
        video:videoId,
        owner:userId,
        content:content
    })

    return res
           .status(201)
           .json(
            new ApiResponse(
                201,
                commentAdded,
                "Comment Added Successfully"
            )
           )
})

const updateComment = asyncHandler(async(req,res)=>{
    const {commentId} = req.params
   
    const {content} = req.body
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid commentId")
    }
    if(!content || content.trim().length===0){
        throw new ApiError(400,"comment content is required")
    }

    const comment = await Comment.findOneAndUpdate(
        {
            _id:commentId,
            owner:req.user._id
        },
        {
           $set:{content:content.trim()}
        },
        {
            new:true
        }
    )
    
    if(!comment){
        throw new ApiError(404,"Comment not found or you are not authorized")
    }
    return res
           .status(200)
           .json(
            new ApiResponse(
                200,
                comment,
                "Comment updated successfully"
            )
           )
    
})

const deleteComment = asyncHandler(async(req,res)=>{
    const {commentId} = req.params

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid commentId")
    }
    const deletedComment = await Comment.findOneAndDelete(
        {
            _id:commentId,
            owner:req.user._id
        }
    )
    
    if(!deletedComment){
        throw new ApiError(404,"Invalid commentId or you are not authorized")
    }
    return res
           .status(200)
           .json(
            new ApiResponse(
                200,
                {},
                "Comment Deleted Successfully"
            )
           )
})

export {
    getVideoComment,
    addComment,
    updateComment,
    deleteComment
}