import Tweet from "@/backend/models/tweet.model";
import User from "@/backend/models/user.model";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/backend/utils/mongoose";

export async function POST(req: Request) {
  try {
    await connectDB();
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user = await User.findOne({ clerkId: clerkUser.id });
    if (!user) {
      user = await User.create({
        clerkId: clerkUser.id,
        username: clerkUser.username,
        profilePhoto: clerkUser.imageUrl,
        email: clerkUser.emailAddresses[0].emailAddress,
      });
    }

    const { content } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const tweet = await Tweet.create({
      content,
      author: user._id,
    });
    console.log("Created tweet:", tweet);
    return NextResponse.json({ tweet }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create tweet" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();

    const tweets = await Tweet.find()
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

    console.log("Fetched tweets:", tweets);
    return NextResponse.json({ tweets }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch tweets" },
      { status: 500 }
    );
  }
}
