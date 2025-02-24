"use client";
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import Sidebar from "@/app/components/Sidebar";
import ProfileSettings from "@/app/components/ProfileSettings";
const ProfilePage = () => {
  const { user } = useUser();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-slate-100">
        <div className = "max-w-2xl mx-auto">
          <h1 className = "text-3xl font-bold text-slate-800 mb-8">Profile Settings</h1>

          
        <SignedOut>
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="mb-4">Please sign in to view your profile</p>
          <SignInButton />
          </div>
        </SignedOut>

        <SignedIn>
          <div className="bg-white rounded-lg p-8 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <UserButton />
              <div>
                <h2 className="text-xl font-semibold">{user?.fullName || 'No name set'}</h2>
                <p className="text-gray-600">{user?.primaryEmailAddress?.emailAddress}</p>
              </div>
            </div>
            <ProfileSettings />
          </div>
        </SignedIn>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
