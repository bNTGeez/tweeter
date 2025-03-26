"use client";
import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/app/components/Sidebar";
import Tweet from "@/app/components/Tweet";
import CreateTweet from "../components/CreateTweet";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface Tweet {
  _id: string;
  content: string;
  author?: {
    username: string;
    _id: string;
    profilePhoto?: string;
  };
  createdAt: string;
  likes?: string[];
  comments?: string[];
  isLikedByUser: boolean;
}

interface UserContentProps {
  tweets: Tweet[];
  fetchTweets: () => Promise<void>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLoading: boolean;
}

function UserContent({
  tweets,
  fetchTweets,
  activeTab,
  setActiveTab,
  isLoading,
}: UserContentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useUser();
  const router = useRouter();

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
              return;
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

        <div className="space-y-6" suppressHydrationWarning>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-500">Loading tweets...</p>
            </div>
          ) : tweets.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              {activeTab === "following"
                ? "No tweets from people you follow yet"
                : "No tweets yet"}
            </div>
          ) : (
            tweets.map((tweet: Tweet) => (
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [activeTab, setActiveTab] = useState("feed");
  const [isLoading, setIsLoading] = useState(true);

  const fetchTweets = useCallback(async () => {
    try {
      setIsLoading(true);
      const endpoint =
        activeTab === "feed" ? "/api/tweetLike" : "/api/tweet/following";
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error("Failed to fetch tweets");
      }
      const data = await response.json();
      setTweets(data.tweets || []);
    } catch (error) {
      console.error("Error fetching tweets:", error);
      setTweets([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  // Initial fetch
  useEffect(() => {
    fetchTweets();
  }, [fetchTweets]);

  // Handle tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="flex min-h-screen">
      <div>
        <Sidebar onTweetCreated={fetchTweets} />
      </div>
      <main className="flex-1">
        <UserContent
          tweets={tweets}
          fetchTweets={fetchTweets}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}
