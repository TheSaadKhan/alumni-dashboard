"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Loader2, CheckCircle2, Building2, ShieldCheck, AlertCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface InviteDetails {
  organizationName: string;
  organizationLogo?: string | null;
  roleName: string;
  email: string;
  inviterName: string;
  expiresAt: string;
}

function AcceptInviteContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, isLoaded } = useUser();

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = params.get("token");

  // Step 1: Fetch invite details
  useEffect(() => {
    if (!token) {
      setError("Missing invitation token.");
      setLoading(false);
      return;
    }

    async function fetchInvite() {
      try {
        const res = await fetch(`/api/invitations/preview?token=${token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "This invitation is invalid or has expired.");
          setLoading(false);
          return;
        }

        setInvite(data);
      } catch {
        setError("Failed to load invitation details.");
      } finally {
        setLoading(false);
      }
    }

    fetchInvite();
  }, [token]);

  // Step 2: Auto-accept if user is already signed in
  useEffect(() => {
    if (!isLoaded || !user || !invite || accepting) return;

    const currentEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase();
    const invitedEmail = invite.email.toLowerCase();

    if (currentEmail !== invitedEmail) {
      // Wrong account — show an error, don't auto-accept
      return;
    }

    handleAccept();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user, invite]);

  async function handleAccept() {
    if (!token) return;
    setAccepting(true);

    try {
      const res = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to accept invitation.");
        setAccepting(false);
        return;
      }

      toast.success(`Welcome to ${invite?.organizationName || "the organization"}!`);
      // Redirect to onboarding with the invite token so role/org is pre-filled
      router.push(`/auth/complete-profile/member?invite_token=${token}`);
    } catch {
      toast.error("Unexpected error. Please try again.");
      setAccepting(false);
    }
  }

  function handleSignUp() {
    if (!invite) return;
    const params = new URLSearchParams({
      invite_token: token!,
      invite_email: invite.email,
      redirect_url: `/invite/accept?token=${token}`,
    });
    router.push(`/sign-up?${params.toString()}`);
  }

  function handleSignIn() {
    if (!invite) return;
    const params = new URLSearchParams({
      invite_token: token!,
      invite_email: invite.email,
      redirect_url: `/invite/accept?token=${token}`,
    });
    router.push(`/sign-in?${params.toString()}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto" />
          <p className="text-slate-500 font-medium">Loading your invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Invalid Invitation</h2>
          <p className="text-slate-500">{error}</p>
          <Button onClick={() => router.push("/")} className="w-full rounded-xl bg-slate-800 text-white hover:bg-slate-700">
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  if (!invite) return null;

  const isLoggedIn = isLoaded && !!user;
  const currentEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const isWrongAccount = isLoggedIn && currentEmail !== invite.email.toLowerCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        {/* Invite Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header Band */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white">
            <div className="flex items-center gap-3 mb-1">
              <ShieldCheck className="h-5 w-5 text-indigo-200" />
              <span className="text-indigo-200 text-sm font-medium">You&apos;ve been invited</span>
            </div>
            <h1 className="text-2xl font-bold leading-tight">Join {invite.organizationName}</h1>
            <p className="text-indigo-200 text-sm mt-1">as <span className="font-semibold text-white">{invite.roleName}</span></p>
          </div>

          <div className="px-8 py-6 space-y-5">
            {/* Org Info */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">{invite.organizationName}</p>
                <p className="text-sm text-slate-500">Invited by {invite.inviterName}</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <Mail className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-amber-700 font-medium uppercase tracking-wide">Invitation sent to</p>
                <p className="font-semibold text-slate-800 text-sm">{invite.email}</p>
              </div>
            </div>

            {/* Wrong Account Warning */}
            {isWrongAccount && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
                <strong>Wrong account!</strong> You&apos;re signed in as <strong>{currentEmail}</strong>. Please sign out and sign in with <strong>{invite.email}</strong>.
              </div>
            )}

            {/* Actions */}
            {!isLoggedIn ? (
              <div className="space-y-3">
                <Button onClick={handleSignUp} className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base">
                  Sign Up with {invite.email.split("@")[0]}…
                </Button>
                <Button onClick={handleSignIn} variant="outline" className="w-full h-12 rounded-xl border-2 font-semibold">
                  Already have an account? Sign In
                </Button>
              </div>
            ) : isWrongAccount ? (
              <Button onClick={() => router.push("/sign-in")} className="w-full h-12 rounded-xl bg-slate-800 hover:bg-slate-900 text-white">
                Switch Account
              </Button>
            ) : (
              <div className="flex flex-col items-center gap-3 py-2">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                <p className="text-slate-500 text-sm">
                  {accepting ? "Joining organization…" : "Verifying your account…"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400">
          By accepting, you agree to the{" "}
          <a href="/terms" className="text-indigo-500 hover:underline">Terms of Service</a>
        </p>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
