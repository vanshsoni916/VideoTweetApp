import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB =async ()=>{
    try {
        const db_connect = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MONGODB Connected !! Host: ${db_connect}`);
    } catch (error) {
        console.error("ERROR CONNECTION FAILED: ",error);
        throw error
        process.exit(1)
    }
}
export default connectDB