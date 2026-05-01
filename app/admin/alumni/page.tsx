"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Search, Download, RefreshCw, Mail, User, Filter, MoreHorizontal,
  UserCheck, UserX, GraduationCap, Briefcase, ChevronDown
} from "lucide-react";
import { Input as SearchInput } from "@/components/ui/input";
import { useAuthProfile } from "@/context/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

function TableSkeleton() {
  return (
    <div className="divide-y divide-slate-50">
      {Array(6).fill(0).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-36 rounded-lg" />
            <Skeleton className="h-3 w-48 rounded-lg" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export default function AdminAlumniPage() {
  const { profile } = useAuthProfile();
  const [searchTerm, setSearchTerm] = useState("");
  const [alumni, setAlumni] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<"all" | "alumni" | "student">("all");

  const orgId = (profile as any)?.organizationId;

  const loadAlumni = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const role = roleFilter === "all" ? "" : `&role=${roleFilter}`;
      const res = await fetch(`/api/users?organizationId=${orgId}${role}&search=${searchTerm}`, {
        cache: "no-store"
      });
      if (res.ok) {
        const data = await res.json();
        setAlumni(data.users || []);
      }
    } catch {
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  }, [orgId, searchTerm, roleFilter]);

  useEffect(() => {
    const t = setTimeout(() => { if (orgId) loadAlumni(); }, 300);
    return () => clearTimeout(t);
  }, [orgId, searchTerm, roleFilter, loadAlumni]);

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    setActionLoading(userId);
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setAlumni(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
        toast.success(`User ${newStatus === "active" ? "activated" : "suspended"}`);
      }
    } catch { toast.error("Failed to update user status"); }
    finally { setActionLoading(null); }
  };

  const exportCSV = () => {
    const headers = ["Name", "Email", "Role", "Graduation Year", "Status", "Joined"];
    const rows = alumni.map(u => [
      u.fullName || u.name, u.email, u.userType, u.graduationYear || u.expectedGraduation || "",
      u.status || "active", u.createdAt ? format(new Date(u.createdAt), "MMM d, yyyy") : ""
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "members.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const alumniCount = alumni.filter(u => u.userType === "alumni").length;
  const studentCount = alumni.filter(u => u.userType === "student").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Members</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage all members of your institution.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={loadAlumni} disabled={loading}
            className="h-9 rounded-xl bg-slate-50 hover:bg-slate-100">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button size="sm" onClick={exportCSV}
            className="h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Members", value: alumni.length, icon: User, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Alumni", value: alumniCount, icon: Briefcase, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Students", value: studentCount, icon: GraduationCap, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`${s.bg} p-2.5 rounded-xl`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{loading ? "—" : s.value}</p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <Input
              placeholder="Search by name or email..."
              className="pl-9 h-9 rounded-xl border-slate-200 text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {(["all", "alumni", "student"] as const).map(r => (
              <Button key={r} size="sm" variant={roleFilter === r ? "default" : "ghost"}
                className={`h-9 rounded-xl px-4 text-xs font-semibold capitalize ${
                  roleFilter === r ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
                onClick={() => setRoleFilter(r)}>
                {r === "all" ? "All Members" : r === "alumni" ? "Alumni" : "Students"}
              </Button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton />
          ) : alumni.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto border border-slate-100">
                <User className="h-6 w-6 text-slate-200" />
              </div>
              <p className="text-sm font-semibold text-slate-400">No members found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 bg-slate-50/50">
                  <TableHead className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Member</TableHead>
                  <TableHead className="py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</TableHead>
                  <TableHead className="py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Batch</TableHead>
                  <TableHead className="py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</TableHead>
                  <TableHead className="py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Joined</TableHead>
                  <TableHead className="px-5 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alumni.map(person => (
                  <TableRow key={person.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <TableCell className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 rounded-xl shrink-0 border border-slate-100">
                          <AvatarImage src={person.imageUrl || person.avatarUrl} />
                          <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-xs">
                            {(person.fullName || person.name)?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{person.fullName || person.name}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3" /> {person.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] font-semibold rounded-lg border-none capitalize ${
                        person.userType === "alumni" ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                      }`}>
                        {person.userType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600 font-medium">
                        {person.graduationYear || person.expectedGraduation || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] font-semibold rounded-lg border-none ${
                        person.status === "suspended"
                          ? "bg-rose-50 text-rose-600"
                          : "bg-emerald-50 text-emerald-600"
                      }`}>
                        {person.status === "suspended" ? "Suspended" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-400 font-medium">
                        {person.createdAt ? format(new Date(person.createdAt), "MMM d, yyyy") : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 text-right">
                      <Button
                        variant="ghost" size="sm"
                        className={`h-8 rounded-xl text-xs font-semibold ${
                          person.status === "suspended"
                            ? "text-emerald-600 hover:bg-emerald-50"
                            : "text-rose-600 hover:bg-rose-50"
                        }`}
                        onClick={() => handleStatusToggle(person.id, person.status || "active")}
                        disabled={actionLoading === person.id}
                      >
                        {actionLoading === person.id ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : person.status === "suspended" ? (
                          <><UserCheck className="h-3.5 w-3.5 mr-1" /> Activate</>
                        ) : (
                          <><UserX className="h-3.5 w-3.5 mr-1" /> Suspend</>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Footer */}
        {!loading && alumni.length > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
            <p className="text-xs text-slate-400 font-medium">{alumni.length} members total</p>
          </div>
        )}
      </div>
    </div>
  );
}
