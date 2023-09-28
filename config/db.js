import mongoose from "mongoose";

mongoose.set('strictQuery', false);
const connectToDb=async()=>{
    try {
        const {connection}=await mongoose.connect(
            process.env.MONGO_URL
        )
        console.log(connection.models);
        if(connection){
            console.log(`Connected to MongoDB: ${connection.host}`);
        }
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
}

export default connectToDb;
