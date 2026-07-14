import mongoose from "mongoose";

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI;
    try {
        const connection = await mongoose.connect(mongoUri);
        console.log(`Connected to MongoDB ✅`);
        return connection;
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        throw error;
    }
};

export default connectDB;