import { NextResponse } from "next/server";
import { connectDB } from "@/backend/utils/mongoose";
import Tweet from "@/backend/models/tweet.model";
import { currentUser } from "@clerk/nextjs/server";
import User from "@/backend/models/user.model";

export const runtime = "nodejs";

// Define a type for comments
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

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    await connectDB();

    const params = await context.params;
    const id = params.id;

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
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    // Example of adding "isLikedByUser" for the tweet and comments:
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

    return NextResponse.json({ tweet: tweetWithLikeInfo }, { status: 200 });
  } catch (error) {
    console.error("Error fetching tweet:", error);
    return NextResponse.json(
      { error: "Error fetching tweet" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    await connectDB();
    const clerkUser = await currentUser();

    // Await the entire context.params object
    const params = await context.params;
    const id = params.id;

    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findOne({ clerkId: clerkUser.id });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const tweet = await Tweet.findById(id);
    if (!tweet) {
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    // Check if the user is the owner of the tweet
    if (tweet.author.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await Tweet.findByIdAndDelete(id);
    return NextResponse.json(
      { message: "Tweet deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting tweet:", error);
    return NextResponse.json(
      { error: "Error deleting tweet" },
      { status: 500 }
    );
  }
}
