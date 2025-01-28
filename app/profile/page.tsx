'use client'
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Sidebar from "@/app/components/Sidebar";
const page = () => {
  return (
    <div className="flex">
      <Sidebar />
      <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
    </div>
  )
}

export default page
 