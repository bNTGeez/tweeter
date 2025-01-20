import mongoose, {Document, mongo} from "mongoose";

interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  profilePhoto?: string;
  bio?: string;
  tweets: mongoose.Types.ObjectId[]; // array of tweets
  createdAt: Date;
  updatedAt: Date;
}
const userSchema = new mongoose.Schema(
  {
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
      required: true,
    },
    profilePhoto: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: 160,
    },
    tweets: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tweet"
    }],
  },
  {
    timestamps: true,
  }
);
const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema)

export default User;