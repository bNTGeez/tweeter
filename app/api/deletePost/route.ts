import { NextResponse } from "next/server";
import { connectDB } from "@/backend/utils/mongoose";
import { currentUser } from "@clerk/nextjs/server";
import User from "@/backend/models/user.model";
import Tweet from "@/backend/models/tweet.model";

export async function DELETE(req: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ clerkId: clerkUser.id });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get tweetId from URL search params
    const url = new URL(req.url);
    const tweetId = url.searchParams.get("tweetId");

    if (!tweetId) {
      return NextResponse.json(
        { error: "Tweet ID is required" },
        { status: 400 }
      );
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    if (tweet.author.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await Tweet.findByIdAndDelete(tweetId);

    return NextResponse.json(
      { message: "Tweet deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Error deleting tweet" },
      { status: 500 }
    );
  }
}
