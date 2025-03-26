"use client";
import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/app/components/Sidebar";
import Tweet from "@/app/components/Tweet";
import Footer from "@/app/components/Footer";
import CreateTweet from "../components/CreateTweet";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface UserContentProps {
  tweets: any[];
  fetchTweets: () => Promise<void>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

function UserContent({
  tweets,
  fetchTweets,
  activeTab,
  setActiveTab,
}: UserContentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    fetchTweets();
  }, [activeTab, fetchTweets]);

  return (
    <div className="flex flex-col items-center p-8 h-screen bg-slate-100 overflow-auto">
      <div className="w-full max-w-xl">
        <div className="flex justify-center mb-8">
          <div className="w-[800px] flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              className={`flex-1 py-3 text-center font-semibold transition-colors relative ${
                activeTab === "feed"
                  ? "text-blue-500 border-b-2 border-blue-500"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("feed")}
            >
              Feed
            </button>
            <button
              className={`flex-1 py-3 text-center font-semibold transition-colors relative ${
                activeTab === "following"
                  ? "text-blue-500 border-b-2 border-blue-500"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("following")}
            >
              Following
            </button>
          </div>
        </div>
        <button
          onClick={() => {
            if (!user) {
              router.push("/auth/sign-in");
            }
            setIsModalOpen(true);
          }}
          className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg mb-8"
        >
          Create Tweet
        </button>
        <CreateTweet
          isModalOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onTweetCreated={fetchTweets}
        />

        <div className="space-y-6">
          {tweets.map((tweet: any) => (
            <Tweet
              key={tweet._id}
              tweetId={tweet._id}
              tweet={tweet.content}
              username={tweet.author?.username || "Unknown User"}
              createdAt={tweet.createdAt}
              initialLikes={tweet.likes?.length || 0}
              initialComment={tweet.comments?.length || 0}
              isLikedByUser={tweet.isLikedByUser}
              userId={tweet.author?._id}
              profilePhoto={tweet.author?.profilePhoto}
              onTweetDeleted={fetchTweets}
              onCommentDeleted={fetchTweets}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [tweets, setTweets] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("feed");

  const fetchTweets = async () => {
    try {
      const endpoint =
        activeTab === "feed" ? "/api/tweetLike" : "/api/tweet/following";
      const response = await fetch(endpoint);
      const data = await response.json();
      setTweets(data.tweets || []);
    } catch (error) {
      console.error("Error fetching tweets:", error);
      setTweets([]);
    }
  };

  const memoizedFetchTweets = useCallback(fetchTweets, [activeTab]);

  return (
    <div className="flex min-h-screen">
      <div>
        <Sidebar onTweetCreated={memoizedFetchTweets} />
      </div>
      <main className="flex-1">
        <UserContent
          tweets={tweets}
          fetchTweets={memoizedFetchTweets}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </main>
    </div>
  );
}
