import { NextResponse } from "next/server";
import { connectDB } from "@/backend/utils/mongoose";
import { currentUser } from "@clerk/nextjs/server";
import User from "@/backend/models/user.model";
import Tweet from "@/backend/models/tweet.model";

interface TweetType {
  _id: string;
  content: string;
  author: {
    username: string;
    profilePhoto?: string;
  };
  likes: string[];
  createdAt: string;
  toObject: () => TweetType;
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

    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userFollowing = await User.findById(userId).select("following");
    const followingIds = userFollowing.following.map((id: string) =>
      id.toString()
    );

    const tweets = await Tweet.find({
      author: { $in: followingIds },
    })
      .populate({
        path: "author",
        select: "username profilePhoto",
      })
      .sort({ createdAt: -1 });

    const tweetsWithLikeInfo = tweets.map((tweet: TweetType) => ({
      ...tweet.toObject(),
      isLikedByUser: tweet.likes.some(
        (id: string) => id.toString() === userId.toString()
      ),
      likesCount: tweet.likes.length,
    }));

    return NextResponse.json({ tweets: tweetsWithLikeInfo }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch following tweets" },
      { status: 500 }
    );
  }
}
