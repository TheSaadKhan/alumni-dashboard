"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import {
  Card, CardHeader, CardTitle, CardContent, CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Mail, Send, Users, Clock, CheckCircle, XCircle, RefreshCw, Trash2, AlertCircle } from "lucide-react";

import { toast } from "sonner";
import { useAuthProfile } from "@/context/AuthContext";

interface Role {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isDefault: boolean;
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
    id: string;
    name: string;
    slug: string;
  };
  invitedByUser: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
}

export default function InvitePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { profile, organization } = useAuthProfile();

  const [loading, setLoading] = useState(true);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [pendingInvites, setPendingInvites] = useState<Invite[]>([]);
  const [acceptedInvites, setAcceptedInvites] = useState<Invite[]>([]);
  const [expiredInvites, setExpiredInvites] = useState<Invite[]>([]);
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("");
  const [inviteUserType, setInviteUserType] = useState<"alumni" | "student">("alumni");
  const [inviteMessage, setInviteMessage] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [activeTab, setActiveTab] = useState("send");

  /* ---------------------------------------------
      LOAD MEMBERSHIP + ALLOWED INVITE ROLES
  ---------------------------------------------- */
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/sign-in");
      return;
    }

    if (organization?.id) {
      loadInviteData();
    }
  }, [isLoaded, user, router, organization]);

  async function loadInviteData() {
    if (!organization?.id) return;
    
    setLoading(true);
    try {
      const [rolesRes, invitesRes] = await Promise.all([
        fetch(`/api/organizations/${organization.id}/roles?includeSystem=true`),
        fetch(`/api/invitations?organizationId=${organization.id}`),
      ]);

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setAvailableRoles(rolesData.roles || []);
        // Set default role
        const defaultRole = rolesData.roles?.find((r: Role) => r.isDefault || r.slug === "alumni");
        if (defaultRole && !inviteRole) {
          setInviteRole(defaultRole.id);
        }
      }

      if (invitesRes.ok) {
        const invitesData = await invitesRes.json();
        const invites = invitesData.invites || [];
        
        setPendingInvites(invites.filter((i: Invite) => 
          i.status === "pending" && new Date(i.expiresAt) > new Date()
        ));
        setAcceptedInvites(invites.filter((i: Invite) => i.status === "accepted"));
        setExpiredInvites(invites.filter((i: Invite) => 
          i.status === "expired" || (i.status === "pending" && new Date(i.expiresAt) < new Date())
        ));
      }
    } catch (err) {
      console.error("Failed loading invite data:", err);
      toast.error("Failed loading data");
    } finally {
      setLoading(false);
    }
  }

  /* ---------------------------------------------
      SEND INVITE
  ---------------------------------------------- */
  async function sendInvite() {
    if (!inviteEmail) {
      toast.error("Email address is required");
      return;
    }

    if (!inviteRole) {
      toast.error("Please select a role");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!organization?.id) {
      toast.error("Organization not found");
      return;
    }

    try {
      setSendingInvite(true);
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: organization.id,
          email: inviteEmail,
          roleId: inviteRole,
          userType: inviteUserType,
          customMessage: inviteMessage || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send invitation");
      }

      toast.success("Invitation sent successfully!", {
        description: `An invitation has been sent to ${inviteEmail}`,
      });

      // Reset form
      setInviteEmail("");
      setInviteMessage("");
      
      // Refresh invites list
      await loadInviteData();
      
      // Switch to manage tab to show new invite
      setActiveTab("manage");

    } catch (err: any) {
      console.error("Invite failed:", err);
      toast.error(err.message || "Failed to send invitation");
    } finally {
      setSendingInvite(false);
    }
  }

  /* ---------------------------------------------
      RESEND INVITE
  ---------------------------------------------- */
  async function resendInvite(id: string) {
    try {
      const res = await fetch(`/api/invitations/${id}/resend`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to resend invitation");
      }

      toast.success("Invitation resent successfully");
      await loadInviteData();
    } catch (err: any) {
      console.error("Resend failed:", err);
      toast.error(err.message || "Failed to resend invitation");
    }
  }

  /* ---------------------------------------------
      CANCEL INVITE
  ---------------------------------------------- */
  async function cancelInvite(id: string) {
    if (!confirm("Are you sure you want to cancel this invitation?")) return;

    try {
      const res = await fetch(`/api/invitations/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to cancel invitation");
      }

      toast.success("Invitation cancelled");
      await loadInviteData();
    } catch (err: any) {
      console.error("Cancel failed:", err);
      toast.error(err.message || "Failed to cancel invitation");
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    if (status === "accepted") {
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <CheckCircle className="h-3 w-3 mr-1" />
        Accepted
      </Badge>;
    }
    
    if (status === "expired" || (status === "pending" && new Date(expiresAt) < new Date())) {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
        <Clock className="h-3 w-3 mr-1" />
        Expired
      </Badge>;
    }
    
    if (status === "revoked") {
      return <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        Revoked
      </Badge>;
    }
    
    return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
      <Clock className="h-3 w-3 mr-1" />
      Pending
    </Badge>;
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-2 text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!user) {
    router.push("/sign-in");
    return null;
  }

  if (!organization) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-full">
          <AlertCircle className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold">Organization Required</h2>
        <p className="text-muted-foreground max-w-md">
          You need to be part of an organization to invite members.
          Please complete onboarding or contact your organization admin.
        </p>
        <Button onClick={() => router.push("/onboarding")} className="mt-4">
          Complete Onboarding
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12 relative z-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
            Invite Members
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Grow your institution network by inviting alumni and students
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="send" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Send Invite
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Manage Invites ({pendingInvites.length})
          </TabsTrigger>
        </TabsList>

        {/* Send Invite Tab */}
        <TabsContent value="send">
          <Card className="border-0 shadow-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[2rem] overflow-hidden ring-1 ring-slate-900/5 dark:ring-white/10 relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 pb-6 border-b border-slate-100 dark:border-slate-800 pt-8 px-8">
              <CardTitle className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="h-5 w-5 text-indigo-600" />
                New Invitation
              </CardTitle>
              <CardDescription>
                Invite someone to join your organization. They will receive an email with instructions.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-8 space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="colleague@university.edu"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    className="bg-white dark:bg-slate-800 border-0 ring-1 ring-slate-200 dark:ring-slate-700 h-14 rounded-xl px-4 shadow-inner focus-visible:ring-indigo-500 focus-visible:ring-2 font-medium"
                  />
                </div>

                {/* User Type */}
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                    Member Type <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={inviteUserType}
                    onValueChange={(v) => setInviteUserType(v as "alumni" | "student")}
                  >
                    <SelectTrigger className="bg-white dark:bg-slate-800 border-0 ring-1 ring-slate-200 dark:ring-slate-700 h-14 rounded-xl px-4 shadow-inner focus:ring-indigo-500 focus:ring-2 font-bold text-slate-700 dark:text-slate-300">
                      <SelectValue placeholder="Select member type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-700 shadow-xl">
                      <SelectItem value="alumni">Alumni</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Role Dropdown */}
                <div className="space-y-3 md:col-span-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                    Assigned Role <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={inviteRole}
                    onValueChange={setInviteRole}
                  >
                    <SelectTrigger className="bg-white dark:bg-slate-800 border-0 ring-1 ring-slate-200 dark:ring-slate-700 h-14 rounded-xl px-4 shadow-inner focus:ring-indigo-500 focus:ring-2 font-bold text-slate-700 dark:text-slate-300">
                      <SelectValue placeholder="Select role to assign" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-700 shadow-xl">
                      {availableRoles.map(role => (
                        <SelectItem key={role.id} value={role.id} className="font-medium cursor-pointer rounded-lg focus:bg-indigo-50 dark:focus:bg-indigo-900/30">
                          <div>
                            <span>{role.name}</span>
                            {role.description && (
                              <span className="text-xs text-muted-foreground ml-2">({role.description})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Personal Message */}
                <div className="space-y-3 md:col-span-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                    Personal Message (Optional)
                  </label>
                  <Textarea
                    placeholder="Add a personal message to the invitation..."
                    value={inviteMessage}
                    onChange={e => setInviteMessage(e.target.value)}
                    rows={3}
                    className="bg-white dark:bg-slate-800 border-0 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl resize-none focus-visible:ring-indigo-500"
                  />
                </div>
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
              
              <div className="pt-4 flex justify-end">
                <Button 
                  onClick={sendInvite} 
                  disabled={sendingInvite || !inviteEmail || !inviteRole} 
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-indigo-600/20 transition-transform hover:scale-[1.02]"
                >
                  {sendingInvite ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage Invites Tab */}
        <TabsContent value="manage">
          <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl overflow-hidden ring-1 ring-slate-900/5 dark:ring-white/10">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 pb-6 border-b border-slate-100 dark:border-slate-800 pt-8 px-8">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Invitation History
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadInviteData}
                  className="rounded-xl"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
              <CardDescription>
                Track and manage all sent invitations
              </CardDescription>
            </CardHeader>

            <CardContent className="p-8 space-y-6">
              {/* Pending Invites */}
              {pendingInvites.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    Pending Invitations ({pendingInvites.length})
                  </h3>
                  <div className="space-y-3">
                    {pendingInvites.map((inv) => (
                      <div
                        key={inv.id}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-indigo-100 text-indigo-600 text-sm">
                                {inv.email.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-extrabold text-slate-900 dark:text-white">
                                {inv.email}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Invited as {inv.role.name} • {formatDate(inv.createdAt)}
                              </p>
                            </div>
                          </div>
                          {inv.message && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 p-2 bg-slate-50 dark:bg-slate-900 rounded">
                              "{inv.message}"
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Expires: {formatDate(inv.expiresAt)}</span>
                            <span>Invited by: {inv.invitedByUser.fullName}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(inv.status, inv.expiresAt)}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => resendInvite(inv.id)}
                            title="Resend invitation"
                            className="rounded-xl"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => cancelInvite(inv.id)}
                            title="Cancel invitation"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Accepted Invites */}
              {acceptedInvites.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Accepted Invitations ({acceptedInvites.length})
                  </h3>
                  <div className="space-y-3">
                    {acceptedInvites.map((inv) => (
                      <div
                        key={inv.id}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm"
                      >
                        <div>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-green-100 text-green-600 text-sm">
                                {inv.email.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-extrabold text-slate-900 dark:text-white">
                                {inv.email}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Accepted as {inv.role.name} • {inv.acceptedAt && formatDate(inv.acceptedAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                        {getStatusBadge(inv.status, inv.expiresAt)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expired/Revoked Invites */}
              {expiredInvites.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-gray-600" />
                    Expired/Revoked ({expiredInvites.length})
                  </h3>
                  <div className="space-y-3">
                    {expiredInvites.map((inv) => (
                      <div
                        key={inv.id}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm opacity-75"
                      >
                        <div>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-gray-100 text-gray-600 text-sm">
                                {inv.email.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-extrabold text-slate-900 dark:text-white">
                                {inv.email}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {inv.status === "revoked" ? "Revoked" : "Expired"} on {formatDate(inv.expiresAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                        {getStatusBadge(inv.status, inv.expiresAt)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pendingInvites.length === 0 && acceptedInvites.length === 0 && expiredInvites.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 font-medium">No invitations sent yet.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Send your first invitation using the "Send Invite" tab above.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}