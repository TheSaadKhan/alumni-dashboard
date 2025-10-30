"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MoreVertical, Paperclip, Send, Smile } from "lucide-react";

export default function MessagesPage() {
  const params = useParams();
  const router = useRouter();
  const [newMessage, setNewMessage] = useState("");

  // Mock conversation data
  const conversation = {
    id: params.conversationId,
    participant: {
      id: "2",
      name: "Sarah Chen",
      role: "Engineering Manager at TechCorp",
      batch: "2015",
      image: "/avatars/sarah-chen.jpg",
      online: true
    },
    messages: [
      {
        id: "1",
        sender: "2",
        content: "Hi Alex! I saw your profile and noticed you're working with React and Node.js.",
        timestamp: "2024-01-15T10:30:00Z",
        read: true
      },
      {
        id: "2",
        sender: "1",
        content: "Hello Sarah! Yes, I've been working with the MERN stack for about 3 years now.",
        timestamp: "2024-01-15T10:32:00Z",
        read: true
      },
      {
        id: "3",
        sender: "2",
        content: "That's great! We're looking for senior developers at TechCorp. Would you be interested in exploring opportunities?",
        timestamp: "2024-01-15T10:35:00Z",
        read: true
      },
      {
        id: "4",
        sender: "1",
        content: "I'd love to learn more about the role. Could you share the job description?",
        timestamp: "2024-01-15T10:40:00Z",
        read: true
      },
      {
        id: "5",
        sender: "2",
        content: "Absolutely! I'll send it over. What's the best email to reach you at?",
        timestamp: "2024-01-15T10:42:00Z",
        read: false
      }
    ]
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // In real app, send message via API
    console.log("Sending message:", newMessage);
    setNewMessage("");
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <Card className="border-b-0 rounded-b-none">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/messages")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-10 w-10">
                <AvatarImage src={conversation.participant.image} />
                <AvatarFallback>
                  {conversation.participant.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {conversation.participant.name}
                  </h2>
                  {conversation.participant.online && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs">
                      Online
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {conversation.participant.role}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="flex-1 border-t-0 rounded-t-none border-b-0 rounded-b-none overflow-hidden">
        <CardContent className="p-4 h-full overflow-y-auto">
          <div className="space-y-4">
            {conversation.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "1" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    message.sender === "1"
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <div className={`text-xs mt-1 ${
                    message.sender === "1" ? "text-indigo-200" : "text-gray-500"
                  }`}>
                    {formatTime(message.timestamp)}
                    {message.sender === "1" && (
                      <span className="ml-2">
                        {message.read ? "Read" : "Delivered"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Message Input */}
      <Card className="border-t-0 rounded-t-none">
        <CardContent className="p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Button type="button" variant="ghost" size="icon">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon">
              <Smile className="h-4 w-4" />
            </Button>
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}