import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/backend/utils/mongoose";
import { currentUser } from "@clerk/nextjs/server";
import User from "@/backend/models/user.model";
import Tweet from "@/backend/models/tweet.model";

export async function DELETE(req: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { tweetId } = await req.json();

    const user = await User.findOne({ clerkId: clerkUser.id });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    // Check if the user is the author of the tweet
    if (tweet.author.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: "Unauthorized to delete this tweet" },
        { status: 403 }
      );
    }

    await Tweet.findByIdAndDelete(tweetId);

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
