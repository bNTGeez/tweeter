"use client";
import { useState, useEffect } from "react";
import Tweet from "@/app/components/Tweet";
import Sidebar from "@/app/components/Sidebar";
import Comment from "@/app/components/Comment";
import { format } from "date-fns";

interface PageProps {
  params: {
    username: string;
    id: string;
  };
}

const TweetStatusPage = ({ params }: PageProps) => {
  const [tweet, setTweet] = useState<any>(null);

  const { username, id: tweetId } = params;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "h:mm a · MMM d, yyyy");
  };

  useEffect(() => {
    const fetchTweet = async () => {
      try {
        const response = await fetch(`/api/tweet/${params.id}`);
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
    <div className="flex flex-row">
      <Sidebar />
      <div className="max-w-2xl mx-auto">
        <Tweet
          tweet={tweet.content}
          username={tweet.author.username}
          createdAt={tweet.createdAt}
          tweetId={tweet._id}
          initialLikes={tweet.likes.length}
          initialComment={tweet.comments.length}
          isLikedByUser={tweet.isLikedByUser}
          userId={tweet.userId}
        />
        <div className="">
          {tweet.comments.map((comment: any) => (
            <Comment 
              comment = {comment.content}
              username = {comment.author.username}
              createdAt = {comment.createdAt}
              commentId = {comment._id}
              initialLikes = {comment.likes.length}
              isLikedByUser = {comment.isLikedByUser}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TweetStatusPage;
