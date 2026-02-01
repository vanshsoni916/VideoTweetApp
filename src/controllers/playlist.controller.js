import { Playlist } from "../model/playlist.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import mongoose, { isValidObjectId } from "mongoose";
import { ApiResponse } from "../utils/ApiResponses.js"
import { ApiError } from "../utils/ApiError.js"
import { Video } from "../model/video.model";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    if (!name) {
        throw new ApiError(401, "Playlist name is required")
    }

    const playlist = await Playlist.create({
        name,
        description: description || "",
        owner: req.user._id
    })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "Playlist Created Successfully"
            )
        )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User Id")
    }
    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                totalVideos: { $size: "$videos" },
                createdAt: 1
            }
        }
    ])

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                playlists,
                "User Playlists Fetched Successfully"
            )
        )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(401, "Invalid PlaylistId")
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                let: { videoIds: "$videos" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $in: ["$_id", "$$videoIds"] }
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
                    { $unwind: "$owner" },
                    {
                        $project: {
                            title: 1,
                            thumbnail: 1,
                            duration: 1,
                            views: 1,
                            owner: {
                                _id: "$owner._id",
                                username: "$owner.username",
                                avatar: "$owner.avatar"
                            }
                        }
                    }
                ],
                as: "videos"
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
                name: 1,
                description: 1,
                createdAt: 1,
                "owner._id": 1,
                "owner.username": 1,
                "owner.avatar": 1,
                videos: 1
            }
        }
    ])
    if (!playlist.length) {
        throw new ApiError(401, "Playlist not Found")
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            playlist[0],
            "playlist fetched successfully"
        )
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId or playlistId")
    }
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "video not found")
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "playlist not found")
    }
    //authorization check:
    if (playlist.owner?.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not allowed to modify playlist")
    }
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                videos: videoId
            }
        },
        { new: true }
    )

    if (!updatedPlaylist) {
        throw new ApiError(404, "video addition failed")
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                updatedPlaylist,
                "Video is added successfully"
            )
        )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId or playlistId")
    }
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "video not found")
    }
    const updatedPlaylist = await Playlist.findOneAndUpdate(
        {
            _id: playlistId,
            owner: req.user?._id
        },
        {
            $pull: { videos: videoId }
        },
        { new: true }
    )
    if (!updatedPlaylist) {
        throw new ApiError(404, "Either Playlist not found or you are not authorised")
    }

    return res
           .status(201)
           .json(
            new ApiResponse(
                201,
                updatedPlaylist,
                "Video is removed successfully"
            )
           )
})

const deletePlaylist = asyncHandler(async(req,res)=>{
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid Playlist Id")
    }

    const updatedPlaylist = await Playlist.findOneAndDelete(
        {
            _id:playlistId,
            owner:req.user?._id
        }
    )

    if(!updatedPlaylist){
        throw new ApiError(404,"Playlist is not found or you are not authorised")
    }

    return res
           .status(201)
           .json(
            new ApiResponse(
                201,
                {},
                "Playlist is deleted successfully"
            )
           )
})

const updatePlaylist= asyncHandler(async(req,res)=>{
    const {playlistId}=req.params
    const {name,description}=req.body

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlistId")
    }

    const stage ={};
    if(name){
        stage.name=name
    }
    if(description){
        stage.description=description
    }
    if(!description && !name){
        throw new ApiError(400,"Nothing to Update")
    }

    const updatedPlaylist = await Playlist.findOneAndUpdate(
        {
            _id:playlistId,
            owner:req.user?._id
        },
        {
            $set:stage
        },
        {
            new:true
        }
    )

    if(!updatedPlaylist){
        throw new ApiError(404,"playlist not found or unauthorised request")
    }

    return res 
          .status(200)
          .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Playlist updated successfully"
            )
          )
})
export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}