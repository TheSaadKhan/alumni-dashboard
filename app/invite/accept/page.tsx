"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

function AcceptInviteContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, isLoaded } = useUser();

  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("Validating invitation...");

  const token = params.get("token");

  useEffect(() => {
    if (!isLoaded) return;

    if (!token) {
      setStatusMessage("Missing invitation token.");
      setLoading(false);
      return;
    }

    if (!user) {
      // User must sign in first
      setStatusMessage("Redirecting to sign in...");
      router.push(`/sign-in?redirect_url=/invite/accept?token=${token}`);
      return;
    }

    async function acceptInvite() {
      try {
        const res = await fetch("/api/invitations/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setStatusMessage(data.error || "Invitation failed.");
          toast.error(data.error || "Invitation failed.");
          setLoading(false);
          return;
        }

        toast.success("Invitation accepted!");

        // Redirect user to complete profile if needed, otherwise to dashboard
        if (data.needsProfileCompletion) {
          router.push("/auth/complete-profile");
        } else {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error(err);
        setStatusMessage("Unexpected error.");
        toast.error("Unexpected error.");
      } finally {
        setLoading(false);
      }
    }

    acceptInvite();
  }, [isLoaded, user, token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-indigo-100">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-center text-xl">Invitation</CardTitle>
        </CardHeader>

        <CardContent className="text-center">
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="text-gray-600">{statusMessage}</p>
            </div>
          ) : (
            <p className="py-6 text-gray-700">{statusMessage}</p>
          )}

          {!loading && (
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              Go to Dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
