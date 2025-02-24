import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/backend/utils/mongoose";
import Tweet from "@/backend/models/tweet.model";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const user = await currentUser();
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

    const liked = tweet.likes.includes(user.id);

    if (liked) {
      // if liked remove user id
      tweet.likes = tweet.likes.filter((id: string) => id !== user.id);
    } else {
      // if not liked add user id
      tweet.likes.push(user.id);
    }

    await tweet.save();

    return NextResponse.json({
      success: true,
      liked: !liked,
      likesCount: tweet.likes.length,
    });
  } catch (error) {
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
