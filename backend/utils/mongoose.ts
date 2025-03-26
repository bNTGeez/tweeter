import mongoose from "mongoose";

export const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI not found in environment variables");
  }

  try {
    const connect = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`Connected to database ${connect.connection.host}`);
  } catch (error) {
    console.error("Failed to connect to database:", error);
    throw error;
  }
};
