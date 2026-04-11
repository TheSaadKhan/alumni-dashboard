"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Send, 
  Plus, 
  MoreVertical, 
  Loader2, 
  MessageCircle,
  RefreshCw,
  Clock,
  CheckCheck
} from "lucide-react";
import { useAuthProfile } from "@/context/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

function MessagesPageContent() {
  const searchParams = useSearchParams();
  const { profile, loading: profileLoading } = useAuthProfile();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const targetUserId = searchParams.get("userId");

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchConversations = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await fetch("/api/messages/conversations");
      if (res.ok) {
        const data = await res.json();
        const convs = data.conversations || [];
        setConversations(convs);
        
        let targetConv = null;
        if (targetUserId) {
          targetConv = convs.find((conv: any) =>
            conv.participants?.some((p: any) => p.id === targetUserId)
          );
          
          if (!targetConv && !isSilent) {
            // Fetch target user info to create a "ghost" conversation
            try {
              const userRes = await fetch(`/api/profiles/${targetUserId}`);
              if (userRes.ok) {
                const userData = await userRes.json();
                const ghostConv = {
                  id: "new",
                  name: userData.profile.fullName,
                  otherParticipants: [{
                    id: userData.profile.id,
                    name: userData.profile.fullName,
                    avatar: userData.profile.avatarUrl
                  }],
                  participants: [{
                    id: userData.profile.id,
                    name: userData.profile.fullName,
                    avatar: userData.profile.avatarUrl
                  }],
                  isGhost: true
                };
                setActiveConversation(ghostConv);
                return;
              }
            } catch (e) {
              console.error("Failed to fetch target user for message", e);
            }
          }
        }
        
        if (!activeConversation) {
          setActiveConversation(targetConv || convs[0]);
        }
      }
    } catch (err) {
      if (!isSilent) toast.error("Failed to load conversations");
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [activeConversation, targetUserId]);

  const fetchMessages = useCallback(async (convId: string, isSilent = false) => {
    try {
      const res = await fetch(`/api/messages/${convId}`);
      if (res.ok) {
        const data = await res.json();
        if (!isSilent || data.messages?.length !== messages.length) {
          setMessages(data.messages || []);
        }
      }
    } catch (err) {
      if (!isSilent) toast.error("Failed to load messages");
    }
  }, [messages.length]);

  useEffect(() => {
    if (profile) fetchConversations();
  }, [profile, fetchConversations]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
      const interval = setInterval(() => fetchMessages(activeConversation.id, true), 10000);
      return () => clearInterval(interval);
    }
  }, [activeConversation, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !activeConversation || sending) return;

    try {
      setSending(true);
      const isNew = activeConversation.id === "new";
      const body: any = { content: newMessage };
      
      if (isNew) {
        body.receiverId = activeConversation.otherParticipants?.[0]?.id;
      } else {
        body.threadId = activeConversation.id;
      }

      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        const data = await res.json();
        const msg = data.message;
        
        if (isNew) {
          // If it was a ghost conversation, we now have a real threadId
          await fetchConversations(true);
          // The new conversation will be fetched and should be selected
        } else {
          setMessages(prev => [...prev, msg]);
        }
        setNewMessage("");
      }
    } catch (err) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (profileLoading) {
    return (
       <div className="flex h-[60vh] items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-200" />
       </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-12rem)] max-w-7xl mx-auto">
      {/* Sidebar - Conversations List */}
      <Card className="w-full md:w-80 lg:w-96 flex flex-col h-full overflow-hidden shrink-0">
        <CardHeader className="p-4 border-b">
           <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Messages</h2>
              <Button size="icon" variant="ghost" className="h-8 w-8">
                 <Plus className="h-4 w-4" />
              </Button>
           </div>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search conversations..." 
                className="pl-9 h-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
        </CardHeader>
        <ScrollArea className="flex-1">
           <div className="p-2 space-y-1">
              {filteredConversations.map((conv) => {
                 const other = conv.otherParticipants?.[0];
                 const isActive = activeConversation?.id === conv.id;
                 return (
                    <div
                       key={conv.id}
                       onClick={() => setActiveConversation(conv)}
                       className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                         isActive 
                           ? "bg-indigo-50 text-indigo-900 border" 
                           : "hover:bg-slate-50"
                       }`}
                    >
                       <Avatar className="h-10 w-10">
                          <AvatarImage src={other?.avatar} />
                          <AvatarFallback>{other?.name?.[0] || '?'}</AvatarFallback>
                       </Avatar>
                       <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                             <p className="text-sm font-semibold truncate">{conv.name}</p>
                             <span className="text-[10px] text-slate-400">
                                {conv.updatedAt ? formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: false }).replace('about ', '') : ''}
                             </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate">{conv.lastMessage?.content || "No messages yet"}</p>
                       </div>
                    </div>
                 );
              })}
              {!filteredConversations.length && !loading && (
                 <p className="text-center text-xs text-slate-400 py-8">No conversations found.</p>
              )}
           </div>
        </ScrollArea>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col h-full overflow-hidden">
        {activeConversation ? (
          <>
            <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                 <Avatar className="h-9 w-9">
                    <AvatarImage src={activeConversation.otherParticipants?.[0]?.avatar} />
                    <AvatarFallback>{activeConversation.name?.[0]}</AvatarFallback>
                 </Avatar>
                 <div>
                    <h3 className="text-sm font-bold">{activeConversation.name}</h3>
                    <div className="flex items-center gap-1">
                       <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                       <span className="text-[10px] text-emerald-600 font-medium">Online</span>
                    </div>
                 </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                 <MoreVertical className="h-4 w-4" />
              </Button>
            </CardHeader>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                 {messages.map((msg) => {
                    const isMe = msg.senderId === profile?.id;
                    return (
                       <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                             <div className={`px-4 py-2 text-sm rounded-lg ${
                               isMe 
                                 ? "bg-indigo-600 text-white rounded-tr-none shadow-sm" 
                                 : "bg-slate-100 text-slate-800 rounded-tl-none border"
                             }`}>
                                {msg.content}
                             </div>
                             <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                                <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {isMe && <CheckCheck className="h-3 w-3 text-emerald-500" />}
                             </div>
                          </div>
                       </div>
                    );
                 })}
                 <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="p-4 border-t bg-slate-50/50">
               <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input 
                    placeholder="Type a message..." 
                    className="flex-1 bg-white"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sending}
                  />
                  <Button type="submit" disabled={sending || !newMessage.trim()} className="bg-indigo-600 hover:bg-indigo-700">
                     {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
               </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
             <MessageCircle className="h-12 w-12 mb-4 opacity-20" />
             <h3 className="text-lg font-semibold text-slate-900">No active conversation</h3>
             <p className="text-sm mt-1">Select a chat from the sidebar to start messaging.</p>
             <Button className="mt-6" variant="outline">
                New Message
             </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="h-[60vh] flex items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin text-slate-200" /></div>}>
      <MessagesPageContent />
    </Suspense>
  );
}