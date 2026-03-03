import {verifyJWT}  from "../middlewares/auth.middleware.js"
import {
    getChannelStats,
    getAllVideosOfChannel
} from "../controllers/dashboard.controller.js"

import {Router} from "express"

const router = Router()

router.use(verifyJWT)

router.route("/stats/:channelId").get(getChannelStats)

router.route("/videos/:channelId").get(getAllVideosOfChannel)

export default router