import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/backend/utils/mongoose";
import Tweet from "@/backend/models/tweet.model";
import { getOrCreateUser } from "@/backend/utils/user";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await getOrCreateUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tweetId } = await req.json();
    if (!tweetId) {
      return NextResponse.json({ error: "no Tweet ID found" }, { status: 400 });
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    const liked = tweet.likes.includes(user._id);

    if (liked) {
      // if liked remove user id
      tweet.likes = tweet.likes.filter(
        (id: string) => id.toString() !== user._id.toString()
      );
    } else {
      // if not liked add user id
      tweet.likes.push(user._id);
    }

    await tweet.save();

    return NextResponse.json({
      success: true,
      liked: !liked,
      likesCount: tweet.likes.length,
    });
  } catch (error: unknown) {
    console.error("Error in tweet like:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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
    const user = await getOrCreateUser();

    const tweets = await Tweet.find()
      .populate({
        path: "author",
        select: "username profilePhoto",
      })
      .sort({ createdAt: -1 });

    // Add like information only if user is authenticated
    const tweetsWithLikeInfo = tweets.map((tweet) => ({
      ...tweet.toObject(),
      isLikedByUser: user
        ? tweet.likes.some(
            (id: string) => id.toString() === user._id.toString()
          )
        : false,
      likesCount: tweet.likes.length,
    }));

    return NextResponse.json({ tweets: tweetsWithLikeInfo }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error fetching tweets:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      {
        error: "Failed to fetch tweets",
      },
      { status: 500 }
    );
  }
}
