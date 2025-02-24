"use client";
import { format } from "date-fns";

interface TweetProps {
  tweet: string;
  username: string;
  createdAt: string;
}

export default function Tweet({ tweet, username, createdAt }: TweetProps) {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "h:mm a · MMM d, yyyy");
  };

  return (
    <div className="bg-slate-100 rounded-lg shadow-md p-6 max-w-2xl">
      <div className="flex items-center space-x-2 mb-4">
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800">{username}</span>
          <p className="text-slate-800">{tweet}</p>
        </div>
      </div>

      <span className="text-sm text-slate-500">{formatDate(createdAt)}</span>
    </div>
  );
}
