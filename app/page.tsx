"use client";
import { useUser } from "@clerk/nextjs";

export default function HomePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  if (!isLoaded) return <div>Loading...</div>;
  return (
    <div>{isSignedIn ? `Hello, ${user?.firstName}` : "Not signed in"}</div>
  );
}
