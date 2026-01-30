import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async(localFilePath,type)=>{
    try{
        if(!localFilePath)return null
        let options ={
            resource_type:"auto"
        }

        switch(type){
            case "avatar":
                options.folder ="users/avatars"
                options.resource_type="image"
                break;
            case "coverImage":
                options.folder ="users/coverImages"
                options.resource_type="image"
                break;
            case "thumbnail":
                options.folder ="videos/thumbnails"
                options.resource_type="image"
                break;
            case "video":
                options.folder ="videos/files"
                options.resource_type="video"
                break;
            default:
                options.folder="misc"
        }

        const response = await cloudinary.uploader.upload(
            localFilePath,
            options
        )
        fs.unlinkSync(localFilePath)
        return response
    }
    catch(error){
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath)
        }
        return null
    }
}

export {uploadOnCloudinary}