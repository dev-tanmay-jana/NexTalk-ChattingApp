import mongoose from "mongoose";

//connect to mongodb database
export const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => {
            console.log('Mongoose connected to DB');
        });
        mongoose.connection.on('error', (err) => {
            console.log('Mongoose connection error:', err);
        });
        await mongoose.connect(`${process.env.MONGODB_URI}/NexTalk`, {});
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.log("Error connecting to MongoDB:", error.message);
        process.exit(1);
    }
};