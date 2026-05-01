"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search, Send, Plus, MoreVertical, Phone, Video,
  Loader2, MessageCircle, CheckCheck, ArrowLeft, X, Mail
} from "lucide-react";
import { useAuthProfile } from "@/context/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { sessionGet, sessionSet } from "@/lib/cache";

function ConvSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl">
      <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-2/3 rounded-lg" />
        <Skeleton className="h-3 w-1/2 rounded-lg" />
      </div>
    </div>
  );
}

function NewConversationModal({ orgId, onClose, onCreated }: {
  orgId: string; onClose: () => void; onCreated: (conv: any) => void;
}) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);

  const searchUsers = useCallback(async (q: string) => {
    if (!q.trim()) { setUsers([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/users?organizationId=${orgId}&search=${encodeURIComponent(q)}&limit=10`);
      if (res.ok) setUsers((await res.json()).users || []);
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
      if (res.ok) { onCreated((await res.json()).conversation); onClose(); }
      else toast.error("Could not start conversation");
    } catch { toast.error("Failed to create conversation"); }
    finally { setCreating(null); }
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
            <Input placeholder="Search members by name..." className="pl-9 h-10 rounded-xl border-slate-200 text-sm"
              value={search} onChange={e => setSearch(e.target.value)} autoFocus />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-0.5">
            {loading && <div className="py-4 text-center"><Loader2 className="h-5 w-5 animate-spin text-slate-300 mx-auto" /></div>}
            {!loading && users.map(u => (
              <button key={u.id}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
                onClick={() => startChat(u.id)} disabled={!!creating}>
                <Avatar className="h-9 w-9 rounded-xl shrink-0">
                  <AvatarImage src={u.avatarUrl} />
                  <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-sm">{u.fullName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{u.fullName}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Mail className="h-3 w-3" />{u.email}
                  </p>
                </div>
                <Badge className={`text-[10px] font-semibold rounded-lg border-none capitalize ${
                  u.userType === "alumni" ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                }`}>{u.userType}</Badge>
                {creating === u.id && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
              </button>
            ))}
            {!loading && search && users.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-400">No members found for "{search}"</p>
            )}
            {!search && <p className="py-6 text-center text-sm text-slate-300">Type a name to search all members</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminMessagesContent() {
  const searchParams = useSearchParams();
  const { profile, loading: profileLoading } = useAuthProfile();
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
  const orgId = (profile as any)?.organizationId || "";

  const fetchConversations = useCallback(async (silent = false) => {
    if (!silent) {
      const cached = sessionGet<any[]>("admin_convs");
      if (cached) { setConversations(cached); setLoading(false); return; }
      setLoading(true);
    }
    try {
      const res = await fetch("/api/messages/conversations", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const convs = data.conversations || [];
        setConversations(convs);
        if (!silent) sessionSet("admin_convs", convs, 60 * 1000);
        if (convs.length > 0 && !activeConv) setActiveConv(convs[0]);
      }
    } catch { if (!silent) toast.error("Failed to load conversations"); }
    finally { if (!silent) setLoading(false); }
  }, [activeConv]);

  const fetchMessages = useCallback(async (convId: string, silent = false) => {
    if (!silent) {
      const cached = sessionGet<any[]>(`admin_msgs_${convId}`);
      if (cached) { setMessages(cached); return; }
      setMsgLoading(true);
    }
    try {
      const res = await fetch(`/api/messages/${convId}`, { cache: "no-store" });
      if (res.ok) {
        const msgs = (await res.json()).messages || [];
        setMessages(msgs);
        sessionSet(`admin_msgs_${convId}`, msgs, 30 * 1000);
      }
    } catch { } finally { setMsgLoading(false); }
  }, []);

  useEffect(() => { if (profile) fetchConversations(); }, [profile]);

  useEffect(() => {
    if (!activeConv) return;
    fetchMessages(activeConv.id);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => fetchMessages(activeConv.id, true), 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeConv?.id]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !activeConv || sending) return;
    const optimistic = { id: `tmp-${Date.now()}`, content: newMessage, senderId: profile?.id, createdAt: new Date().toISOString(), isOptimistic: true };
    setMessages(prev => [...prev, optimistic]);
    setNewMessage("");
    setSending(true);
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: activeConv.id, content: newMessage }),
      });
      if (res.ok) {
        const { message } = await res.json();
        setMessages(prev => prev.map(m => m.id === optimistic.id ? message : m));
        fetchConversations(true);
      } else {
        setMessages(prev => prev.filter(m => m.id !== optimistic.id));
        toast.error("Failed to send");
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    } finally { setSending(false); }
  };

  const filteredConvs = conversations.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const otherParticipant = activeConv?.otherParticipants?.[0];

  if (profileLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="w-72 border-r border-slate-100 p-4 space-y-3">
          <Skeleton className="h-9 w-full rounded-xl" />
          {Array(6).fill(0).map((_, i) => <ConvSkeleton key={i} />)}
        </div>
        <div className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
      {showNewModal && (
        <NewConversationModal orgId={orgId}
          onClose={() => setShowNewModal(false)}
          onCreated={conv => {
            setConversations(prev => [conv, ...prev.filter(c => c.id !== conv.id)]);
            setActiveConv(conv); setShowSidebar(false);
          }} />
      )}

      {/* Sidebar */}
      <div className={`${showSidebar ? "flex" : "hidden"} sm:flex flex-col w-full sm:w-72 border-r border-slate-100 shrink-0`}>
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Messages</h2>
            <Button size="icon" variant="ghost"
              className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100"
              onClick={() => setShowNewModal(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
            <Input placeholder="Search conversations..." className="pl-9 h-9 rounded-xl border-slate-200 bg-slate-50 text-sm"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-3 space-y-1">{Array(6).fill(0).map((_, i) => <ConvSkeleton key={i} />)}</div>
          ) : filteredConvs.length === 0 ? (
            <div className="py-16 text-center space-y-3 px-4">
              <MessageCircle className="h-8 w-8 text-slate-100 mx-auto" />
              <p className="text-sm text-slate-400">{searchQuery ? "No results" : "No conversations yet"}</p>
              {!searchQuery && (
                <Button size="sm" className="h-8 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                  onClick={() => setShowNewModal(true)}>Start a conversation</Button>
              )}
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              {filteredConvs.map(conv => {
                const other = conv.otherParticipants?.[0];
                const isActive = activeConv?.id === conv.id;
                return (
                  <button key={conv.id} onClick={() => { setActiveConv(conv); setShowSidebar(false); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                      isActive ? "bg-blue-50" : "hover:bg-slate-50"
                    }`}>
                    <div className="relative shrink-0">
                      <Avatar className="h-10 w-10 rounded-xl">
                        <AvatarImage src={other?.avatar || other?.avatarUrl} />
                        <AvatarFallback className={`font-bold text-sm ${isActive ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                          {conv.name?.[0] || "?"}
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
                        <span className="text-[10px] text-slate-300 ml-1 shrink-0">
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

      {/* Chat Panel */}
      {activeConv ? (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="sm:hidden h-8 w-8 rounded-xl"
                onClick={() => setShowSidebar(true)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-9 w-9 rounded-xl">
                <AvatarImage src={otherParticipant?.avatar} />
                <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-sm">{activeConv.name?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-bold text-slate-900">{activeConv.name || otherParticipant?.fullName}</p>
                <p className="text-[10px] text-slate-400 font-medium capitalize">
                  {otherParticipant?.userType || "Member"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-400 hover:text-blue-600"><Phone className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-400 hover:text-blue-600"><Video className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-400"><MoreVertical className="h-4 w-4" /></Button>
            </div>
          </div>

          <ScrollArea className="flex-1 px-5 py-4">
            {msgLoading ? (
              <div className="space-y-3">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className={`flex ${i % 2 ? "justify-end" : "justify-start"}`}>
                    <Skeleton className={`h-10 rounded-2xl ${i % 2 ? "w-48" : "w-56"}`} />
                  </div>
                ))}
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
                {messages.map(msg => {
                  const isMe = msg.senderId === profile?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} ${msg.isOptimistic ? "opacity-60" : ""}`}>
                      <div className={`max-w-[70%] flex flex-col ${isMe ? "items-end" : "items-start"} space-y-1`}>
                        <div className={`px-4 py-2.5 text-sm leading-relaxed rounded-2xl ${
                          isMe ? "bg-blue-600 text-white rounded-tr-sm" : "bg-slate-100 text-slate-800 rounded-tl-sm"
                        }`}>{msg.content}</div>
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

          <div className="p-4 border-t border-slate-100">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <Input placeholder="Type a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                className="flex-1 h-10 rounded-xl border-slate-200 bg-slate-50 text-sm" disabled={sending} />
              <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}
                className="h-10 w-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-sm">
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
            <p className="text-sm text-slate-400 mt-1">Or start a new one</p>
          </div>
          <Button size="sm" className="h-9 rounded-xl bg-blue-600 text-white font-semibold px-5"
            onClick={() => setShowNewModal(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Message
          </Button>
        </div>
      )}
    </div>
  );
}

export default function AdminMessagesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <Suspense fallback={
        <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="w-72 border-r border-slate-100 p-4 space-y-3">
            <Skeleton className="h-9 w-full rounded-xl" />
            {Array(5).fill(0).map((_, i) => <ConvSkeleton key={i} />)}
          </div>
        </div>
      }>
        <AdminMessagesContent />
      </Suspense>
    </div>
  );
}
