"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, Send, Plus, MoreVertical, Phone, Video,
  Loader2, MessageCircle, CheckCheck, Clock, X, Users, ArrowLeft
} from "lucide-react";
import { useAuthProfile } from "@/context/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sessionGet, sessionSet } from "@/lib/cache";

// ─── Skeletons ────────────────────────────────────────────────────────────────
function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl">
      <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-3/4 rounded-lg" />
        <Skeleton className="h-3 w-1/2 rounded-lg" />
      </div>
      <Skeleton className="h-3 w-8 rounded-lg" />
    </div>
  );
}

function MessageSkeleton({ isMe }: { isMe: boolean }) {
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <Skeleton className={`h-10 rounded-2xl ${isMe ? "w-48" : "w-56"}`} />
    </div>
  );
}

// ─── New Conversation Modal ───────────────────────────────────────────────────
function NewConversationModal({
  orgId, onClose, onCreated
}: { orgId: string; onClose: () => void; onCreated: (conv: any) => void }) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);

  const searchUsers = useCallback(async (q: string) => {
    if (!q.trim()) { setUsers([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/network?organizationId=${orgId}&query=${q}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.network || []);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, [orgId]);

  useEffect(() => {
    const t = setTimeout(() => searchUsers(search), 300);
    return () => clearTimeout(t);
  }, [search, searchUsers]);

  const startChat = async (userId: string) => {
    setCreating(userId);
    try {
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantIds: [userId] }),
      });
      if (res.ok) {
        const data = await res.json();
        onCreated(data.conversation);
        onClose();
      } else {
        toast.error("Could not start conversation");
      }
    } catch {
      toast.error("Failed to create conversation");
    } finally {
      setCreating(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">New Message</h3>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <Input
              placeholder="Search members..."
              className="pl-9 h-10 rounded-xl border-slate-200 text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {loading && <div className="py-4 text-center"><Loader2 className="h-5 w-5 animate-spin text-slate-300 mx-auto" /></div>}
            {!loading && users.map(u => (
              <button
                key={u.id}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
                onClick={() => startChat(u.id)}
                disabled={!!creating}
              >
                <Avatar className="h-9 w-9 rounded-xl shrink-0">
                  <AvatarImage src={u.avatar} />
                  <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-sm">{u.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{u.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{u.userType.replace('_', ' ')}</p>
                </div>
                {creating === u.id && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
              </button>
            ))}
            {!loading && search && users.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-400">No members found</p>
            )}
            {!search && (
              <p className="py-6 text-center text-sm text-slate-300">Type to search members</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function MessagesPageContent() {
  const searchParams = useSearchParams();
  const { profile, organization, loading: profileLoading } = useAuthProfile();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const targetUserId = searchParams.get("userId");
  const orgId = profile?.organizationId || "";

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // ── Fetch conversations with session cache ──────────────────────────────────
  const fetchConversations = useCallback(async (silent = false) => {
    if (!silent) {
      const cached = sessionGet<any[]>("conversations");
      if (cached) { setConversations(cached); setLoading(false); return; }
      setLoading(true);
    }
    try {
      const res = await fetch("/api/messages/conversations", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const convs = data.conversations || [];
        setConversations(convs);
        if (!silent) sessionSet("conversations", convs, 60 * 1000); // 1-min cache
        // Auto-select from URL param or first conversation
        if (convs.length > 0) {
          const linked = targetUserId
            ? convs.find((c: any) => c.otherParticipants?.some((p: any) => p.id === targetUserId))
            : null;
          if (linked || !activeConv) setActiveConv(linked || convs[0]);
        }
      }
    } catch {
      if (!silent) toast.error("Failed to load conversations");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [targetUserId, activeConv]);

  // ── Fetch messages with cache ───────────────────────────────────────────────
  const fetchMessages = useCallback(async (convId: string, silent = false) => {
    if (!silent) {
      const cached = sessionGet<any[]>(`msgs_${convId}`);
      if (cached) { setMessages(cached); return; }
      setMsgLoading(true);
    }
    try {
      const res = await fetch(`/api/messages/${convId}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const msgs = data.messages || [];
        setMessages(msgs);
        sessionSet(`msgs_${convId}`, msgs, 30 * 1000); // 30s cache
      }
    } catch {
      if (!silent) toast.error("Failed to load messages");
    } finally {
      setMsgLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile) fetchConversations();
  }, [profile]);

  useEffect(() => {
    if (!activeConv) return;
    fetchMessages(activeConv.id);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => fetchMessages(activeConv.id, true), 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeConv?.id]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !activeConv || sending) return;
    const optimisticMsg = {
      id: `tmp-${Date.now()}`, content: newMessage, senderId: profile?.id,
      createdAt: new Date().toISOString(), isOptimistic: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage("");
    setSending(true);
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: activeConv.id, content: newMessage }),
      });
      if (res.ok) {
        const { message } = await res.json();
        setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? message : m));
        sessionSet(`msgs_${activeConv.id}`, messages, 30 * 1000);
        fetchConversations(true);
      } else {
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        toast.error("Failed to send message");
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const filteredConvs = conversations.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const otherParticipant = activeConv?.otherParticipants?.[0];

  if (profileLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
        <div className="w-80 border-r border-slate-100 bg-white p-4 space-y-3">
          <Skeleton className="h-9 w-full rounded-xl" />
          {Array(6).fill(0).map((_, i) => <ConversationSkeleton key={i} />)}
        </div>
        <div className="flex-1 p-6 space-y-4">
          {Array(5).fill(0).map((_, i) => <MessageSkeleton key={i} isMe={i % 2 === 0} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm animate-in fade-in duration-300">
      {showNewModal && (
        <NewConversationModal
          orgId={orgId}
          onClose={() => setShowNewModal(false)}
          onCreated={(conv) => {
            setConversations(prev => [conv, ...prev.filter(c => c.id !== conv.id)]);
            setActiveConv(conv);
            setShowSidebar(false);
          }}
        />
      )}

      {/* Sidebar */}
      <div className={`${showSidebar ? "flex" : "hidden"} sm:flex flex-col w-full sm:w-72 border-r border-slate-100 shrink-0`}>
        {/* Sidebar header */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Messages</h2>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100"
              onClick={() => setShowNewModal(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
            <Input
              placeholder="Search..."
              className="pl-9 h-9 rounded-xl border-slate-200 bg-slate-50 text-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Conversation list */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-3 space-y-1">
              {Array(6).fill(0).map((_, i) => <ConversationSkeleton key={i} />)}
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="py-16 text-center space-y-3 px-4">
              <MessageCircle className="h-8 w-8 text-slate-100 mx-auto" />
              <p className="text-sm text-slate-400">
                {searchQuery ? "No results" : "No conversations yet"}
              </p>
              {!searchQuery && (
                <Button
                  size="sm"
                  className="h-8 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                  onClick={() => setShowNewModal(true)}
                >
                  Start a conversation
                </Button>
              )}
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              {filteredConvs.map(conv => {
                const other = conv.otherParticipants?.[0];
                const isActive = activeConv?.id === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => { setActiveConv(conv); setShowSidebar(false); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                      isActive ? "bg-blue-50 text-blue-600" : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-10 w-10 rounded-xl">
                        <AvatarImage src={other?.avatar || other?.avatarUrl} className="object-cover" />
                        <AvatarFallback className={`font-bold text-sm ${isActive ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                          {conv.name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className={`text-sm font-semibold truncate ${isActive ? "text-blue-700" : "text-slate-900"}`}>
                          {conv.name || other?.fullName || "Conversation"}
                        </p>
                        <span className="text-[10px] text-slate-300 font-medium ml-1 shrink-0">
                          {conv.updatedAt ? formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: false }) : ""}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {conv.lastMessage?.content || "No messages yet"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat panel */}
      {activeConv ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost" size="icon"
                className="sm:hidden h-8 w-8 rounded-xl"
                onClick={() => setShowSidebar(true)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-9 w-9 rounded-xl shrink-0">
                <AvatarImage src={otherParticipant?.avatar} />
                <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-sm">{activeConv.name?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-bold text-slate-900">{activeConv.name || otherParticipant?.fullName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-emerald-600 font-medium">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-400 hover:text-blue-600">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-400 hover:text-blue-600">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-400 hover:text-slate-700">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-5 py-4">
            {msgLoading ? (
              <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => <MessageSkeleton key={i} isMe={i % 2 === 0} />)}
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-3">
                <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                  <MessageCircle className="h-6 w-6 text-slate-200" />
                </div>
                <p className="text-sm text-slate-400">No messages yet. Say hello!</p>
              </div>
            ) : (
              <div className="space-y-3 pb-2">
                {messages.map((msg) => {
                  const isMe = msg.senderId === profile?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} ${msg.isOptimistic ? "opacity-70" : ""}`}>
                      <div className={`max-w-[70%] space-y-1 ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                        <div className={`px-4 py-2.5 text-sm leading-relaxed rounded-2xl ${
                          isMe
                            ? "bg-blue-600 text-white rounded-tr-sm"
                            : "bg-slate-100 text-slate-800 rounded-tl-sm"
                        }`}>
                          {msg.content}
                        </div>
                        <div className="flex items-center gap-1.5 px-1">
                          <span className="text-[10px] text-slate-300">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {isMe && <CheckCheck className="h-3 w-3 text-blue-400" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-slate-100">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <Input
                placeholder="Type a message..."
                className="flex-1 h-10 rounded-xl border-slate-200 bg-slate-50 text-sm focus-visible:ring-blue-500/20"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                disabled={sending}
              />
              <Button
                type="submit"
                size="icon"
                disabled={sending || !newMessage.trim()}
                className="h-10 w-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-sm"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden sm:flex flex-col items-center justify-center text-center p-8 space-y-4">
          <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
            <MessageCircle className="h-8 w-8 text-slate-200" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-800">Select a conversation</p>
            <p className="text-sm text-slate-400 mt-1">Or start a new one to connect with members</p>
          </div>
          <Button
            size="sm"
            className="h-9 rounded-xl bg-blue-600 text-white font-semibold px-5"
            onClick={() => setShowNewModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" /> New Message
          </Button>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <Suspense fallback={
        <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="w-72 border-r border-slate-100 p-4 space-y-3">
            <Skeleton className="h-9 w-full rounded-xl" />
            {Array(6).fill(0).map((_, i) => <ConversationSkeleton key={i} />)}
          </div>
        </div>
      }>
        <MessagesPageContent />
      </Suspense>
    </div>
  );
}