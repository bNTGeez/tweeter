// claude ai generated

import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { connectDB } from "@/backend/utils/mongoose";
import { fetchUser } from "@/backend/controllers/user.controller";

// Prevent prerendering of this route
export const dynamic = "force-dynamic";

interface WebhookError extends Error {
  message: string;
  code?: string;
}

// This webhook will be called by Clerk when user events happen
export async function POST(req: NextRequest) {
  try {
    // Get the body
    const payload = await req.json();

    // In development, skip verification
    if (process.env.NODE_ENV === "development") {
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

        try {
          // Create or update user
          await fetchUser(id, {
            username: userName,
            email: primaryEmail,
            profilePhoto: image_url,
            bio: "",
          });
          console.log(
            `User ${id} ${
              payload.type === "user.created" ? "created" : "updated"
            } in database`
          );
        } catch (error) {
          const webhookError = error as WebhookError;
          console.error(`Error processing user ${id}:`, webhookError);
          // If it's a duplicate username error, try with a random suffix
          if (webhookError.message.includes("duplicate key error")) {
            const randomSuffix = Math.floor(Math.random() * 10000);
            await fetchUser(id, {
              username: `${userName}${randomSuffix}`,
              email: primaryEmail,
              profilePhoto: image_url,
              bio: "",
            });
            console.log(`User ${id} created with random suffix`);
          } else {
            throw webhookError;
          }
        }
      }

      return new NextResponse("Test webhook processed", { status: 200 });
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
    if (event.type === "user.created" || event.type === "user.updated") {
      await connectDB();

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

      try {
        // Create or update user
        await fetchUser(id, {
          username: userName,
          email: primaryEmail,
          profilePhoto: image_url,
          bio: "",
        });
        console.log(
          `User ${id} ${
            event.type === "user.created" ? "created" : "updated"
          } in database`
        );
      } catch (error) {
        const webhookError = error as WebhookError;
        console.error(`Error processing user ${id}:`, webhookError);
        // If it's a duplicate username error, try with a random suffix
        if (webhookError.message.includes("duplicate key error")) {
          const randomSuffix = Math.floor(Math.random() * 10000);
          await fetchUser(id, {
            username: `${userName}${randomSuffix}`,
            email: primaryEmail,
            profilePhoto: image_url,
            bio: "",
          });
          console.log(`User ${id} created with random suffix`);
        } else {
          throw webhookError;
        }
      }
    }

    return new NextResponse("Webhook processed", { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new NextResponse("Error processing webhook", { status: 500 });
  }
}
