import { useState } from "react";
import { Modal, TextField, Button } from "@mui/material";
import { X } from "lucide-react";

interface CreateTweetProps {
  isModalOpen: boolean;
  onClose: () => void;
}

const CreateTweet = ({ isModalOpen, onClose }: CreateTweetProps) => {
  const [tweet, setTweet] = useState("");

  return (
    <div>
      <Modal open={isModalOpen} onClose={onClose}>
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-4 w-[600px]">
          <div className="flex flex-row gap-4">
            <X onClick={onClose} className="cursor-pointer hover: text-gray-500"/>
            <TextField
              label="What's happening?"
              multiline
              rows={4}
              value={tweet}
              onChange={(e) => setTweet(e.target.value)}
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
              disabled={tweet.length === 0}
            >
              Post
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CreateTweet;
