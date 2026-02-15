import { verifyJWT } from "../middlewares/auth.middleware";
import {
    toggleVideoLike,
    toggleTweetLike,
    toggleCommentLike,
    getAllLikedVideos,
    getCommentLikeStatus,
    getTweetLikeStatus,
    getVideoLikeStatus
} from "../controllers/like.controller.js"

import {Router} from express 


const router = Router()

router.route("/video/:videoId").patch(verifyJWT,toggleVideoLike)
router.route("/tweet/:tweetId").patch(verifyJWT,toggleTweetLike)
router.route("/comment/:commentId").patch(verifyJWT,toggleCommentLike)
router.route("/user/:userId").get(verifyJWT,getAllLikedVideos)

router.route("/video/:videoId").get(verifyJWT,getVideoLikeStatus)
router.route("/tweet/:tweetId").get(verifyJWT,getTweetLikeStatus)
router.route("/comment/:commentId").get(verifyJWT,getCommentLikeStatus)

export default router