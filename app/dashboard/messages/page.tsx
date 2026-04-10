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
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Send, 
  Plus, 
  MoreVertical, 
  Phone, 
  Video, 
  Info, 
  User, 
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
        setConversations(data.conversations || []);
        if (data.conversations?.length > 0 && !activeConversation) {
          const linkedConversation = targetUserId
            ? data.conversations.find((conv: any) =>
                conv.otherParticipants?.some((p: any) => p.id === targetUserId)
              )
            : null;
          setActiveConversation(linkedConversation || data.conversations[0]);
        }
      }
    } catch (err) {
      if (!isSilent) toast.error("Failed to synchronize conversation nodes");
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
      if (!isSilent) toast.error("Failed to synchronize message stream");
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
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: activeConversation.id, content: newMessage })
      });
      if (res.ok) {
        const { message } = await res.json();
        setMessages(prev => [...prev, message]);
        setNewMessage("");
        fetchConversations(true);
      }
    } catch (err) {
      toast.error("Failed to transmit message node");
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

  const otherParticipant = activeConversation?.otherParticipants?.[0];

  return (
    <div className="container py-8 max-w-7xl mx-auto px-6 h-[calc(100vh-6rem)] animate-in fade-in duration-700 flex gap-8">
      {/* Relay Sidebar */}
      <Card className="w-80 lg:w-96 flex flex-col border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shrink-0 overflow-hidden">
        <CardHeader className="p-8 pb-4 space-y-6">
           <div className="flex justify-between items-center">
              <div>
                 <h2 className="text-xl font-bold italic uppercase tracking-tighter">Relay Core</h2>
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mt-1 italic">Personal Comms</p>
              </div>
              <Button size="icon" className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 shadow-none border-none">
                 <Plus className="h-4.5 w-4.5" />
              </Button>
           </div>
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
              <Input 
                placeholder="Search identifier..." 
                className="h-11 pl-11 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-[10px] font-black uppercase tracking-widest"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
        </CardHeader>
        <ScrollArea className="flex-1 px-4 py-2">
           <div className="space-y-1">
              {filteredConversations.map((conv) => {
                 const other = conv.otherParticipants?.[0];
                 const isActive = activeConversation?.id === conv.id;
                 return (
                    <div
                       key={conv.id}
                       onClick={() => setActiveConversation(conv)}
                       className={`flex items-center gap-4 p-4 rounded-3xl cursor-pointer transition-all duration-300 group border border-transparent ${
                         isActive 
                           ? "bg-white shadow-xl shadow-slate-200/50 dark:bg-slate-800 dark:shadow-none border-slate-50" 
                           : "hover:bg-white/50 dark:hover:bg-slate-800/50 text-slate-500"
                       }`}
                    >
                       <Avatar className="h-12 w-12 rounded-2xl border-2 border-white dark:border-slate-800 shadow-sm">
                          <AvatarImage src={other?.avatar} className="object-cover" />
                          <AvatarFallback className="bg-slate-900 text-white font-black text-xs">{other?.name?.[0]}</AvatarFallback>
                       </Avatar>
                       <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                             <p className={`text-sm font-bold truncate uppercase italic ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>{conv.name}</p>
                             <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                {conv.updatedAt ? formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: false }).replace('about ', '') : ''}
                             </span>
                          </div>
                          <p className="text-[10px] font-medium text-slate-400 truncate tracking-tight">{conv.lastMessage?.content || "No data exchange."}</p>
                       </div>
                    </div>
                 );
              })}
           </div>
        </ScrollArea>
      </Card>

      {/* Interface Engine */}
      {activeConversation ? (
        <Card className="flex-1 flex flex-col border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden relative">
           <CardHeader className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex flex-row items-center justify-between bg-white/40 dark:bg-slate-950/20">
              <div className="flex items-center gap-4">
                 <Avatar className="h-12 w-12 rounded-2xl border-2 border-white shadow-sm">
                    <AvatarImage src={otherParticipant?.avatar} />
                    <AvatarFallback className="bg-blue-600 text-white font-black">{otherParticipant?.name?.[0]}</AvatarFallback>
                 </Avatar>
                 <div>
                    <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white uppercase italic">{activeConversation.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                       <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                       <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] italic">Active Link</span>
                    </div>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:text-blue-500"><Phone className="h-4.5 w-4.5" /></Button>
                 <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:text-blue-500"><Video className="h-4.5 w-4.5" /></Button>
                 <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:text-blue-500"><MoreVertical className="h-4.5 w-4.5" /></Button>
              </div>
           </CardHeader>
           <ScrollArea className="flex-1 p-8">
              <div className="space-y-6">
                 {messages.map((msg, idx) => {
                    const isMe = msg.senderId === profile?.id;
                    return (
                       <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                          <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                             <div className={`px-6 py-4 text-xs font-bold leading-relaxed shadow-sm ${
                               isMe 
                                 ? "bg-indigo-600 text-white rounded-3xl rounded-tr-sm" 
                                 : "bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-3xl rounded-tl-sm"
                             }`}>
                                {msg.content}
                             </div>
                             <div className="flex items-center gap-2 mt-2 px-1">
                                <Clock className="h-3 w-3 text-slate-300" />
                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest italic">
                                   {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isMe && <CheckCheck className="h-3 w-3 text-blue-500" />}
                             </div>
                          </div>
                       </div>
                    );
                 })}
                 <div ref={messagesEndRef} />
              </div>
           </ScrollArea>
           <div className="p-8 pt-0 bg-transparent">
              <form onSubmit={handleSendMessage} className="flex gap-4 items-center bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 rounded-3xl p-2 pl-6 shadow-xl shadow-slate-200/50">
                 <Input 
                   placeholder="Transmit data node..." 
                   className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 text-[11px] font-black uppercase tracking-widest placeholder:text-slate-300"
                   value={newMessage}
                   onChange={(e) => setNewMessage(e.target.value)}
                   disabled={sending}
                 />
                 <Button type="submit" disabled={sending || !newMessage.trim()} className="h-12 w-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 p-0 text-white shrink-0">
                    {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-1" />}
                 </Button>
              </form>
           </div>
        </Card>
      ) : (
        <Card className="flex-1 flex flex-col items-center justify-center border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl shrink-0">
           <div className="text-center space-y-6 max-w-sm px-8">
              <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <MessageCircle className="h-8 w-8 text-slate-200" />
              </div>
              <div>
                 <h4 className="text-xl font-bold italic uppercase tracking-tighter">Encrypted Interface</h4>
                 <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-loose mt-2">Initialize a secure peer-to-peer data exchange by selecting a network node from the relay core.</p>
              </div>
              <Button className="h-12 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl font-bold uppercase tracking-widest text-[10px]">
                 Start New Interaction
              </Button>
           </div>
        </Card>
      )}
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