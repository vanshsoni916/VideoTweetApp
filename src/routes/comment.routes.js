import {Router} from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"

import{
    getVideoComment,
    addComment,
    updateComment,
    deleteComment
}  from "../controllers/comment.controller.js"

const router = Router()

router.route("/video/:videoId/comments").post(verifyJWT,addComment)
router.route("/video/:videoId/comments").get(verifyJWT,getVideoComment)
router.route("/comment/:commentId").patch(verifyJWT,updateComment)
router.route("/comment/:commentId").delete(verifyJWT,deleteComment)

export default router