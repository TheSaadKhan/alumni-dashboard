"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MoreVertical,
  Loader2,
  UserPlus,
  Trash,
  RefreshCcw,
  Edit,
  Shield,
} from "lucide-react";
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
  const [users, setUsers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [inviteForm, setInviteForm] = useState({
    email: "",
    roleId: "",
    message: "",
  });

  /* ✅ LOAD DATA */
  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      const orgsRes = await fetch("/api/organizations");
      const orgsData = await orgsRes.json();
      const org = orgsData.organizations?.[0];
      if (!org) return;

      setOrganizationId(org.id);

      const [usersRes, rolesRes, invitesRes] = await Promise.all([
        fetch(`/api/users?organizationId=${org.id}&search=${searchTerm}`),
        fetch(`/api/organizations/${org.id}/roles`),
        fetch(`/api/invitations?organizationId=${org.id}`),
      ]);

      if (!usersRes.ok || !rolesRes.ok || !invitesRes.ok) {
        throw new Error("Failed loading data");
      }

      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();
      const invitesData = await invitesRes.json();

      setUsers(usersData.users || []);
      setRoles(rolesData.roles || []);
      setInvites(invitesData.invites || []);
    } catch (e) {
      toast.error("Failed to load users, roles, or invites");
    } finally {
      setLoading(false);
    }
  }, [user, searchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ✅ CREATE INVITE */
  const handleInvite = async () => {
    if (!organizationId || !inviteForm.email || !inviteForm.roleId) {
      toast.error("All fields required");
      return;
    }

    setInviteLoading(true);

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

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invite failed");

      toast.success("Invitation sent");
      setInvites((prev) => [data, ...prev]); // supports new API shape
      setInviteDialogOpen(false);
      setInviteForm({ email: "", roleId: "", message: "" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  /* ✅ RESEND INVITE */
  const resendInvite = async (id: string) => {
    try {
      setProcessingId(id);
      const res = await fetch(`/api/invitations/${id}/resend`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      toast.success("Invite resent");
    } catch {
      toast.error("Resend failed");
    } finally {
      setProcessingId(null);
    }
  };

  /* ✅ DELETE INVITE */
  const deleteInvite = async (id: string) => {
    if (!confirm("Delete this invitation?")) return;

    try {
      setProcessingId(id);
      const res = await fetch(`/api/invitations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setInvites((prev) => prev.filter((i) => i.id !== id));
      toast.success("Invite removed");
    } catch {
      toast.error("Delete failed");
    } finally {
      setProcessingId(null);
    }
  };

  /* ✅ UPDATE INVITE ROLE */
  const updateInviteRole = async (id: string, roleId: string) => {
    try {
      setProcessingId(id);
      const res = await fetch(`/api/invitations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId }),
      });
      if (!res.ok) throw new Error();
      await loadData();
      toast.success("Invite updated");
    } catch {
      toast.error("Update failed");
    } finally {
      setProcessingId(null);
    }
  };

  /* ✅ DELETE USER */
  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user permanently?")) return;

    try {
      setProcessingId(id);
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("User deleted");
    } catch {
      toast.error("Delete failed");
    } finally {
      setProcessingId(null);
    }
  };

  /* ✅ SUSPEND / ACTIVATE USER */
  const toggleUserStatus = async (id: string, isActive: boolean) => {
    try {
      setProcessingId(id);
      const res = await fetch(`/api/users/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: isActive ? "suspended" : "active",
        }),
      });

      if (!res.ok) throw new Error();

      setUsers((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, is_active: !isActive } : u
        )
      );

      toast.success(isActive ? "User suspended" : "User activated");
    } catch {
      toast.error("Status update failed");
    } finally {
      setProcessingId(null);
    }
  };

  /* ✅ STATUS BADGE USING is_active */
  const getStatusBadge = (isActive: boolean) =>
    isActive ? "bg-green-600 text-white" : "bg-red-600 text-white";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ✅ HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">
            Manage users and invitations
          </p>
        </div>

        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" /> Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite User</DialogTitle>
              <DialogDescription>Send invitation by email</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input
                  value={inviteForm.email}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, email: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Role</Label>
                <Select
                  value={inviteForm.roleId}
                  onValueChange={(value) =>
                    setInviteForm({ ...inviteForm, roleId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.display_name || role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                onClick={handleInvite}
                disabled={inviteLoading}
              >
                {inviteLoading ? "Sending..." : "Send Invite"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ✅ USERS TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Organization members</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {user.email}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline">
                      {user.roleDisplay || user.role || "N/A"}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge className={getStatusBadge(user.is_active)}>
                      {user.is_active ? "Active" : "Suspended"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() =>
                            toggleUserStatus(user.id, user.is_active)
                          }
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          {user.is_active ? "Suspend" : "Activate"}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/admin/users/${user.id}`)
                          }
                        >
                          View
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => deleteUser(user.id)}>
                          <Trash className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ✅ INVITES TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell>{invite.email}</TableCell>

                  {/* ✅ SUPPORT BOTH API SHAPES */}
                  <TableCell>
                    {invite.organization_roles?.display_name ||
                      invite.organization_roles?.name ||
                      invite.role?.display_name ||
                      invite.role?.name ||
                      "N/A"}
                  </TableCell>

                  {/* ✅ SUPPORT BOTH DATE FIELDS */}
                  <TableCell>
                    {new Date(
                      invite.expires_at || invite.expiresAt
                    ).toLocaleDateString()}
                  </TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => resendInvite(invite.id)}
                        >
                          <RefreshCcw className="w-4 h-4 mr-2" /> Resend
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() =>
                            updateInviteRole(invite.id, roles[0]?.id)
                          }
                        >
                          <Edit className="w-4 h-4 mr-2" /> Change Role
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => deleteInvite(invite.id)}
                        >
                          <Trash className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
