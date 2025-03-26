"use client";
import { format } from "date-fns";
import { useState, useEffect, useRef } from "react";
import { Heart, MoreHorizontal, Trash, X } from "lucide-react";
import { MessageCircle } from "lucide-react";
import CommentForm from "./CommentForm";
import Comment from "./Comment";
import { useRouter } from "next/navigation";
import defaultAvatar from "@/public/default-avatar.png";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { useAuth } from "@/backend/utils/auth";
import { useUser } from "@clerk/nextjs";

interface TweetProps {
  tweet: string;
  username: string;
  createdAt: string;
  tweetId: string;
  initialLikes: number;
  initialComment: number;
  isLikedByUser: boolean;
  userId?: string | null;
  profilePhoto?: string;
  onTweetDeleted?: () => void;
  onCommentDeleted?: () => void;
}

interface CommentType {
  _id: string;
  content: string;
  author: {
    username: string;
    _id: string;
    profilePhoto?: string;
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
  profilePhoto,
  onTweetDeleted,
  onCommentDeleted,
}: TweetProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(isLikedByUser);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [commentCount, setCommentCount] = useState(initialComment);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { requireAuth } = useAuth();
  const { user: currentUser } = useUser();

  // Check if this is the current user's tweet
  const isCurrentUserTweet = currentUser?.username === username;

  useEffect(() => {
    setIsLiked(isLikedByUser);
    setLikes(initialLikes);
  }, [isLikedByUser, initialLikes]);

  // Add click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        showDropdown
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments, tweetId]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "h:mm a · MMM d, yyyy");
  };

  const handleDelete = async () => {
    setDeleteError("");
    try {
      const response = await fetch(`/api/tweet/${tweetId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setDeleteError(data.error || "Failed to delete tweet");
        return;
      }

      setShowDeleteDialog(false);

      // If we're on a status page go to home page
      const pathParts = window.location.pathname.split("/");
      if (pathParts.includes("status")) {
        router.push("/home");
      } else {
        // Call the onTweetDeleted callback to refresh the tweets
        onTweetDeleted?.();
      }
    } catch (error) {
      console.error("Error deleting tweet:", error);
      setDeleteError("Failed to delete tweet");
    }
  };

  const handleTweet = async (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/${username}/status/${tweetId}`);
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/${username}`);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!requireAuth()) {
      return;
    }

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

  const handleCommentClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!requireAuth()) {
      return;
    }

    setIsCommentModalOpen(true);
  };

  const handleCommentAdded = (newComment: CommentType) => {
    setIsCommentModalOpen(false);
    setShowComments(true);
    setComments((prevComments) => [newComment, ...prevComments]);
    setCommentCount((prev) => prev + 1);
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/tweet/${tweetId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleCommentDeleted = async () => {
    try {
      // Fetch updated tweet with comments
      const response = await fetch(`/api/tweet/${tweetId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.tweet.comments);
        setCommentCount(data.tweet.comments.length);
      }
      onCommentDeleted?.();
    } catch (error) {
      console.error("Error refreshing comments:", error);
    }
  };

  return (
    <>
      <div
        className="bg-white p-8 w-full relative hover:bg-gray-50 transition-colors duration-200"
        onClick={handleTweet}
      >
        {isCurrentUserTweet && (
          <div ref={dropdownRef} className="absolute top-8 right-8">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <MoreHorizontal size={20} className="text-gray-500" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 flex flex-col gap-2 bg-white rounded-xl shadow-lg border border-gray-200 z-50 p-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(false);
                    setShowDeleteDialog(true);
                  }}
                  className="flex items-center gap-2 text-left hover:bg-gray-50 rounded-lg transition-colors duration-200"
                >
                  <div className="p-2 bg-red-50 rounded-lg">
                    <Trash size={18} className="text-red-600" />
                  </div>
                  <span className="pr-4 font-medium text-red-600">Delete</span>
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex items-start space-x-4 mb-6">
          <img
            src={profilePhoto || defaultAvatar.src}
            alt={username}
            className="w-12 h-12 rounded-full object-cover cursor-pointer"
            onClick={handleProfileClick}
          />
          <div className="flex flex-col flex-grow">
            <div className="flex items-center">
              <span
                className="font-semibold text-slate-800 cursor-pointer hover:underline text-lg"
                onClick={handleProfileClick}
              >
                {username}
              </span>
            </div>
            <p className="text-slate-800 mt-2 text-lg">{tweet}</p>
          </div>
        </div>

        <div className="flex flex-row items-center space-x-8 ml-16">
          <div className="flex flex-row items-center space-x-2">
            <button onClick={handleCommentClick}>
              <MessageCircle size={24} />
            </button>
            <span className="text-gray-500">{commentCount}</span>
          </div>
          <div className="flex flex-row items-center space-x-2 hover:text-red-500 transition-colors">
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
            <span className="text-gray-500">{likes}</span>
          </div>
          <span className="text-sm text-slate-500">
            {formatDate(createdAt)}
          </span>
        </div>

        <CommentForm
          isModalOpen={isCommentModalOpen}
          tweetId={tweetId}
          onClose={() => setIsCommentModalOpen(false)}
          onCommentAdded={handleCommentAdded}
        />

        {showComments && (
          <div className="mt-4" onClick={(e) => e.stopPropagation()}>
            {comments.map((comment: CommentType) => (
              <Comment
                key={comment._id}
                commentId={comment._id}
                comment={comment.content}
                username={comment.author.username}
                createdAt={comment.createdAt}
                initialLikes={comment.likes?.length || 0}
                isLikedByUser={userId ? comment.likes?.includes(userId) : false}
                profilePhoto={comment.author?.profilePhoto}
                userId={userId}
                tweetId={tweetId}
                onCommentDeleted={handleCommentDeleted}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">Delete Tweet</DialogTitle>
        <DialogContent>
          <p>
            Are you sure you want to delete this tweet? This action cannot be
            undone.
          </p>
          {deleteError && <p className="text-red-500 mt-2">{deleteError}</p>}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowDeleteDialog(false)}
            sx={{ color: "#475569" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            sx={{
              backgroundColor: "#EF4444",
              color: "white",
              "&:hover": {
                backgroundColor: "#DC2626",
              },
            }}
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
