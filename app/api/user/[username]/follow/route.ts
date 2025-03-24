import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/backend/utils/mongoose";
import User from "@/backend/models/user.model";
import { currentUser } from "@clerk/nextjs/server";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  context: { params: { username: string } }
) {
  try {
    await connectDB();
    const clerkUser = await currentUser();
    const params = await context.params;

    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findOne({ clerkId: clerkUser.id });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetUser = await User.findOne({ username: params.username });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }

    if (user._id.toString() === targetUser._id.toString()) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    const isFollowing = user.following.some(
      (id) => id.toString() === targetUser._id.toString()
    );

    console.log(
      `User ${user.username} is ${
        isFollowing ? "already following" : "not following"
      } ${targetUser.username}`
    );

    if (!isFollowing) {
      await User.findByIdAndUpdate(user._id, {
        $addToSet: { following: targetUser._id },
      });
      await User.findByIdAndUpdate(targetUser._id, {
        $addToSet: { followers: user._id },
      });

      console.log(
        `User ${user.username} is now following ${targetUser.username}`
      );
      return NextResponse.json(
        {
          following: true,
          message: `You are now following ${targetUser.username}`,
        },
        { status: 200 }
      );
    } else {
      await User.findByIdAndUpdate(user._id, {
        $pull: { following: targetUser._id },
      });
      await User.findByIdAndUpdate(targetUser._id, {
        $pull: { followers: user._id },
      });

      console.log(
        `User ${user.username} has unfollowed ${targetUser.username}`
      );
      return NextResponse.json(
        {
          following: false,
          message: `You have unfollowed ${targetUser.username}`,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error following/unfollowing user:", error);
    return NextResponse.json(
      { error: "Error following/unfollowing user" },
      { status: 500 }
    );
  }
}
