import mongoose, { Document } from "mongoose";

interface IUser extends Document {
  clerkId: string;
  username: string;
  email: string;
  password?: string;
  profilePhoto?: string;
  bio?: string;
  auth: boolean;
  tweets: mongoose.Types.ObjectId[]; // array of tweets
  followers: mongoose.Types.ObjectId[]; // array of users following this user
  following: mongoose.Types.ObjectId[]; // array of users this user follows
  createdAt: Date;
  updatedAt: Date;
}
const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: false,
    },
    profilePhoto: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: 160,
    },
    auth: {
      type: Boolean,
      default: false,
    },
    tweets: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tweet" }],
      default: [],
    },
    followers: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    following: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);
const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
