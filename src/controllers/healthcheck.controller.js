import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponses.js";

const healthcheck = asyncHandler(async(req,res)=>{
    //build a healthcheck response that simply returns the OK status as json with a message
    return res
           .status(200)
           .json(
            new ApiResponse(
                200,
            {
                status:"OK",
                uptime:process.uptime(),
                timestamp:new Date()
            },
            "Server is Healthy"
            )
           )
})

export{
    healthcheck
}