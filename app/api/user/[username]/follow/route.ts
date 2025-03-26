import { NextResponse } from "next/server";
import { connectDB } from "@/backend/utils/mongoose";
import User from "@/backend/models/user.model";
import { currentUser } from "@clerk/nextjs/server";

export const runtime = "nodejs";

export async function POST(
  req: Request,
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


    const params = await context.params;
    const username = params.username;
    const targetUser = await User.findOne({ username });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }

    try {
      // Check if following array check
      let following = false;
      if (user.following && Array.isArray(user.following)) {
        following = user.following.some(
          (id: string) => id.toString() === targetUser._id.toString()
        );
      }

      if (!following) {
        // Store direct reference to IDs
        const userId = user._id;
        const targetId = targetUser._id;

        // First ensure the arrays are initialized if needed
        if (!user.following) {
          user.following = [];
          await user.save();
        }

        if (!targetUser.followers) {
          targetUser.followers = [];
          await targetUser.save();
        }

        user.following.push(targetId);
        targetUser.followers.push(userId);

        // Save both documents
        await user.save();
        await targetUser.save();

        // Re-fetch to verify the change
        const updatedTarget = await User.findById(targetId);

        return NextResponse.json({
          following: true,
          followersCount: updatedTarget.followers.length,
          followingCount: updatedTarget.following
            ? updatedTarget.following.length
            : 0,
        });
      } else {
        // Store direct reference to IDs as strings for comparison
        const userId = user._id;
        const targetId = targetUser._id;
        const userIdStr = userId.toString();
        const targetIdStr = targetId.toString();

        // Remove the follow relationship - direct method
        if (user.following && Array.isArray(user.following)) {
          user.following = user.following.filter(
            (id: string) => id.toString() !== targetIdStr
          );
        }

        if (targetUser.followers && Array.isArray(targetUser.followers)) {
          targetUser.followers = targetUser.followers.filter(
            (id: string) => id.toString() !== userIdStr
          );
        }

        // Save both documents
        await user.save();
        await targetUser.save();

        // Re-fetch to verify the change
        const updatedTarget = await User.findById(targetId);

        return NextResponse.json({
          following: false,
          followersCount: updatedTarget.followers
            ? updatedTarget.followers.length
            : 0,
          followingCount: updatedTarget.following
            ? updatedTarget.following.length
            : 0,
        });
      }
    } catch (dbError) {
      console.error("Database error in follow/unfollow operation:", dbError);
      return NextResponse.json(
        { error: "Error updating follow status in database" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in follow/unfollow API:", error);
    return NextResponse.json(
      { error: "Error following/unfollowing user" },
      { status: 500 }
    );
  }
}
