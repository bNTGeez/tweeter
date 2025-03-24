"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import Tweet from "@/app/components/Tweet";
import { useUser } from "@clerk/nextjs";
import defaultAvatar from "@/public/default-avatar.png";

interface TweetType {
  _id: string;
  content: string;
  author: {
    _id: string;
    username: string;
    profilePhoto?: string;
  };
  likes: string[];
  comments: any[];
  createdAt: string;
}

interface UserProfile {
  _id: string;
  username: string;
  profilePhoto?: string;
  followers: any[];
  following: any[];
  bio?: string;
}

export default function UserProfile() {
  const params = useParams();
  const username = params?.username as string;
  const { user: currentUser, isSignedIn } = useUser();
  const [tweets, setTweets] = useState<TweetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      console.log("Fetching user profile for:", username);
      const userResponse = await fetch(`/api/user/${username}`);
      const userData = await userResponse.json();

      if (userResponse.ok) {
        console.log("User data received:", userData);
        setProfileUser(userData.user);

        // Use the isFollowing flag from the API
        setIsFollowing(!!userData.isFollowing);
      } else {
        console.error("Failed to fetch user:", userData.error);
        setError(userData.error || "User not found");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setError("Failed to fetch user profile");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!isSignedIn) return;

    try {
      setError("");
      console.log(
        `Attempting to ${isFollowing ? "unfollow" : "follow"} user:`,
        username
      );

      const response = await fetch(`/api/user/${username}/follow`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Follow response:", data);
        setIsFollowing(data.following);

        // Simply refresh the profile data after follow/unfollow
        fetchUserProfile();
      } else {
        console.error("Failed to follow/unfollow:", data.error);
        setError(data.error || "Failed to follow/unfollow user");
      }
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
      setError("Failed to follow/unfollow user");
    }
  };

  const fetchTweets = async () => {
    try {
      const response = await fetch(`/api/tweet`);
      const data = await response.json();

      if (response.ok) {
        const userTweets = data.tweets.filter(
          (tweet: any) => tweet.author.username === username
        );
        setTweets(userTweets || []);
      } else {
        setError(data.error || "Failed to fetch tweets");
      }
    } catch (error) {
      console.error("Error fetching tweets:", error);
      setError("Failed to fetch tweets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (username) {
      fetchUserProfile();
      fetchTweets();
    }
  }, [username]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 border-l border-r border-gray-200 max-w-2xl">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold">Profile</h1>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <p>Loading profile...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-red-500">{error}</div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={profileUser?.profilePhoto || defaultAvatar.src}
                    alt={profileUser?.username || String(username)}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h2 className="text-xl font-bold">
                      {profileUser?.username || String(username)}
                    </h2>
                    <div className="flex gap-4 text-gray-500">
                      <span>{tweets.length} tweets</span>
                      <span>
                        {profileUser?.followers?.length || 0} followers
                      </span>
                      <span>
                        {profileUser?.following?.length || 0} following
                      </span>
                    </div>
                  </div>
                </div>
                {isSignedIn && currentUser?.username !== username && (
                  <button
                    onClick={handleFollow}
                    className={`px-4 py-2 rounded-full font-semibold ${
                      isFollowing
                        ? "bg-white border border-gray-300 text-black hover:bg-gray-50"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                )}
              </div>
              {profileUser?.bio && (
                <p className="mt-4 text-gray-700">{profileUser.bio}</p>
              )}
            </div>

            <div>
              {tweets.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  This user hasn't tweeted yet.
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {tweets.map((tweet) => (
                    <Tweet
                      key={tweet._id}
                      tweetId={tweet._id}
                      tweet={tweet.content}
                      username={tweet.author.username}
                      createdAt={tweet.createdAt}
                      initialLikes={tweet.likes.length}
                      initialComment={tweet.comments.length}
                      isLikedByUser={
                        isSignedIn && currentUser?.id
                          ? tweet.likes.includes(currentUser.id)
                          : false
                      }
                      profilePhoto={tweet.author.profilePhoto}
                      onTweetDeleted={fetchTweets}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <div className="hidden md:block w-1/4"></div>
    </div>
  );
}
