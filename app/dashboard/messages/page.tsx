"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, MessageCircle, MoreVertical, UserPlus } from "lucide-react";

export default function MessagesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeConversation, setActiveConversation] = useState("1");

  const conversations = [
    {
      id: "1",
      participant: {
        id: "2",
        name: "Sarah Chen",
        role: "Engineering Manager at TechCorp",
        image: "/avatars/sarah-chen.jpg",
        online: true
      },
      lastMessage: "I'll send the job description over. What's your email?",
      timestamp: "10:42 AM",
      unread: 1,
      lastActive: "2 mins ago"
    },
    {
      id: "2",
      participant: {
        id: "3",
        name: "Mike Rodriguez",
        role: "Product Director",
        image: "/avatars/mike-rodriguez.jpg",
        online: false
      },
      lastMessage: "Looking forward to the alumni meetup next week!",
      timestamp: "Yesterday",
      unread: 0,
      lastActive: "5 hours ago"
    },
    {
      id: "3",
      participant: {
        id: "4",
        name: "Emily Davis",
        role: "Senior UX Designer",
        image: "/avatars/emily-davis.jpg",
        online: true
      },
      lastMessage: "Thanks for connecting! Let's schedule a call.",
      timestamp: "Jan 12",
      unread: 0,
      lastActive: "30 mins ago"
    },
    {
      id: "4",
      participant: {
        id: "5",
        name: "David Wilson",
        role: "Startup Founder",
        image: "/avatars/david-wilson.jpg",
        online: false
      },
      lastMessage: "The mentorship program sounds interesting.",
      timestamp: "Jan 10",
      unread: 0,
      lastActive: "2 days ago"
    }
  ];

  const filteredConversations = conversations.filter(conv =>
    conv.participant.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex">
      {/* Conversations List */}
      <div className="w-full md:w-96 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
            <Button variant="ghost" size="icon">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/dashboard/messages/${conversation.id}`}
            >
              <Card
                className={`border-0 rounded-none border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-colors ${
                  activeConversation === conversation.id
                    ? "bg-gray-50 dark:bg-gray-800"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conversation.participant.image} />
                        <AvatarFallback>
                          {conversation.participant.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.participant.online && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {conversation.participant.name}
                        </h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {conversation.timestamp}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-1">
                        {conversation.lastMessage}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {conversation.lastActive}
                        </span>
                        {conversation.unread > 0 && (
                          <Badge className="bg-indigo-600 text-white text-xs">
                            {conversation.unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {filteredConversations.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center p-8">
              <MessageCircle className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No conversations found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm ? `No conversations matching "${searchTerm}"` : "Start a conversation with fellow alumni"}
              </p>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <UserPlus className="h-4 w-4 mr-2" />
                New Message
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Message Content Area */}
      <div className="flex-1 hidden md:flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Select a conversation
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Choose a conversation from the list to start messaging or start a new conversation with alumni.
          </p>
        </div>
      </div>
    </div>
  );
}