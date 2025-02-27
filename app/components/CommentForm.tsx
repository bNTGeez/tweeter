"use client";
import { Modal, TextField, Button } from "@mui/material";
import { X } from "lucide-react";
import { useState, useEffect } from "react";

interface CommentFormProps {
  isModalOpen: boolean;
  tweetId: string;
  onClose: () => void;
  onCommentAdded: (comment: {
    _id: string;
    content: string;
    author: {
      username: string;
      _id: string;
    };
    createdAt: string;
    likes: string[];
  }) => void;
}

const CommentForm = ({
  tweetId,
  onCommentAdded,
  isModalOpen,
  onClose,
}: CommentFormProps) => {
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!isModalOpen) {
      setComment("");
    }
  }, [isModalOpen]);

  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: comment, tweetId: tweetId }),
      });

      if (response.ok) {
        const data = await response.json();
        setComment("");
        onClose();
        onCommentAdded?.(data.comment);
      } else {
        throw new Error("Failed to create comment");
      }
    } catch (error) {
      console.error("Error creating comment:", error);
    }
  };

  return (
    <div>
      <Modal open={isModalOpen} onClose={onClose}>
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-4 w-[600px]">
          <div className="flex flex-row gap-4">
            <X
              onClick={onClose}
              className="cursor-pointer hover: text-gray-500"
            />
            <TextField
              label="Reply..."
              multiline
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              variant="standard"
              fullWidth
              InputProps={{
                disableUnderline: true,
              }}
              sx={{
                "& .MuiInputBase-root": {
                  padding: "8px",
                },
              }}
            />
          </div>
          <div className="flex justify-end">
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#475569",
                "&:hover": {
                  backgroundColor: "#334155",
                },
                borderRadius: "9999px",
                textTransform: "none",
                fontWeight: "bold",
                padding: "4px 16px",
              }}
              disabled={comment.length === 0}
              onClick={handleSubmit}
            >
              Reply
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CommentForm;
