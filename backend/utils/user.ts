import { currentUser } from "@clerk/nextjs/server";
import User from "@/backend/models/user.model";

async function generateUniqueUsername(baseUsername: string): Promise<string> {
  let username = baseUsername;
  let counter = 1;

  while (true) {
    const existingUser = await User.findOne({ username });
    if (!existingUser) {
      return username;
    }
    username = `${baseUsername}${counter}`;
    counter++;
  }
}

export async function getOrCreateUser() {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return null;
    }

    let user = await User.findOne({ clerkId: clerkUser.id });

    if (!user) {
      try {
        const baseUsername =
          clerkUser.username || `user_${clerkUser.id.slice(0, 8)}`;
        const uniqueUsername = await generateUniqueUsername(baseUsername);

        user = await User.create({
          clerkId: clerkUser.id,
          username: uniqueUsername,
          profilePhoto: clerkUser.imageUrl,
          email: clerkUser.emailAddresses[0].emailAddress,
          auth: true,
        });
      } catch (error) {
        console.error("Error creating user:", error);
        throw new Error("Failed to create user");
      }
    }

    return user;
  } catch (error) {
    console.error("Error in getOrCreateUser:", error);
    return null;
  }
}
