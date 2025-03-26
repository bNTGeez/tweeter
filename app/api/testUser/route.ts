// app/api/testUser/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { fetchUser } from "@/backend/controllers/user.controller";

interface UserData {
  clerkId: string;
  username: string;
  email: string | undefined;
  bio: string;
  profilePhoto: string | null;
}

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get primary email
    const primaryEmail = user.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId
    )?.emailAddress;

    // Prepare user data
    const userData: UserData = {
      clerkId: user.id,
      username:
        user.username ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      email: primaryEmail,
      bio: "",
      profilePhoto: user.imageUrl,
    };

    const dbUser = await fetchUser(user.id, userData);

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(dbUser, { status: 200 });
  } catch (err) {
    console.error("Error in testUser:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
