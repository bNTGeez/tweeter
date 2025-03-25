import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/backend/utils/mongoose";
import User from "@/backend/models/user.model";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  context: { params: { username: string } }
) {
  try {
    await connectDB();
    const params = await context.params;

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

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
