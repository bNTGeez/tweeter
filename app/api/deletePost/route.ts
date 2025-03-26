import { NextResponse } from "next/server";
import { connectDB } from "@/backend/utils/mongoose";
import Tweet from "@/backend/models/tweet.model";
import { getOrCreateUser } from "@/backend/utils/user";

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const user = await getOrCreateUser();

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
  } catch (error: unknown) {
    console.error("Error deleting tweet:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Error deleting tweet" },
      { status: 500 }
    );
  }
}
