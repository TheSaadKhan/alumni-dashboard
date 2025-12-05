"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import {
  Card, CardHeader, CardTitle, CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";

import { toast } from "sonner";

export default function InvitePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("");

  /* ---------------------------------------------
      LOAD MEMBERSHIP + ALLOWED INVITE ROLES
  ---------------------------------------------- */
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/sign-in");
      return;
    }

    async function load() {
      setLoading(true);

      try {
        const res = await fetch(`/api/invitations/info?authUserId=${user?.id ?? ""}`);
        const data = await res.json();

        if (!data.success) {
          toast.error(data.error || "Failed to load");
          setLoading(false);
          return;
        }

        setAvailableRoles(data.allowedRoles || []);
        setPendingInvites(data.pendingInvites || []);
        setOrganizationId(data.organizationId);

      } catch (err) {
        console.error("Failed loading invite data:", err);
        toast.error("Failed loading data");
      }

      setLoading(false);
    }

    load();
  }, [isLoaded, user, router]);


  /* ---------------------------------------------
      SEND INVITE
  ---------------------------------------------- */
  async function sendInvite() {
    if (!inviteEmail || !inviteRole) {
      toast.error("Email and Role required");
      return;
    }

    if (!organizationId) {
      toast.error("Organization not found");
      return;
    }

    try {
      const res = await fetch("/api/invitations/create", {
        method: "POST",
        body: JSON.stringify({
          email: inviteEmail,
          roleId: inviteRole,
          organizationId,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || "Invite failed");
        return;
      }

      toast.success("Invitation sent!");

      // update list
      setPendingInvites(prev => [...prev, data.invitation]);

      setInviteEmail("");
      setInviteRole("");

    } catch (err) {
      console.error("Invite failed:", err);
      toast.error("Invite failed");
    }
  }

  /* ---------------------------------------------
      CANCEL INVITE
  ---------------------------------------------- */
  async function cancelInvite(id: string) {
    try {
      const res = await fetch(`/api/invitations/cancel?id=${id}`, {
        method: "POST",
      });
      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || "Cancel failed");
        return;
      }

      toast.success("Invitation cancelled");
      setPendingInvites(prev => prev.filter(i => i.id !== id));

    } catch (err) {
      console.error("Cancel failed:", err);
      toast.error("Cancel failed");
    }
  }

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">

      <Card>
        <CardHeader>
          <CardTitle>Invite Members</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* Email */}
          <Input
            placeholder="Email address"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
          />

          {/* Role Dropdown */}
          <Select
            value={inviteRole}
            onValueChange={v => setInviteRole(v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role to invite" />
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map(role => (
                <SelectItem key={role.id} value={role.id}>
                  {role.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={sendInvite}>Send Invitation</Button>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {pendingInvites.length === 0 && (
            <p className="text-gray-500">No pending invites</p>
          )}

          {pendingInvites.map(inv => (
            <div
              key={inv.id}
              className="border p-3 rounded flex justify-between items-center"
            >
              <div>
                <p><strong>{inv.email}</strong></p>
                <p className="text-sm text-gray-600">
                  Role: {inv.organization_roles.display_name}
                </p>
              </div>

              <Button
                variant="destructive"
                onClick={() => cancelInvite(inv.id)}
              >
                Cancel
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

    </div>
  );
}
