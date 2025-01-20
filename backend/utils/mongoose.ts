import mongoose from "mongoose";

export const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    return console.log("MONGODB_URI not found ");
  }

  try {
    const connect = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`connected to database ${connect.connection.host}`);
  } catch (error) {
    console.log("didn't connect ", error);
  }
};
