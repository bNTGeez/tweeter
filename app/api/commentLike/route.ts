import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/backend/utils/mongoose";
import Comment from "@/backend/models/comment.model";
import User from "@/backend/models/user.model";
import { currentUser } from "@clerk/nextjs/server";
import { Types } from "mongoose";

interface CommentWithLikeInfo {
  _id: Types.ObjectId;
  content: string;
  author: {
    username: string;
    profilePhoto?: string;
  };
  likes: Types.ObjectId[];
  createdAt: Date;
  isLikedByUser: boolean;
  likesCount: number;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findOne({ clerkId: clerkUser.id });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { commentId } = await req.json();
    if (!commentId) {
      return NextResponse.json(
        { error: "no Comment ID found" },
        { status: 400 }
      );
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const liked = comment.likes.includes(user._id);

    if (liked) {
      // if liked remove user id
      comment.likes = comment.likes.filter(
        (id: Types.ObjectId) => id.toString() !== user._id.toString()
      );
    } else {
      // if not liked add user id
      comment.likes.push(user._id);
    }

    await comment.save();

    return NextResponse.json({
      success: true,
      liked: !liked,
      likesCount: comment.likes.length,
    });
  } catch (err) {
    console.error("Error in comment like:", err);
    return NextResponse.json(
      {
        error: "Server Error",
      },
      {
        status: 500,
      }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    const clerkUser = await currentUser();
    let userId = null;
    if (clerkUser) {
      const user = await User.findOne({ clerkId: clerkUser.id });
      userId = user?._id;
    }

    const comments = await Comment.find()
      .populate({
        path: "author",
        select: "username profilePhoto",
      })
      .sort({ createdAt: -1 });

    const commentsWithLikeInfo: CommentWithLikeInfo[] = comments.map(
      (comment) => ({
        ...comment.toObject(),
        isLikedByUser: userId
          ? comment.likes.some(
              (id: Types.ObjectId) => id.toString() === userId.toString()
            )
          : false,
        likesCount: comment.likes.length,
      })
    );

    return NextResponse.json({ tweets: commentsWithLikeInfo }, { status: 200 });
  } catch (err) {
    console.error("Error fetching comments:", err);
    return NextResponse.json(
      {
        error: "Failed to fetch comments",
      },
      { status: 500 }
    );
  }
}
