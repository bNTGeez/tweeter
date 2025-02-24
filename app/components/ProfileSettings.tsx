"use client"
import React from 'react'
import { useState } from 'react'
import { useUser } from '@clerk/nextjs'

const ProfileSettings = () => {

  const { user } = useUser();
  const [username, setUsername] = useState(user?.fullName || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  const handleUpdateUsername = async () => {
    if(!user) return;

    try {
      setIsUpdating(true);
      setError("");

      if(username.length < 3){
        setError("Username must be at least 3 characters long");
        return;
      }

      await user.update({
        username: username,
      });

      alert("Username updated successfully");
    } catch (error) { 
      setError("Failed to update username");
    }
    setIsUpdating(false);
    
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2"> Username </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="Enter username"
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
      onClick={handleUpdateUsername}
        disabled={isUpdating}
        className="w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
      >
        {isUpdating ? "Updating..." : "Update Username"}
      </button>
    </div>
  )
}

export default ProfileSettings
