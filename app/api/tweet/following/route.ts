import { NextResponse } from "next/server";
import { connectDB } from "@/backend/utils/mongoose";
import User from "@/backend/models/user.model";
import Tweet from "@/backend/models/tweet.model";
import { getOrCreateUser } from "@/backend/utils/user";

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
    const user = await getOrCreateUser();
    const userId = user._id;

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
  } catch (error: unknown) {
    console.error("Error fetching following tweets:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch following tweets" },
      { status: 500 }
    );
  }
}
