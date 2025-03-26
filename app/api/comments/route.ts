import Comment from "@/backend/models/comment.model";
import User from "@/backend/models/user.model";
import Tweet from "@/backend/models/tweet.model";
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/backend/utils/mongoose";

export async function POST(req: NextRequest) {
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

    const user = await User.findOne({ clerkId: clerkUser.id });

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
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to create comment",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
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
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch comments",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
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
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
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
    ).populate({
      path: "author",
      select: "username profilePhoto",
    });

    return NextResponse.json({ comment: updatedComment }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to edit comment" },
      { status: 500 }
    );
  }
}
