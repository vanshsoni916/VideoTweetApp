import {Router} from "express"
import {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
} from "../controllers/video.controller.js"

import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/search").get(verifyJWT,getAllVideos)
router.route("/publish").post(
    verifyJWT,
    upload.fields([
        {
            name:"videoFile",
            maxCount:1
        },
        {
            name:"thumbnail",
            maxCount:1
        }
    ]),
    publishAVideo    
)

router.route("/c/:videoId").get(verifyJWT,getVideoById)
router.route("/c/:videoId").patch(
    verifyJWT,
    upload.single("thumbnail"),
    updateVideo
)
router.route("/c/:videoId").delete(verifyJWT,deleteVideo)

router.route("/c/:videoId/toggle_publish").patch(verifyJWT,togglePublishStatus)

export default router