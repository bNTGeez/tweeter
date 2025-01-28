"use client";
import Sidebar from "@/app/components/Sidebar";
import Tweet from "@/app/components/Tweet";

function UserContent() {
  return (
    <div className="flex flex-col p-8 h-screen bg-slate-100">
      <span className="text-3xl font-bold text-slate-800 mb-8">Tweets</span>
      <div className="space-y-4">
        <Tweet 
          tweet="Hello, world!" 
          username="John Doe" 
          createdAt="2021-01-01" 
        />
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen">
      <div>
        <Sidebar />
      </div>
      <main className="flex-1">
        <UserContent />
      </main>
    </div>
  );
}
