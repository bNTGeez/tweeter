import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/backend/utils/mongoose";
import Tweet from "@/backend/models/tweet.model";
import { currentUser } from "@clerk/nextjs/server";
import User from "@/backend/models/user.model";

export const runtime = "nodejs";

interface CommentType {
  _id: string;
  content: string;
  author: {
    username: string;
    profilePhoto?: string;
  };
  likes: string[];
  createdAt: string;
  toObject: () => CommentType;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const pathParts = req.nextUrl.pathname.split("/");
    const id = pathParts[pathParts.length - 1];

    const clerkUser = await currentUser();
    let userId: string | null = null;

    if (clerkUser) {
      const user = await User.findOne({ clerkId: clerkUser.id });
      userId = user?._id.toString() || null;
    }

    const tweet = await Tweet.findById(id)
      .populate({
        path: "author",
        select: "username profilePhoto",
      })
      .populate({
        path: "comments",
        populate: {
          path: "author",
          select: "username profilePhoto",
        },
      });

    if (!tweet) {
      return new NextResponse(JSON.stringify({ error: "Tweet not found" }), {
        status: 404,
      });
    }

    const tweetWithLikeInfo = {
      ...tweet.toObject(),
      isLikedByUser: userId
        ? tweet.likes.some((likeId: string) => likeId === userId)
        : false,
      comments: tweet.comments.map((comment: CommentType) => ({
        ...comment.toObject(),
        isLikedByUser: userId
          ? comment.likes.some((likeId: string) => likeId === userId)
          : false,
      })),
    };

    return new NextResponse(JSON.stringify({ tweet: tweetWithLikeInfo }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching tweet:", error);
    return new NextResponse(JSON.stringify({ error: "Error fetching tweet" }), {
      status: 500,
    });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    const pathParts = req.nextUrl.pathname.split("/");
    const id = pathParts[pathParts.length - 1];

    if (!id) {
      return new NextResponse(
        JSON.stringify({ error: "Tweet ID not provided" }),
        { status: 400 }
      );
    }

    const clerkUser = await currentUser();

    if (!clerkUser) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const user = await User.findOne({ clerkId: clerkUser.id });
    if (!user) {
      return new NextResponse(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    const tweet = await Tweet.findById(id);
    if (!tweet) {
      return new NextResponse(JSON.stringify({ error: "Tweet not found" }), {
        status: 404,
      });
    }

    if (tweet.author.toString() !== user._id.toString()) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    await Tweet.findByIdAndDelete(id);
    return new NextResponse(
      JSON.stringify({ message: "Tweet deleted successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting tweet:", error);
    return new NextResponse(JSON.stringify({ error: "Error deleting tweet" }), {
      status: 500,
    });
  }
}
