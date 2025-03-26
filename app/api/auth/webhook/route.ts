// claude ai generated

import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { connectDB } from "@/backend/utils/mongoose";
import { fetchUser } from "@/backend/controllers/user.controller";
import User from "@/backend/models/user.model";

export const runtime = "nodejs";

// This webhook will be called by Clerk when user events happen
export async function POST(req: NextRequest) {
  // Get the body
  const payload = await req.json();

  // In development, skip verification
  if (process.env.NODE_ENV === "development") {
    try {
      await connectDB();

      if (payload.type === "user.created" || payload.type === "user.updated") {
        const {
          id,
          username,
          email_addresses,
          image_url,
          first_name,
          last_name,
        } = payload.data;

        // Get primary email
        const primaryEmail =
          email_addresses && email_addresses.length > 0
            ? email_addresses[0].email_address
            : undefined;

        // Generate a username if not available
        const userName =
          username ||
          `${first_name || ""}${last_name || ""}`.trim() ||
          `user_${Math.floor(Math.random() * 10000)}`;

        // Check if user exists
        const user = await User.findOne({ clerkId: id });

        if (!user) {
          // Create new user
          await fetchUser(id, {
            username: userName,
            email: primaryEmail,
            profilePhoto: image_url,
            bio: "",
          });
          console.log(`User ${id} created in database`);
        } else if (payload.type === "user.updated") {
          // Update existing user
          await fetchUser(id, {
            username: userName,
            email: primaryEmail,
            profilePhoto: image_url,
          });
          console.log(`User ${id} updated in database`);
        }
      }

      return new NextResponse("Test webhook processed", { status: 200 });
    } catch (error) {
      console.error("Error processing test webhook:", error);
      return new NextResponse("Error processing test webhook", { status: 500 });
    }
  }

  // Production webhook verification
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET!");
    return new NextResponse("Missing webhook secret", { status: 500 });
  }

  // Get the signature from the headers
  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Missing svix headers", { status: 400 });
  }

  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const webhook = new Webhook(WEBHOOK_SECRET);

  let event: WebhookEvent;

  try {
    // Verify the payload with the headers
    event = webhook.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new NextResponse("Error verifying webhook", { status: 400 });
  }

  // Handle the event
  const eventType = event.type;

  console.log(`Webhook received: ${eventType}`);

  try {
    await connectDB();

    if (eventType === "user.created" || eventType === "user.updated") {
      const {
        id,
        username,
        email_addresses,
        image_url,
        first_name,
        last_name,
      } = event.data;

      // Get primary email
      const primaryEmail =
        email_addresses && email_addresses.length > 0
          ? email_addresses[0].email_address
          : undefined;

      // Generate a username if not available
      const userName =
        username ||
        `${first_name || ""}${last_name || ""}`.trim() ||
        `user_${Math.floor(Math.random() * 10000)}`;

      // Check if user exists
      const user = await User.findOne({ clerkId: id });

      if (!user) {
        // Create new user
        await fetchUser(id, {
          username: userName,
          email: primaryEmail,
          profilePhoto: image_url,
          bio: "",
        });
        console.log(`User ${id} created in database`);
      } else if (eventType === "user.updated") {
        // Update existing user
        await fetchUser(id, {
          username: userName,
          email: primaryEmail,
          profilePhoto: image_url,
        });
        console.log(`User ${id} updated in database`);
      }
    }

    return new NextResponse("Webhook received", { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new NextResponse("Error processing webhook", { status: 500 });
  }
}
