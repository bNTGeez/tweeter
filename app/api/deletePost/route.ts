import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/backend/utils/mongoose";
import { currentUser } from "@clerk/nextjs/server";
import User from "@/backend/models/user.model";
import Tweet from "@/backend/models/tweet.model";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { tweetId: string } }
) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ clerkId: clerkUser.id });

    const tweet = await Tweet.findById(params.tweetId);

    if (!tweet) {
      NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    if (tweet.author.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await Tweet.findByIdAndDelete(params.tweetId);

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
