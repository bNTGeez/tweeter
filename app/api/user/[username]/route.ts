import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/backend/utils/mongoose";
import User from "@/backend/models/user.model";
import Tweet from "@/backend/models/tweet.model";
import { currentUser } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/clerk-sdk-node";
import Comment from "@/backend/models/comment.model";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  context: { params: { username: string } }
) {
  try {
    await connectDB();
    const params = await context.params;
    const clerkUser = await currentUser();
    let userId = null;

    if (clerkUser) {
      const user = await User.findOne({ clerkId: clerkUser.id });
      userId = user?._id;
    }

    const user = await User.findOne({ username: params.username })
      .populate({
        path: "followers",
        select: "username profilePhoto",
      })
      .populate({
        path: "following",
        select: "username profilePhoto",
      });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's tweets with like information
    const tweets = await Tweet.find({ author: user._id })
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

    // Add isLikedByUser to tweets and comments
    const tweetsWithLikeInfo = tweets.map((tweet) => ({
      ...tweet.toObject(),
      isLikedByUser: userId
        ? tweet.likes.some((id: String) => id.toString() === userId.toString())
        : false,
      comments: tweet.comments.map((comment: any) => ({
        ...comment.toObject(),
        isLikedByUser: userId
          ? comment.likes.some(
              (id: String) => id.toString() === userId.toString()
            )
          : false,
      })),
    }));

    return NextResponse.json(
      {
        user,
        tweets: tweetsWithLikeInfo,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: { username: string } }
) {
  try {
    await connectDB();
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findOne({ clerkId: clerkUser.id });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { username, bio } = await req.json();

    // Check if username is being changed
    if (username !== user.username) {
      // Check if new username is already taken
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 400 }
        );
      }

      // Update username in Clerk
      try {
        await clerkClient.users.updateUser(clerkUser.id, {
          username: username,
        });
      } catch (error) {
        console.error("Error updating Clerk username:", error);
        return NextResponse.json(
          { error: "Failed to update username in authentication service" },
          { status: 500 }
        );
      }

      // Update username in all tweets
      const tweets = await Tweet.find({ author: user._id });
      for (const tweet of tweets) {
        tweet.author = user._id;
        await tweet.save();
      }

      // Update username in all comments
      const comments = await Comment.find({ author: user._id });
      for (const comment of comments) {
        comment.author = user._id;
        await comment.save();
      }

      // Update username in followers' following lists
      await User.updateMany(
        { following: user._id },
        { $set: { "following.$": user._id } }
      );

      // Update username in following's followers lists
      await User.updateMany(
        { followers: user._id },
        { $set: { "followers.$": user._id } }
      );

      // Update the user's username
      user.username = username;
    }

    // Update bio if it changed
    if (bio !== user.bio) {
      user.bio = bio;
    }

    await user.save();

    // Fetch the updated user
    const updatedUser = await User.findById(user._id)
      .populate({
        path: "followers",
        select: "username profilePhoto",
      })
      .populate({
        path: "following",
        select: "username profilePhoto",
      });

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
