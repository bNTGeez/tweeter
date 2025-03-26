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

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="h-screen w-[250px] bg-gradient-to-b from-slate-600 to-slate-800">
        <div className=" h-[50px] px-8 py-4 text-2xl font-bold text-white hover:text-slate-200 transition-colors duration-200">
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
