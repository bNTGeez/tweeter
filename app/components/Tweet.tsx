"use client";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { MessageCircle } from "lucide-react";

interface TweetProps {
  tweet: string;
  username: string;
  createdAt: string;
  tweetId: string;
  initialLikes: number;
  isLikedByUser: boolean;
}

export default function Tweet({
  tweet,
  username,
  createdAt,
  tweetId,
  initialLikes = 0,
  isLikedByUser = false,
}: TweetProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(isLikedByUser);

  useEffect(() => {
    setIsLiked(isLikedByUser);
    setLikes(initialLikes);
  }, [isLikedByUser, initialLikes]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "h:mm a · MMM d, yyyy");
  };

  const handleLike = async () => {
    try {
      const response = await fetch("/api/tweetLike", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tweetId: tweetId }),
      });
      if (response.ok) {
        const data = await response.json();
        setLikes(data.likesCount);
        setIsLiked(data.liked);
      }
    } catch (error) {
      console.error("Error liking tweet:", error);
    }
  };

  return (
    <div className="bg-slate-100 rounded-lg shadow-md p-6 max-w-2xl">
      <div className="flex items-center space-x-2 mb-4">
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800">{username}</span>
          <p className="text-slate-800">{tweet}</p>
        </div>
      </div>
      <div className="flex flex-row items-center space-x-8">
        <span>
          <MessageCircle size={24} />
        </span>
        <div className="flex flex-row items-center space-x-1 hover:text-red-500 transition-colors">
          <button
            onClick={handleLike}
            className="hover:text-red-500 transition-colors"
          >
            <Heart
              size={24}
              className={`${
                isLiked ? "fill-red-500 text-red-500" : "text-slate-500"
              }`}
            />
          </button>
          <span>{likes}</span>
        </div>
        <span className="text-sm text-slate-500">{formatDate(createdAt)}</span>
      </div>
    </div>
  );
}
