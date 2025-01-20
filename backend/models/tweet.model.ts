import mongoose, { Document } from "mongoose";

interface ITweet extends Document {
  content: string;
  author: mongoose.Types.ObjectId;
  likes: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const tweetSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      maxlength: 280,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Tweet =
  mongoose.models.Tweet || mongoose.model<ITweet>("Tweet", tweetSchema);

export default Tweet;
