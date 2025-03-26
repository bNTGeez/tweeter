import Tweet from "@/backend/models/tweet.model";
import { NextResponse } from "next/server";
import { connectDB } from "@/backend/utils/mongoose";
import { getOrCreateUser } from "@/backend/utils/user";

interface CommentType {
  _id: string;
  content: string;
  author: {
    username: string;
    profilePhoto?: string;
  };
  likes: string[];
  createdAt: string;
  toObject: () => CommentType;
}

export async function POST(req: Request) {
  try {
    console.log("Connecting to database...");
    await connectDB();
    console.log("Database connected successfully");

    console.log("Getting or creating user...");
    const user = await getOrCreateUser();
    console.log("User retrieved:", user.username);

    const { content } = await req.json();
    console.log("Received content:", content);

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    console.log("Creating tweet...");
    const tweet = await Tweet.create({
      content,
      author: user._id,
    });
    console.log("Tweet created successfully:", tweet._id);

    return NextResponse.json({ tweet }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error in POST /api/tweet:", error);
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("MONGODB_URI")) {
        return NextResponse.json(
          { error: "Database connection error" },
          { status: 500 }
        );
      }
      if (error.message === "Failed to create user") {
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        );
      }
    }
    return NextResponse.json(
      { error: "Failed to create tweet" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    console.log("Connecting to database...");
    await connectDB();
    console.log("Database connected successfully");

    console.log("Fetching tweets...");
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

    // Try to get current user if logged in, but don't require it
    let userId = null;
    const user = await getOrCreateUser();
    if (user) {
      userId = user._id;
      console.log("User authenticated");
    } else {
      console.log("No authenticated user, showing public feed");
    }

    // Add isLikedByUser only if user is logged in
    const tweetsWithLikeInfo = tweets.map((tweet) => ({
      ...tweet.toObject(),
      isLikedByUser: userId
        ? tweet.likes.some((id: string) => id.toString() === userId.toString())
        : false,
      comments: tweet.comments.map((comment: CommentType) => ({
        ...comment.toObject(),
        isLikedByUser: userId
          ? comment.likes.some(
              (id: string) => id.toString() === userId.toString()
            )
          : false,
      })),
    }));

    console.log(`Successfully fetched ${tweets.length} tweets`);
    return NextResponse.json({ tweets: tweetsWithLikeInfo }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error in GET /api/tweet:", error);
    if (error instanceof Error) {
      if (error.message.includes("MONGODB_URI")) {
        return NextResponse.json(
          { error: "Database connection error" },
          { status: 500 }
        );
      }
    }
    return NextResponse.json(
      { error: "Failed to fetch tweets" },
      { status: 500 }
    );
  }
}
