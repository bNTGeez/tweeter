"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import Tweet from "@/app/components/Tweet";
import { useUser, SignOutButton } from "@clerk/nextjs";
import defaultAvatar from "@/public/default-avatar.png";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { useRouter } from "next/navigation";

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
  isLikedByUser: boolean;
}

interface UserProfile {
  _id: string;
  username: string;
  profilePhoto?: string;
  followers: Array<{
    _id: string;
    username: string;
    profilePhoto?: string;
  }>;
  following: Array<{
    _id: string;
    username: string;
    profilePhoto?: string;
  }>;
  followersCount?: number;
  followingCount?: number;
  bio?: string;
}

export default function UserProfile() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;
  const { user: currentUser, isSignedIn } = useUser();
  const [tweets, setTweets] = useState<TweetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const fetchUserProfile = async () => {
    try {
      const userResponse = await fetch(`/api/user/${username}`);
      const userData = await userResponse.json();

      if (userResponse.ok) {
        setProfileUser(userData.user);

        // Check if the current user is following this profile
        if (isSignedIn && currentUser) {
          try {
            // Get the current user's MongoDB document
            const currentUserResponse = await fetch(
              `/api/user/${currentUser.username}`
            );
            if (currentUserResponse.ok) {
              const currentUserData = await currentUserResponse.json();

              // Check if current user has a following list that includes target user
              if (
                currentUserData.user.following &&
                Array.isArray(currentUserData.user.following)
              ) {
                // Convert target user ID to string for comparison
                const targetUserId = userData.user._id.toString();

                // Check if any ID in the following array matches the target user ID
                const isUserFollowing = currentUserData.user.following.some(
                  (following: any) => following._id.toString() === targetUserId
                );

                setIsFollowing(isUserFollowing);
              } else {
                setIsFollowing(false);
              }
            }
          } catch (error) {
            console.error("Error checking follow status:", error);
            setIsFollowing(false);
          }
        } else {
          setIsFollowing(false);
        }
      } else {
        setError(userData.error || "User not found");
        return;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setError("Failed to fetch user profile");
    }
  };

  const handleFollow = async () => {
    if (!isSignedIn) {
      console.log("User not signed in, cannot follow/unfollow");
      return;
    }

    console.log("Attempting to follow/unfollow:", username);

    try {
      const response = await fetch(`/api/user/${username}/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("Error response from follow API:", response.status);
        setError("Failed to update follow status");
        return;
      }

      const data = await response.json();

      // Update UI based on server response
      setIsFollowing(data.following);

      if (profileUser) {
        setProfileUser({
          ...profileUser,
          followersCount: data.followersCount,
          followingCount: data.followingCount,
        });
      }

      // Force refresh the user data
      await fetchUserProfile();
    } catch (error) {
      console.error("Error in follow operation:", error);
      setError("Failed to follow/unfollow user");
    }
  };

  const fetchTweets = async () => {
    try {
      const response = await fetch(`/api/user/${username}`);
      const data = await response.json();

      if (response.ok) {
        setTweets(data.tweets || []);
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

  const navigateToProfile = (profileUsername: string) => {
    if (profileUsername) {
      router.push(`/${profileUsername}`);
    }
  };

  useEffect(() => {
    if (username) {
      fetchUserProfile();
      fetchTweets();
    }
  }, [username, isSignedIn, currentUser]);

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
                    <span className="flex items-center gap-4">
                      <h2 className="text-xl font-bold">
                        {profileUser?.username || String(username)}
                      </h2>
                      {isSignedIn && currentUser?.username !== username && (
                        <button
                          onClick={handleFollow}
                          className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                            isFollowing
                              ? "bg-white border border-gray-300 text-black hover:bg-gray-50"
                              : "bg-blue-500 text-white hover:bg-blue-600"
                          }`}
                        >
                          {isFollowing ? "Following" : "Follow"}
                        </button>
                      )}
                    </span>
                    <div className="flex gap-4 text-gray-500">
                      <span>{tweets.length} tweets</span>
                      <span
                        className="cursor-pointer hover:underline"
                        onClick={() => setShowFollowers(true)}
                      >
                        {profileUser?.followersCount ||
                          profileUser?.followers?.length ||
                          0}{" "}
                        followers
                      </span>
                      <span
                        className="cursor-pointer hover:underline"
                        onClick={() => setShowFollowing(true)}
                      >
                        {profileUser?.followingCount ||
                          profileUser?.following?.length ||
                          0}{" "}
                        following
                      </span>
                    </div>
                  </div>
                </div>
                {isSignedIn && currentUser?.username === username && (
                  <SignOutButton>
                    <button className="px-4 py-1.5 rounded-full text-sm font-semibold bg-red-500 text-white hover:bg-red-600">
                      Sign Out
                    </button>
                  </SignOutButton>
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
                      isLikedByUser={tweet.isLikedByUser}
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
      <Dialog open={showFollowers} onClose={() => setShowFollowers(false)}>
        <DialogTitle>Followers</DialogTitle>
        <DialogContent>
          <div className="space-y-4">
            {profileUser?.followers.map((follower) => (
              <div
                key={follower._id}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => {
                  setShowFollowers(false);
                  navigateToProfile(follower.username);
                }}
              >
                <img
                  src={follower.profilePhoto || defaultAvatar.src}
                  alt={follower.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span className="font-medium">{follower.username}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showFollowing} onClose={() => setShowFollowing(false)}>
        <DialogTitle>Following</DialogTitle>
        <DialogContent>
          <div className="space-y-4">
            {profileUser?.following.map((following) => (
              <div
                key={following._id}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => {
                  setShowFollowing(false);
                  navigateToProfile(following.username);
                }}
              >
                <img
                  src={following.profilePhoto || defaultAvatar.src}
                  alt={following.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span className="font-medium">{following.username}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
