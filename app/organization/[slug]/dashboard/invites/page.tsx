"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Loader2,
  Mail,
  Send,
  Users,
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthProfile } from "@/context/AuthContext";

interface Role {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface Invite {
  id: string;
  email: string;
  status: string;
  userType: string;
  message: string | null;
  expiresAt: string;
  createdAt: string;
  acceptedAt: string | null;
  role: {
    name: string;
    slug: string;
  };
  invitedByUser: {
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
}

export default function InvitesPage() {
  const { organization } = useAuthProfile();

  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [userType, setUserType] = useState<"alumni" | "student">("alumni");
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [activeTab, setActiveTab] = useState("send");

  useEffect(() => {
    if (organization?.id) {
      fetchRoles();
      fetchInvites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.id]);

  const fetchRoles = async () => {
    try {
      const res = await fetch(`/api/organizations/${organization?.id}/roles`);
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
        const defaultRole = data.roles?.find((r: Role) => r.slug === "alumni" || r.slug === "student");
        if (defaultRole && !roleId) {
          setRoleId(defaultRole.id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    }
  };

  const fetchInvites = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invitations?organizationId=${organization?.id}`);
      if (res.ok) {
        const data = await res.json();
        setInvites(data.invites || []);
      }
    } catch (error) {
      console.error("Failed to fetch invites:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendInvite = async () => {
    if (!email) {
      toast.error("Email address is required");
      return;
    }

    if (!roleId) {
      toast.error("Please select a role");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: organization?.id,
          email,
          roleId,
          userType,
          customMessage: customMessage || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Invitation sent successfully!", {
          description: `An invitation has been sent to ${email}`,
        });
        setEmail("");
        setCustomMessage("");
        fetchInvites();
      } else {
        toast.error(data.error || "Failed to send invitation");
      }
    } catch (err) {
      console.error("Send invite error:", err);
      toast.error("Failed to send invitation. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const resendInvite = async (inviteId: string) => {
    try {
      const res = await fetch(`/api/invitations/${inviteId}/resend`, {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Invitation resent successfully");
        fetchInvites();
      } else {
        toast.error(data.error || "Failed to resend invitation");
      }
    } catch (err) {
      console.error("Resend invite error:", err);
      toast.error("Failed to resend invitation");
    }
  };

  const cancelInvite = async (inviteId: string) => {
    if (!confirm("Are you sure you want to cancel this invitation?")) return;

    try {
      const res = await fetch(`/api/invitations/${inviteId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Invitation cancelled");
        fetchInvites();
      } else {
        toast.error(data.error || "Failed to cancel invitation");
      }
    } catch (err) {
      console.error("Cancel invite error:", err);
      toast.error("Failed to cancel invitation");
    }
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    if (status === "accepted") {
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="h-3 w-3 mr-1" />
          Accepted
        </Badge>
      );
    }

    if (status === "expired" || new Date(expiresAt) < new Date()) {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          <Clock className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    }

    if (status === "revoked") {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Revoked
        </Badge>
      );
    }

    return (
      <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const activeInvites = invites.filter(
    (i) => i.status === "pending" && new Date(i.expiresAt) > new Date()
  );
  const expiredInvites = invites.filter(
    (i) => i.status === "expired" || (i.status === "pending" && new Date(i.expiresAt) < new Date())
  );
  const acceptedInvites = invites.filter((i) => i.status === "accepted");

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Users className="h-8 w-8 text-indigo-600" />
          Invite Members
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Invite alumni and students to join your organization's network
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="send" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Send Invite
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Manage Invites ({activeInvites.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-600" />
                Send New Invitation
              </CardTitle>
              <CardDescription>
                Invite someone to join your organization. They will receive an email with instructions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={sending}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userType">Member Type *</Label>
                  <Select
                    value={userType}
                    onValueChange={(v) => setUserType(v as "alumni" | "student")}
                    disabled={sending}
                  >
                    <SelectTrigger id="userType">
                      <SelectValue placeholder="Select member type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alumni">Alumni</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select value={roleId} onValueChange={setRoleId} disabled={sending || roles.length === 0}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder={roles.length === 0 ? "Loading roles..." : "Select role"} />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                          {role.description && ` - ${role.description}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Personal Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Add a personal message to the invitation..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                  disabled={sending}
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    <p className="font-medium">What happens next?</p>
                    <p className="text-xs mt-1">
                      The invited person will receive an email with a link to accept the invitation.
                      They will need to complete their profile before joining the organization.
                      Invitations expire after 7 days.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={sendInvite}
                disabled={sending || !email || !roleId}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Invitation...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Invitation History
                </span>
                <Button variant="outline" size="sm" onClick={fetchInvites} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </CardTitle>
              <CardDescription>Track and manage all sent invitations</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
              ) : invites.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No invitations sent yet</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Send your first invitation using the "Send Invite" tab above
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {activeInvites.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        Pending Invitations ({activeInvites.length})
                      </h3>
                      <div className="space-y-3">
                        {activeInvites.map((invite) => (
                          <div
                            key={invite.id}
                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-indigo-100 text-indigo-600 text-sm">
                                    {invite.email.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">{invite.email}</p>
                                  <p className="text-sm text-gray-500">
                                    Invited as {invite.role.name} • {formatDate(invite.createdAt)}
                                  </p>
                                </div>
                              </div>
                              {invite.message && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 p-2 bg-white dark:bg-gray-900 rounded">
                                  "{invite.message}"
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span>Expires: {formatDate(invite.expiresAt)}</span>
                                <span>Invited by: {invite.invitedByUser.fullName}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {getStatusBadge(invite.status, invite.expiresAt)}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => resendInvite(invite.id)}
                                title="Resend invitation"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => cancelInvite(invite.id)}
                                title="Cancel invitation"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {acceptedInvites.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Accepted Invitations ({acceptedInvites.length})
                      </h3>
                      <div className="space-y-3">
                        {acceptedInvites.map((invite) => (
                          <div
                            key={invite.id}
                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-green-100 text-green-600 text-sm">
                                    {invite.email.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">{invite.email}</p>
                                  <p className="text-sm text-gray-500">
                                    Accepted as {invite.role.name} • {formatDate(invite.acceptedAt!)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            {getStatusBadge(invite.status, invite.expiresAt)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {expiredInvites.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-gray-600" />
                        Expired/Revoked ({expiredInvites.length})
                      </h3>
                      <div className="space-y-3">
                        {expiredInvites.map((invite) => (
                          <div
                            key={invite.id}
                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 opacity-75"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-gray-100 text-gray-600 text-sm">
                                    {invite.email.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">{invite.email}</p>
                                  <p className="text-sm text-gray-500">
                                    {invite.status === "revoked" ? "Revoked" : "Expired"} on {formatDate(invite.expiresAt)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            {getStatusBadge(invite.status, invite.expiresAt)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

