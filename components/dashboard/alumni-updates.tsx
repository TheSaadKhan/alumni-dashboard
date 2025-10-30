"use client";

import { useState } from "react";
import { ChevronRight, Filter, MoreHorizontal, Star, MessageCircle, Bookmark, Share2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const alumniUpdates = [
  {
    id: 1,
    user: "Alice N.",
    role: "Software Engineer '18",
    time: "2 hours ago",
    text: "Excited to announce my promotion to Senior Software Engineer at TechCorp! Looking forward to mentoring junior developers in our alumni network.",
    likes: 12,
    comments: 5,
    liked: false,
    saved: false,
    avatar: "/avatars/alice.jpg",
  },
  {
    id: 2,
    user: "Bob M.",
    role: "Architect '15",
    time: "1 day ago",
    text: "Just wrapped up a fantastic project in sustainable architecture. The building achieved LEED Platinum certification!",
    likes: 28,
    comments: 11,
    liked: true,
    saved: false,
    avatar: "/avatars/bob.jpg",
  },
];

export function AlumniUpdates() {
  const [activeUpdates, setActiveUpdates] = useState(alumniUpdates);

  const handleLike = (id: number) => {
    setActiveUpdates(updates =>
      updates.map(update =>
        update.id === id
          ? {
              ...update,
              likes: update.liked ? update.likes - 1 : update.likes + 1,
              liked: !update.liked,
            }
          : update
      )
    );
  };

  const handleSave = (id: number) => {
    setActiveUpdates(updates =>
      updates.map(update =>
        update.id === id
          ? { ...update, saved: !update.saved }
          : update
      )
    );
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-gray-900 dark:text-white">Alumni Updates</CardTitle>
          <CardDescription>Latest from your network</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            View All
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeUpdates.map((update) => (
          <div 
            key={update.id} 
            className="p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 hover:shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-10 w-10 border-2 border-indigo-200 dark:border-indigo-800">
                <AvatarImage src={update.avatar} />
                <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                  {update.user.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{update.user}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{update.role} • {update.time}</p>
              </div>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{update.text}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <button 
                  className={`flex items-center gap-1 transition-colors ${
                    update.liked ? "text-red-500" : "hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                  onClick={() => handleLike(update.id)}
                >
                  <Star className={`h-4 w-4 ${update.liked ? "fill-current" : ""}`} />
                  {update.likes}
                </button>
                <button className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
                  <MessageCircle className="h-4 w-4" />
                  {update.comments}
                </button>
                <button 
                  className={`flex items-center gap-1 transition-colors ${
                    update.saved ? "text-indigo-500" : "hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                  onClick={() => handleSave(update.id)}
                >
                  <Bookmark className={`h-4 w-4 ${update.saved ? "fill-current" : ""}`} />
                  Save
                </button>
              </div>
              <Button variant="ghost" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}