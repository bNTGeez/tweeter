"use client";

import { useState, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Modal } from "@mui/material";
import defaultProfilePhoto from "@/public/default-avatar.png";
import { useRouter } from "next/navigation";

interface User {
  _id: string;
  username: string;
  profilePhoto?: string;
}

interface SearchbarProps {
  isSearchModalOpen: boolean;
  onClose: () => void;
  onSearch?: () => void;
}

const Searchbar = ({
  isSearchModalOpen,
  onClose,
  onSearch,
}: SearchbarProps) => {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const searchUsers = async () => {
      if (query.length < 2) {
        setUsers([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/user/search?query=${query}`);
        const data = await response.json();
        setUsers(data.users);
      } catch (error) {
        console.error("Error searching users:", error);
      }
      setIsLoading(false);
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleUserClick = (username: string) => {
    router.push(`/${username}`);
    onClose();
    setQuery("");
  };

  return (
    <Modal
      open={isSearchModalOpen}
      onClose={onClose}
      sx={{
        position: "absolute",
        top: "20px",
        left: "270px",
        right: "20px",
        bottom: "20px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
      }}
    >
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg">
        <div className="flex items-center gap-2 p-4 border-b">
          <Search className="w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Users"
            className="w-full bg-transparent outline-none text-lg"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : users.length > 0 ? (
            users.map((user) => (
              <button
                key={user._id}
                onClick={() => handleUserClick(user.username)}
                className="flex items-center gap-2 p-4 hover:bg-gray-100 w-full"
              >
                <img
                  src={user.profilePhoto || defaultProfilePhoto.src}
                  alt={user.username}
                  className="w-10 h-10 rounded-full"
                />
                <span className="font-medium">{user.username}</span>
              </button>
            ))
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-gray-500">No users found</div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
};

export default Searchbar;
