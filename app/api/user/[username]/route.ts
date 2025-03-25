import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/backend/utils/mongoose";
import User from "@/backend/models/user.model";
import Tweet from "@/backend/models/tweet.model";
import { currentUser } from "@clerk/nextjs/server";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  context: { params: { username: string } }
) {
  try {
    await connectDB();
    const params = await context.params;
    const clerkUser = await currentUser();
    let userId = null;

    if (clerkUser) {
      const user = await User.findOne({ clerkId: clerkUser.id });
      userId = user?._id;
    }

    const user = await User.findOne({ username: params.username })
      .populate({
        path: "followers",
        select: "username profilePhoto",
      })
      .populate({
        path: "following",
        select: "username profilePhoto",
      });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's tweets with like information
    const tweets = await Tweet.find({ author: user._id })
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
      })
      .sort({ createdAt: -1 });

    // Add isLikedByUser to tweets and comments
    const tweetsWithLikeInfo = tweets.map((tweet) => ({
      ...tweet.toObject(),
      isLikedByUser: userId
        ? tweet.likes.some((id: String) => id.toString() === userId.toString())
        : false,
      comments: tweet.comments.map((comment: any) => ({
        ...comment.toObject(),
        isLikedByUser: userId
          ? comment.likes.some(
              (id: String) => id.toString() === userId.toString()
            )
          : false,
      })),
    }));

    return NextResponse.json(
      {
        user,
        tweets: tweetsWithLikeInfo,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
