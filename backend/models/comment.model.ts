import mongoose, { Document } from "mongoose";

interface IComment extends Document {
  content: string;
  author: mongoose.Types.ObjectId;
  tweet: mongoose.Types.ObjectId;
  likes: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tweet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tweet",
      required: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

const Comment = mongoose.models.Comment || mongoose.model<IComment>("Comment", commentSchema);

export default Comment;