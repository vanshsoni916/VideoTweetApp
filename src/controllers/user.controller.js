import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from "../model/user.model.js"
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponses.js'
import jwt from "jsonwebtoken"
import { v2 as cloudinary } from "cloudinary"

const registerUser = asyncHandler(async (req, res) => {
    //key steps:
    //get user details from frontend
    //validation - empty
    //check if user already exists : username , email
    //check userImage check avatar
    //upload them to cloudinary,images and avatar
    //create user object - create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return response

    const { fullname, email, username, password } = req.body//1
    console.log("email: ", email)
    console.log("password: ", password)
    // if(fullname===""){ //2 validation boring method to check
    //     throw new ApiError(400,"fullname is required")
    // }

    if ([fullname, email, username, password].some((field) => field?.trim() === "")) {//2 .trim()remove spaces only if there will be empty string in any field section it will throw error
        throw new ApiError(400, "All fields are required")
    }
    const existedUser = await User.findOne({//3
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;//4
    //coverImage is not an essential part: so the following terms throw 
    //errr in the absence of coverImage :
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    //New style Check:
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage)
        && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
        console.log(coverImageLocalPath)
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath,"image");//5
    const coverImage = await uploadOnCloudinary(coverImageLocalPath,"image");

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }
    const user = await User.create({
        fullname,
        avatar: {
            url: avatar.url,
            public_id: avatar.public_id
        },
        coverImage: coverImage ?
            {
                url: coverImage.url,
                public_id: coverImage.public_id
            } : null,
        email,
        password,
        username: username.toLowerCase()
    })

    const createduser = await User.findById(user._id).select("-password -refreshToken");//7
    if (!createduser) {//8
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createduser, "User registered succesfully")
    )

})
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found while generating tokens")
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        console.log(refreshToken)
        console.log(accessToken)

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        console.error("ACTUAL ERROR 👉", error)
        throw error
    }

}
const loginUser = asyncHandler(async (req, res) => {
    //Todo's in login user:
    //req.body :-> data
    //username || email
    //find user
    //password check
    //access and refresh token
    //send cookie

    const { email, username, password } = req.body;
    if (!(email || username)) {
        throw new ApiError(400, "username or email is required");
    }
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "user doesn't exist");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid User Credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    const loggedUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedUser, accessToken, refreshToken
                },
                "User logged in Successfully"
            )
        )
})
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            refreshToken: undefined
            //Another Method: {$unset:{refreshToken:1}}
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged Out"))

})
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorised Request")
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is expired or used")
        }
        //now everything is verified , so create option for secured cookies
        const options = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, refreshToken:newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

        return res
            .status(200)
            .cookie("accesToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(200, {
                    accessToken,
                    refreshToken: newRefreshToken
                }, "AccessToken is refreshed")
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refersh Token")
    }
})

const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    //verification of authenticate user:
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Old Password")
    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password Changed Successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body
    if (!fullname || !email) {
        throw new ApiError(400, "All fields are required")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email: email
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    console.log(req.file)
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath,"avatar")
    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }
    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(400, "User is not Found")
    }

    await cloudinary.uploader.destroy(user.avatar.public_id,{resource_type:"image"})
    user.avatar = {
        url: avatar.url,
        public_id: avatar.public_id
    }
    await user.save({ validateBeforeSave: false })
    user.password = undefined
    return res
        .status(200)
        .json(new ApiResponse(200, user, "user avatar is updated successfully"))
})
const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "cover image file is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath,"coverImage")
    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on coverImage")
    }
    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(400, "User is not Found")
    }
    
    if (user.coverImage?.public_id) {
        await cloudinary.uploader.destroy(user.coverImage.public_id,{resource_type:"image"})
    }

    user.coverImage = {
        url: coverImage.url,
        public_id: coverImage.public_id
    }
    await user.save({ validateBeforeSave: false })
    user.password = undefined
    return res
        .status(200)
        .json(new ApiResponse(200, user, "user coverImage is updated successfully"))
})
//aggregation pipeline for join and further processing operation:
const getuserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params;
    if(!username.trim()){
        return new ApiError(400,"username is missing")
    }
    const channel =await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                avatar:1,
                coverImage:1,
                email:1,
                channelSubscribedToCount:1,
                subscribersCount:1,
                fullname:1,
                username:1,
                isSubscribed:1
            }
        }
    ])
    if(!channel?.length){
        throw new ApiError(404,"channel does not exist")
    }

    return res
           .status(200)
           .json(
            new ApiResponse(200,channel[0],"User channel fetched successfully")
           )
})
//sub-aggregation pipeline for join user model with video model and nested join operation for video owner data
const getWatchHistory=asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"$videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"$users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
           .status(200)
           .json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "Watch History fetched successfully"
            )
           )
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateCoverImage,
    getuserChannelProfile,
    getWatchHistory
}


// res.status(200).json({
//     message:"Ok"
// })