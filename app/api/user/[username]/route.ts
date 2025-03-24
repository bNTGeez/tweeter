import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/backend/utils/mongoose";
import User from "@/backend/models/user.model";
import { currentUser } from "@clerk/nextjs/server";

export const runtime = "nodejs"; // force Node.js runtime (not Edge)

export async function GET(
  req: NextRequest,
  context: { params: { username: string } }
) {
  try {
    await connectDB();
    const params = await context.params;
    const clerkUser = await currentUser();

    console.log("Fetching user with username:", params.username);

    // Find the user and populate followers/following
    const user = await User.findOne({ username: params.username })
      .populate({
        path: "followers",
        select: "username profilePhoto clerkId",
      })
      .populate({
        path: "following",
        select: "username profilePhoto clerkId",
      });

    if (!user) {
      console.log("User not found:", params.username);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if current user is following this profile
    let isFollowing = false;
    if (clerkUser) {
      const currentUserDoc = await User.findOne({ clerkId: clerkUser.id });
      if (currentUserDoc) {
        isFollowing = currentUserDoc.following.some(
          (followingId: any) => followingId.toString() === user._id.toString()
        );
      }
    }

    console.log("User found:", user.username);
    console.log("Follower count:", user.followers.length);
    console.log("Following count:", user.following.length);

    return NextResponse.json(
      {
        user,
        isFollowing,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
