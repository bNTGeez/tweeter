"use client";
import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { Heart, MoreHorizontal, Trash, X } from "lucide-react";
import defaultAvatar from "@/public/default-avatar.png";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { useAuth } from "@/backend/utils/auth";

interface CommentProps {
  comment: string;
  username: string;
  createdAt: string;
  commentId: string;
  initialLikes: number;
  isLikedByUser: boolean;
  profilePhoto?: string;
  onCommentDeleted?: () => void;
  tweetId?: string;
  userId?: string | null;
}

export default function Comment({
  comment,
  username,
  createdAt,
  commentId,
  initialLikes = 0,
  isLikedByUser = false,
  profilePhoto,
  onCommentDeleted,
  tweetId,
  userId,
}: CommentProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(isLikedByUser);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [formattedDate, setFormattedDate] = useState("");
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const { requireAuth } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFormattedDate(format(new Date(createdAt), "h:mm a · MMM d, yyyy"));
  }, [createdAt]);

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

  const handleDelete = async () => {
    setDeleteError("");
    try {
      const response = await fetch(`/api/comments?commentId=${commentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setDeleteError(data.error || "Failed to delete comment");
        return;
      }

      setShowDeleteDialog(false);
      // If there's a refresh callback, call it
      if (onCommentDeleted) {
        onCommentDeleted();
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      setDeleteError("Failed to delete comment");
    }
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/${username}`);
  };

  const handleLike = async () => {
    // Check authentication before proceeding
    if (!requireAuth()) {
      return; // Will redirect to sign-in page
    }

    try {
      const response = await fetch("/api/commentLike", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ commentId: commentId }),
      });
      if (response.ok) {
        const data = await response.json();
        setLikes(data.likesCount);
        setIsLiked(data.liked);
      }
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  const isCurrentUserComment = isSignedIn && user?.username === username;

  return (
    <div className="bg-white p-6 w-full relative hover:bg-gray-50 transition-colors duration-200">
      {isCurrentUserComment && (
        <div ref={dropdownRef} className="absolute top-6 right-6">
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

      <div className="flex items-start space-x-3 mb-4">
        <img
          src={profilePhoto || defaultAvatar.src}
          alt={username}
          className="w-10 h-10 rounded-full object-cover cursor-pointer"
          onClick={handleProfileClick}
        />
        <div className="flex flex-col flex-grow">
          <div className="flex items-center">
            <span
              className="font-semibold text-slate-800 cursor-pointer hover:underline"
              onClick={handleProfileClick}
            >
              {username}
            </span>
          </div>
          <p className="text-slate-800 mt-1">{comment}</p>
        </div>
      </div>

      <div className="flex flex-row items-center space-x-8 ml-13">
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
        <span className="text-sm text-slate-500">{formattedDate}</span>
      </div>

      {/* Delete Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">Delete Comment</DialogTitle>
        <DialogContent>
          <p>
            Are you sure you want to delete this comment? This action cannot be
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
    </div>
  );
}
