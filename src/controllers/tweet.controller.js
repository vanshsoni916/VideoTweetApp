import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponses.js"
import { Tweet} from "../model/tweet.model.js"
import mongoose, { isValidObjectId } from "mongoose"


const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
        throw new ApiError(400, "content is required")
    }
    if (content.length > 350) {
        throw new ApiError(400, "Tweet content must be less than 350 characters")
    }

    const createdTweet = await Tweet.create({
        content,
        owner: req.user?._id
    })
    if (!createdTweet) {
        throw new ApiError(501, "Internal Server Error")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                createdTweet,
                "Tweet created successfully"
            )
        )
})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User Id")
    }

    const skip = (Number(page) - 1) * Number(limit);
    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
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
                content: 1,
                createdAt: 1,
                "owner._id": 1,
                "owner.username": 1,
                "owner.avatar": 1
            }
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: Number(limit) }
    ])

    if (tweets.length === 0) {
        throw new ApiError(404, "No Tweets found for this user")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    page: Number(page),
                    limit: Number(limit),
                    tweets
                },
                "User Tweet is fetched successfully"
            )
        )
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const { content } = req.body
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId")
    }
    if (!content || content.trim().length === 0) {
        throw new ApiError(400, "Tweet Content is Required")
    }
    const updatedTweet = await Tweet.findOneAndUpdate(
        {
            _id: tweetId,
            owner: req.user?._id
        },
        {
            $set: {
                content
            }
        },
        {
            new: true
        }
    )

    if (!updatedTweet) {
        throw new ApiError(404, "Tweet not found or You are not authorised")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedTweet,
                "Tweet is updated successfully"
            )
        )
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId")
    }

    const deletedTweet = await Tweet.findOneAndDelete(
        {
            _id: tweetId,
            owner: req.user?._id
        }
    )

    if (!deletedTweet) {
        throw new ApiError(404, "tweet is not found or you are not authorised to do so")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Tweet is deleted successfully"
            )
        )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}