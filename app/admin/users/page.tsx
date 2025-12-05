"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, MoreVertical, Mail, Shield, Users, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminUsersPage() {
  const router = useRouter();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    roleId: "",
    message: "",
  });

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        // Get organizations
        const orgsRes = await fetch("/api/organizations");
        if (!orgsRes.ok) throw new Error("Failed to load organizations");
        const orgsData = await orgsRes.json();
        
        if (orgsData.organizations && orgsData.organizations.length > 0) {
          const primaryOrg = orgsData.organizations[0];
          setOrganizationId(primaryOrg.id);

          // Load roles
          const rolesRes = await fetch(`/api/organizations/${primaryOrg.id}/roles`);
          if (rolesRes.ok) {
            const rolesData = await rolesRes.json();
            setRoles(rolesData.roles || []);
          }

          // Load users
          const usersRes = await fetch(
            `/api/users?organizationId=${primaryOrg.id}&status=${statusFilter}&userType=${userTypeFilter}&search=${searchTerm}`
          );
          if (!usersRes.ok) throw new Error("Failed to load users");
          const usersData = await usersRes.json();
          setUsers(usersData.users || []);
        }
      } catch (err: any) {
        console.error("Failed to load data:", err);
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, statusFilter, userTypeFilter, searchTerm]);

  const handleInvite = async () => {
    if (!organizationId || !inviteForm.email || !inviteForm.roleId) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const res = await fetch("/api/invitations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          roleId: inviteForm.roleId,
          email: inviteForm.email,
          message: inviteForm.message || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send invitation");
      }

      toast.success("Invitation sent successfully!");
      setInviteDialogOpen(false);
      setInviteForm({ email: "", roleId: "", message: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to send invitation");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      super_admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      alumni: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      student: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    };
    return styles[role as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    pending: users.filter((u) => u.status === "pending").length,
    suspended: users.filter((u) => u.status === "suspended").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all alumni and user accounts</p>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Invite User</DialogTitle>
              <DialogDescription>
                Send an invitation to join the organization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={inviteForm.email}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, email: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={inviteForm.roleId}
                  onValueChange={(value) =>
                    setInviteForm({ ...inviteForm, roleId: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles
                      .filter((r) => r.name !== "super_admin")
                      .map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.display_name || role.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="message">Message (Optional)</Label>
                <Input
                  id="message"
                  placeholder="Personal message..."
                  value={inviteForm.message}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, message: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <Button onClick={handleInvite} className="w-full">
                Send Invitation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              </div>
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.active}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Active Users</p>
              </div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.pending}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Pending</p>
              </div>
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.suspended}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Suspended</p>
              </div>
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Search and manage user accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users by name or email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                value={userTypeFilter}
                onChange={(e) => setUserTypeFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="alumni">Alumni</option>
                <option value="student">Student</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="hidden sm:table-cell">Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Batch</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No users found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {searchTerm
                          ? `No users matching "${searchTerm}"`
                          : "No users available"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>
                              {user.name
                                ?.split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {user.name || "Unknown"}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge className={getRoleBadge(user.role)}>
                          {user.roleDisplay || user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-gray-900 dark:text-white">
                        {user.batch || "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/users/${user.id}`)}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
