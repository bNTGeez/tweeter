"use client";
import { useState } from "react";
import Link from "next/link";
import { House, Search, PenLine, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import CreateTweet from "@/app/components/CreateTweet";
import Searchbar from "./Searchbar";

interface SidebarProps {
  onTweetCreated?: () => void;
}

export default function Sidebar({ onTweetCreated }: SidebarProps) {
  const { isSignedIn, isLoaded, user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const router = useRouter();

  if (!isLoaded) {
    return null;
  }

  const handleProfile = (): void => {
    if (isSignedIn && user?.username) {
      router.push(`/${user.username}`);
    } else {
      router.push("auth/sign-in");
    }
  };

  const handleCreateTweet = (): void => {
    if (isSignedIn) {
      setIsModalOpen(true);
    } else {
      router.push("auth/sign-in");
    }
  };

  const handleSearch = (): void => {
    if (isSignedIn) {
      setIsSearchModalOpen(true);
    } else {
      router.push("auth/sign-in");
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-screen w-[250px] bg-gradient-to-b from-slate-600 to-slate-800 fixed">
        <div className="h-[50px] px-8 py-4 text-2xl font-bold text-white hover:text-slate-200 transition-colors duration-200">
          <span className="text-blue-300">T</span>weeter
        </div>
        <div className="flex flex-col text-white text-xl gap-8 pt-[25px]">
          <Link
            href="/home"
            className="flex items-center gap-3 px-[25px] py-2 hover:bg-slate-700 transition-colors duration-200 rounded-lg mx-2"
          >
            <House className="w-6 h-6" />
            <span className="font-medium">Home</span>
          </Link>
          <button
            className="flex items-center gap-3 px-[25px] py-2 hover:bg-slate-700 transition-colors duration-200 rounded-lg mx-2"
            onClick={handleSearch}
          >
            <Search className="w-6 h-6" />
            <span className="font-medium">Search</span>
          </button>
          <button
            className="flex items-center gap-3 px-[25px] py-2 hover:bg-slate-700 transition-colors duration-200 rounded-lg mx-2"
            onClick={handleCreateTweet}
          >
            <PenLine className="w-6 h-6" />
            <span className="font-medium">Create Tweet</span>
          </button>
          <button
            className="flex items-center gap-3 px-[25px] py-2 hover:bg-slate-700 transition-colors duration-200 rounded-lg mx-2"
            onClick={handleProfile}
          >
            <User className="w-6 h-6" />
            <span className="font-medium">Profile</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16">
          <Link
            href="/home"
            className="flex flex-col items-center justify-center w-full h-full text-gray-600 hover:text-blue-500"
          >
            <House className="w-6 h-6" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <button
            onClick={handleSearch}
            className="flex flex-col items-center justify-center w-full h-full text-gray-600 hover:text-blue-500"
          >
            <Search className="w-6 h-6" />
            <span className="text-xs mt-1">Search</span>
          </button>
          <button
            onClick={handleCreateTweet}
            className="flex flex-col items-center justify-center w-full h-full text-gray-600 hover:text-blue-500"
          >
            <PenLine className="w-6 h-6" />
            <span className="text-xs mt-1">Tweet</span>
          </button>
          <button
            onClick={handleProfile}
            className="flex flex-col items-center justify-center w-full h-full text-gray-600 hover:text-blue-500"
          >
            <User className="w-6 h-6" />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
        <div className="h-14 px-4 flex items-center justify-between">
          <div className="text-xl font-bold">
            <span className="text-blue-300">T</span>weeter
          </div>
        </div>
      </div>

      <CreateTweet
        isModalOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTweetCreated={onTweetCreated}
      />
      <Searchbar
        isSearchModalOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </>
  );
}
