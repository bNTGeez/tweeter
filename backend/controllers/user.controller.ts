import User from "../models/user.model";
import { connectDB } from "../utils/mongoose";

export const fetchUser = async (userId: string, userData?: any) => {
  try {
    await connectDB();

    let user = await User.findOne({ clerkId: userId });

    if (!user && userData) {
      // Check if username is already taken
      let username = userData.username;
      let counter = 1;
      while (await User.findOne({ username })) {
        username = `${userData.username}${counter}`;
        counter++;
      }

      user = await User.create({
        clerkId: userId,
        username,
        email: userData.email,
        bio: userData.bio || "",
        profilePhoto: userData.profilePhoto || null,
        tweets: [],
        followers: [],
        following: [],
      });
    } else if (user && userData) {
      user = await updateUser(userId, userData);
    }
    return user;
  } catch (error: any) {
    console.error("Error in fetchUser:", error);
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
};

export const updateUser = async (userId: string, userData: any) => {
  try {
    // If username is being updated, check for conflicts
    if (userData.username) {
      let username = userData.username;
      let counter = 1;
      while (await User.findOne({ username, clerkId: { $ne: userId } })) {
        username = `${userData.username}${counter}`;
        counter++;
      }
      userData.username = username;
    }

    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        $set: {
          username: userData.username,
          bio: userData.bio || "",
          profilePhoto: userData.profilePhoto || null,
        },
      },
      { new: true }
    );

    if (!user) {
      throw new Error("User not found during update");
    }

    return user;
  } catch (error: any) {
    console.error("Update user error:", error);
    throw new Error(`Failed to update user: ${error.message}`);
  }
};
