"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Tweet from "@/app/components/Tweet";
import Sidebar from "@/app/components/Sidebar";
import Comment from "@/app/components/Comment";

interface TweetType {
  _id: string;
  content: string;
  author: {
    username: string;
    profilePhoto?: string;
  };
  likes: string[];
  comments: Array<{
    _id: string;
    content: string;
    author: {
      username: string;
      profilePhoto?: string;
    };
    createdAt: string;
    likes: string[];
    isLikedByUser: boolean;
  }>;
  createdAt: string;
  isLikedByUser: boolean;
  userId?: string;
}

export default function TweetStatusPage() {
  const [tweet, setTweet] = useState<TweetType | null>(null);
  const params = useParams();
  const tweetId = params.id as string;

  useEffect(() => {
    const fetchTweet = async () => {
      try {
        const response = await fetch(`/api/tweet/${tweetId}`);
        const data = await response.json();
        setTweet(data.tweet);
      } catch (error) {
        console.error("Error fetching tweet:", error);
      }
    };

    fetchTweet();
  }, [tweetId]);

  if (!tweet) return <div>Loading...</div>;

  return (
    <div className="flex flex-row h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="w-[800px] px-4 mx-auto py-4">
          <div className="border border-gray-200">
            <Tweet
              tweet={tweet.content}
              username={tweet.author.username}
              createdAt={tweet.createdAt}
              tweetId={tweet._id}
              initialLikes={tweet.likes.length}
              initialComment={tweet.comments.length}
              isLikedByUser={tweet.isLikedByUser}
              userId={tweet.userId}
              profilePhoto={tweet.author?.profilePhoto}
            />
            <div className="border-t border-slate-200">
              {tweet.comments.map((comment) => (
                <Comment
                  key={comment._id}
                  comment={comment.content}
                  username={comment.author.username}
                  createdAt={comment.createdAt}
                  commentId={comment._id}
                  initialLikes={comment.likes.length}
                  isLikedByUser={comment.isLikedByUser}
                  profilePhoto={comment.author?.profilePhoto}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
