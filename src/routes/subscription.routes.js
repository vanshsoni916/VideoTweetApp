import { Router } from "express";
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
} from "../controllers/subscription.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()
router.use(verifyJWT);

router.post("/c/:channelId", toggleSubscription);


//Get subscribers of a channel
router.get("/c/:channelId/subscribers", getUserChannelSubscribers);

//Get channels a user has subscribed to
router.get("/u/:subscriberId/subscriptions", getSubscribedChannels);

export default router;