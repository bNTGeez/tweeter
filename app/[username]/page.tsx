"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import Tweet from "@/app/components/Tweet";
import { useUser, SignOutButton } from "@clerk/nextjs";
import defaultAvatar from "@/public/default-avatar.png";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import Image from "next/image";

interface TweetType {
  _id: string;
  content: string;
  author: {
    _id: string;
    username: string;
    profilePhoto?: string;
  };
  likes: string[];
  comments: Array<{
    _id: string;
    content: string;
    author: {
      _id: string;
      username: string;
      profilePhoto?: string;
    };
    createdAt: string;
    likes: string[];
  }>;
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

interface FollowingUser {
  _id: string;
  username: string;
  profilePhoto?: string;
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
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    bio: "",
  });
  const [editError, setEditError] = useState("");

  const handleEditProfile = async () => {
    try {
      const response = await fetch(`/api/user/${username}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (!response.ok) {
        setEditError(data.error || "Failed to update profile");
        return;
      }

      // If username was changed, redirect to the new profile
      if (data.user.username !== username) {
        // Update the Clerk user's username
        if (currentUser) {
          await currentUser.update({ username: data.user.username });
        }
        router.push(`/${data.user.username}`);
      } else {
        // If only bio was changed, refresh the current page
        await fetchUserProfile();
        setShowEditProfileDialog(false);
        setEditError("");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setEditError("Failed to update profile");
    }
  };

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      const userResponse = await fetch(`/api/user/${username}`);
      const userData = await userResponse.json();

      if (userResponse.ok) {
        setProfileUser(userData.user);

        // Check if this is the current user's profile
        if (isSignedIn && currentUser && currentUser.username === username) {
          setIsFollowing(false); // Don't show follow button for own profile
          return;
        }

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
                  (following: FollowingUser) =>
                    following._id.toString() === targetUserId
                );

                setIsFollowing(isUserFollowing);
              } else {
                setIsFollowing(false);
              }
            }
          } catch {
            console.error("Error checking follow status:");
            setIsFollowing(false);
          }
        } else {
          setIsFollowing(false);
        }
      } else {
        setError(userData.error || "User not found");
      }
    } catch {
      console.error("Error fetching user profile:");
      setError("Failed to fetch user profile");
    } finally {
      setLoading(false);
    }
  }, [username, isSignedIn, currentUser]);

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

  const fetchTweets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/${username}`);
      if (response.ok) {
        const data = await response.json();
        setTweets(data.tweets);
      } else {
        setError("Failed to fetch tweets");
      }
    } catch {
      console.error("Error fetching tweets:");
      setError("Failed to fetch tweets");
    } finally {
      setLoading(false);
    }
  }, [username]);

  const handleTweetDeleted = () => {
    fetchTweets(); // Refresh tweets when one is deleted
  };

  const navigateToProfile = (profileUsername: string) => {
    if (profileUsername) {
      router.push(`/${profileUsername}`);
    }
  };

  useEffect(() => {
    if (username) {
      // Set isFollowing to false immediately if it's your own profile
      if (isSignedIn && currentUser?.username === username) {
        setIsFollowing(false);
      }
      fetchUserProfile();
      fetchTweets();
    }
  }, [
    username,
    isSignedIn,
    currentUser?.username,
    fetchUserProfile,
    fetchTweets,
  ]);

  useEffect(() => {
    if (showEditProfileDialog && profileUser) {
      setEditForm({
        username: profileUser.username,
        bio: profileUser.bio || "",
      });
    }
  }, [showEditProfileDialog, profileUser]);

  return (
    <div className="flex min-h-screen">
      <Sidebar onTweetCreated={fetchTweets} />
      <div className="flex-1 md:ml-[250px] overflow-y-auto pb-20 md:pb-8">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="bg-white border border-gray-200 rounded-lg">
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
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <Image
                        src={profileUser?.profilePhoto || defaultAvatar}
                        alt={profileUser?.username || "Profile"}
                        width={120}
                        height={120}
                        className="rounded-full"
                      />
                      <div>
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                          <h2 className="text-xl font-bold">
                            {profileUser?.username || String(username)}
                          </h2>
                          {isSignedIn && currentUser?.username !== username && (
                            <button
                              onClick={handleFollow}
                              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap ${
                                isFollowing
                                  ? "bg-white border border-gray-300 text-black hover:bg-gray-50"
                                  : "bg-blue-500 text-white hover:bg-blue-600"
                              }`}
                            >
                              {isFollowing ? "Following" : "Follow"}
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-gray-500 mt-2">
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
                      <div className="flex items-center gap-2 md:gap-5">
                        <button
                          onClick={() => setShowEditProfileDialog(true)}
                          className="px-4 py-1.5 rounded-full text-sm font-semibold bg-black text-white hover:bg-gray-800 whitespace-nowrap"
                        >
                          Edit Profile
                        </button>
                        <button
                          onClick={() => setShowSignOutDialog(true)}
                          className="px-4 py-1.5 rounded-full text-sm font-semibold bg-red-500 text-white hover:bg-red-600 whitespace-nowrap"
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                  {profileUser?.bio && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">
                        Bio
                      </h3>
                      <p className="text-gray-600 mt-2">{profileUser.bio}</p>
                    </div>
                  )}
                </div>

                <div>
                  {tweets.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      This user hasn&apos;t tweeted yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {tweets.map((tweet) => (
                        <Tweet
                          key={tweet._id}
                          tweet={tweet.content}
                          username={tweet.author.username}
                          createdAt={tweet.createdAt}
                          tweetId={tweet._id}
                          initialLikes={tweet.likes.length}
                          initialComment={tweet.comments.length}
                          isLikedByUser={tweet.isLikedByUser}
                          profilePhoto={tweet.author?.profilePhoto}
                          onTweetDeleted={handleTweetDeleted}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog
        open={showFollowers}
        onClose={() => setShowFollowers(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            maxHeight: "80vh",
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            margin: "16px",
          },
        }}
      >
        <DialogTitle className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Followers</h2>
            <button
              onClick={() => setShowFollowers(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </DialogTitle>
        <DialogContent className="p-0">
          <div className="divide-y divide-gray-200">
            {profileUser?.followers.map((follower) => (
              <div
                key={follower._id}
                className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => {
                  setShowFollowers(false);
                  navigateToProfile(follower.username);
                }}
              >
                <Image
                  src={follower.profilePhoto || defaultAvatar}
                  alt={follower.username}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900">
                    {follower.username}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showFollowing}
        onClose={() => setShowFollowing(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            maxHeight: "80vh",
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            margin: "16px",
          },
        }}
      >
        <DialogTitle className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Following</h2>
            <button
              onClick={() => setShowFollowing(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </DialogTitle>
        <DialogContent className="p-0">
          <div className="divide-y divide-gray-200">
            {profileUser?.following.map((following) => (
              <div
                key={following._id}
                className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => {
                  setShowFollowing(false);
                  navigateToProfile(following.username);
                }}
              >
                <Image
                  src={following.profilePhoto || defaultAvatar}
                  alt={following.username}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900">
                    {following.username}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showEditProfileDialog}
        onClose={() => setShowEditProfileDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            maxHeight: "80vh",
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            margin: "16px",
          },
        }}
      >
        <DialogTitle className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Edit Profile</h2>
            <button
              onClick={() => setShowEditProfileDialog(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </DialogTitle>
        <DialogContent className="p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <TextField
                fullWidth
                value={editForm.username}
                onChange={(e) =>
                  setEditForm({ ...editForm, username: e.target.value })
                }
                variant="outlined"
                size="small"
                error={!!editError}
                helperText={editError}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    "&:hover fieldset": {
                      borderColor: "#000",
                    },
                  },
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={editForm.bio}
                onChange={(e) =>
                  setEditForm({ ...editForm, bio: e.target.value })
                }
                variant="outlined"
                size="small"
                placeholder="Tell us about yourself"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    "&:hover fieldset": {
                      borderColor: "#000",
                    },
                  },
                }}
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions className="p-6 pt-0">
          <div className="flex justify-end gap-3 w-full">
            <button
              onClick={() => setShowEditProfileDialog(false)}
              className="px-4 py-2 rounded-full text-sm font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleEditProfile}
              className="px-4 py-2 rounded-full text-sm font-semibold bg-black text-white hover:bg-gray-800 transition-colors duration-200"
            >
              Save Changes
            </button>
          </div>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showSignOutDialog}
        onClose={() => setShowSignOutDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            maxHeight: "80vh",
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
          },
        }}
      >
        <DialogTitle className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Sign Out</h2>
            <button
              onClick={() => setShowSignOutDialog(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </DialogTitle>
        <DialogContent className="p-6">
          <p className="text-gray-700 mb-6">
            Are you sure you want to sign out?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowSignOutDialog(false)}
              className="px-4 py-2 rounded-full text-sm font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <SignOutButton>
              <button className="px-4 py-2 rounded-full text-sm font-semibold bg-red-500 text-white hover:bg-red-600">
                Sign Out
              </button>
            </SignOutButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
