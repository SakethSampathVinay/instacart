import mongoose from "mongoose";
const connectDB = async () => {
    try {
        const mongoUrl = process.env.DATABASE_URL || process.env.MONGODB_URI;
        if (!mongoUrl) {
            throw new Error("DATABASE_URL or MONGODB_URI is not defined in environment variables");
        }
        const conn = await mongoose.connect(mongoUrl);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    }
    catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
};
export default connectDB;
