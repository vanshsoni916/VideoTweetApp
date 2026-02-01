import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express();
//for handling any middleware or any configuration:
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"}))
//url handling :
app.use(express.urlencoded({extended:true,limit:"16kb"}))
//configuration for images and pdf files which can be stored in Server through public or any folder
app.use(express.static("public"))//public assets:
//for accessing the cookies from the browser of user and also set the cookies in user browser through my server :
app.use(cookieParser())

//routes Import:
import userRouter from "./routes/user.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js";
import videoRouter from "./routes/video.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
//routes declaration:
app.use("/api/v1/users",userRouter)
//http://localhost:8000/api/v1/users/register
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/videos",videoRouter)
app.use("/api/v1/playlists",playlistRouter)

export {app};