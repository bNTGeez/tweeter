import Comment from "@/backend/models/comment.model";
import User from "@/backend/models/user.model";
import Tweet from "@/backend/models/tweet.model";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/backend/utils/mongoose";
import { fetchUser } from "@/backend/controllers/user.controller";

export async function POST(req: Request) {
  try {
    await connectDB();
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // Fetch or create user
    const user = await fetchUser(clerkUser.id, {
      username:
        clerkUser.username || `user_${Math.floor(Math.random() * 10000)}`,
      email: clerkUser.emailAddresses[0]?.emailAddress,
      profilePhoto: clerkUser.imageUrl,
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found",
        },
        { status: 404 }
      );
    }

    const { content, tweetId } = await req.json();

    if (!content || !tweetId) {
      return NextResponse.json(
        {
          error: "No Content or Tweet ID",
        },
        { status: 400 }
      );
    }

    const comment = await Comment.create({
      content,
      author: user._id,
      tweet: tweetId,
    });

    await Tweet.findByIdAndUpdate(tweetId, {
      $push: { comments: comment._id },
    });

    const populatedComment = await Comment.findById(comment._id).populate({
      path: "author",
      select: "username profilePhoto",
    });

    return NextResponse.json({ comment: populatedComment }, { status: 201 });
  } catch (err) {
    console.error("Error creating comment:", err);
    return NextResponse.json(
      {
        error: "Failed to create comment",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const tweetId = searchParams.get("tweetId");

    if (!tweetId) {
      return NextResponse.json(
        {
          error: "Tweet ID is required",
        },
        {
          status: 400,
        }
      );
    }

    const comments = await Comment.find({ tweet: tweetId })
      .populate({
        path: "author",
        select: "username profilePhoto",
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({ comments }, { status: 200 });
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

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json(
        {
          error: "No comment ID",
        },
        { status: 400 }
      );
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return NextResponse.json(
        {
          error: "No Comment found",
        },
        { status: 404 }
      );
    }

    const user = await User.findOne({ clerkId: clerkUser?.id });
    if (comment.author.toString() != user._id.toString()) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // remove comment from tweet
    await Tweet.findByIdAndUpdate(comment.tweet, {
      $pull: { comments: commentId },
    });

    // delete comment
    await Comment.findByIdAndDelete(commentId);

    return NextResponse.json(
      { message: "Comment deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error deleting comment:", err);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDB();
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, commentId } = await req.json();

    if (!content || !commentId) {
      return NextResponse.json(
        { error: "No content or commentID" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ clerkId: clerkUser.id });

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.author.toString() != user._id.toString()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      {
        content,
      },
      { new: true }
    );

    return NextResponse.json({ comment: updatedComment }, { status: 200 });
  } catch (err) {
    console.error("Error updating comment:", err);
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 }
    );
  }
}
