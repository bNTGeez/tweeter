import User from "../models/user.model";
import { connectDB } from "../utils/mongoose";
export const fetchUser = async (userId: string, userData?: any) => {
  try {
    await connectDB();

    let user = await User.findOne({ clerkId: userId });
    if (!user && userData) {
      user = await User.create({
        clerkId: userId,
        username: userData.username,
        email: userData.email,
        password: userData.password,
        bio: userData.bio || "",
        auth: false,
        profilePhoto: userData.profilePhoto || null,
        tweets: [],
      });
    } else if (user && userData) {
      user = await updateUser(userId, userData);
    }
    return user;
  } catch (error: any) {
    throw new Error(`Failed to fetch user ${error.message}`);
  }
};

export const updateUser = async (userId: string, userData: any) => {
  try {
    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        $set: {
          username: userData.username,
          name: userData.name,
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
