"use client";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { MessageCircle } from "lucide-react";
import CommentForm from "./CommentForm";
import Comment from "./Comment";
import { useRouter } from "next/navigation";

interface TweetProps {
  tweet: string;
  username: string;
  createdAt: string;
  tweetId: string;
  initialLikes: number;
  initialComment: number;
  isLikedByUser: boolean;
  userId?: string;
}

interface CommentType {
  _id: string;
  content: string;
  author: {
    username: string;
    _id: string;
  };
  createdAt: string;
  likes: string[];
}

export default function Tweet({
  tweet,
  username,
  createdAt,
  tweetId,
  initialLikes = 0,
  initialComment = 0,
  isLikedByUser = false,
  userId,
}: TweetProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(isLikedByUser);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [commentCount, setCommentCount] = useState(initialComment);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const router = useRouter();
  useEffect(() => {
    setIsLiked(isLikedByUser);
    setLikes(initialLikes);
  }, [isLikedByUser, initialLikes]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "h:mm a · MMM d, yyyy");
  };

  const handleTweet = async (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/${username}/status/${tweetId}`);
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

  const handleCommentClick = async () => {
    setShowComments(!showComments);

    if (!showComments && comments.length === 0) {
      try {
        const response = await fetch(`/api/comments?tweetId=${tweetId} `);
        const data = await response.json();
        if (response.ok) {
          setComments(data.comments);
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    }
  };

  const handleCommentAdded = (newComment: CommentType) => {
    setComments((prevComments) => [newComment, ...prevComments]);
    setCommentCount((prev) => prev + 1);
    setIsCommentModalOpen(false);
  };

  return (
    <div
      className="bg-slate-100 rounded-lg shadow-md p-6 max-w-2xl"
      onClick={handleTweet}
    >
      <div className="flex items-center space-x-2 mb-4">
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800">{username}</span>
          <p className="text-slate-800">{tweet}</p>
        </div>
      </div>
      <div className="flex flex-row items-center space-x-8">
        <div className="flex flex-row items-center space-x-1">
          <button onClick={handleCommentClick}>
            <MessageCircle size={24} />
          </button>
          <span>{commentCount}</span>
        </div>
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
      <CommentForm
        isModalOpen={isCommentModalOpen}
        tweetId={tweetId}
        onClose={() => setIsCommentModalOpen(false)}
        onCommentAdded={handleCommentAdded}
      />

      {showComments && (
        <div className="mt-4">
          {comments.map((comment: CommentType) => (
            <Comment
              key={comment._id}
              commentId={comment._id}
              comment={comment.content}
              username={comment.author.username}
              createdAt={comment.createdAt}
              initialLikes={comment.likes?.length || 0}
              isLikedByUser={userId ? comment.likes?.includes(userId) : false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
