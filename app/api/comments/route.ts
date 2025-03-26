import Comment from "@/backend/models/comment.model";
import Tweet from "@/backend/models/tweet.model";
import { NextResponse } from "next/server";
import { connectDB } from "@/backend/utils/mongoose";
import { getOrCreateUser } from "@/backend/utils/user";

export async function POST(req: Request) {
  try {
    await connectDB();
    const user = await getOrCreateUser();

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
  } catch (error: unknown) {
    console.error("Error creating comment:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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
  } catch (error: unknown) {
    console.error("Error fetching comments:", error);
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
    const user = await getOrCreateUser();

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

    if (comment.author.toString() !== user._id.toString()) {
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
  } catch (error: unknown) {
    console.error("Error deleting comment:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDB();
    const user = await getOrCreateUser();

    const { content, commentId } = await req.json();

    if (!content || !commentId) {
      return NextResponse.json(
        { error: "No content or commentID" },
        { status: 400 }
      );
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.author.toString() !== user._id.toString()) {
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
  } catch (error: unknown) {
    console.error("Error updating comment:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 }
    );
  }
}
