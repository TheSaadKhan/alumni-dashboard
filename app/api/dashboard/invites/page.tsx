// app/(dashboard)/invites/page.tsx
"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";

export default function InvitesPage({ roles, organizationId, invitedByMemberId }: any) {
  // roles: [{ id, name, display_name }]
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState(roles?.[0]?.id || "");
  const [sending, setSending] = useState(false);

  const sendInvite = async () => {
    if (!email || !roleId) {
      toast.error("Email and role are required");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/invites/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          invitedByMemberId,
          targetRoleId: roleId,
          email,
          customMessage: "",
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Invite created. Email sent (if mailer configured).");
        setEmail("");
      } else {
        toast.error(json.error || "Failed creating invite");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Send an invitation</h2>

      <div className="grid gap-3">
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="invitee@example.com" />
        <Select value={roleId} onValueChange={(v) => setRoleId(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roles.map((r: any) => (
              <SelectItem value={r.id} key={r.id}>
                {r.display_name || r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={sendInvite} disabled={sending}>
          {sending ? "Sending..." : "Send Invite"}
        </Button>
      </div>
    </div>
  );
}
