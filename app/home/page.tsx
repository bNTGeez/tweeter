"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/app/components/Sidebar";
import Tweet from "@/app/components/Tweet";
import Footer from "@/app/components/Footer";
import CreateTweet from "../components/CreateTweet";
function UserContent() {
  const [tweets, setTweets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTweets = async () => {
    try {
      const response = await fetch("/api/tweetLike");
      const data = await response.json();
      setTweets(data.tweets);
    } catch (error) {
      console.error("Error fetching tweets:", error);
    }
  };

  useEffect(() => {
    fetchTweets();
  }, []);

  return (
    <div className="flex flex-col items-center p-8 h-screen bg-slate-100 overflow-auto">
      <div className="w-full max-w-xl">
        <span className="text-3xl font-bold text-slate-800 block mb-8">
          Tweets
        </span>
        <button
          onClick={() => setIsModalOpen(true)}
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
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen">
      <div>
        <Sidebar />
      </div>
      <main className="flex-1">
        <UserContent />
      </main>
    </div>
  );
}
