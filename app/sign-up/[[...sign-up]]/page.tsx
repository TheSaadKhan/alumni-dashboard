"use client";

import { SignUp } from "@clerk/nextjs";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { Mail, ShieldCheck, AlertCircle } from "lucide-react";

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();

  const redirectUrl = searchParams.get("redirect") || searchParams.get("redirect_url") || "/";
  const inviteToken = searchParams.get("invite_token");
  const inviteEmail = searchParams.get("invite_email");

  const [inviteDetails, setInviteDetails] = useState<{
    organizationName: string;
    roleName: string;
    email: string;
  } | null>(null);

  // Fetch invite details if token present
  useEffect(() => {
    if (!inviteToken) return;
    fetch(`/api/invitations/preview?token=${inviteToken}`)
      .then(r => r.json())
      .then(data => {
        if (data.organizationName) {
          setInviteDetails({
            organizationName: data.organizationName,
            roleName: data.roleName,
            email: data.email,
          });
        }
      })
      .catch(() => {});
  }, [inviteToken]);

  useEffect(() => {
    if (isLoaded && user) {
      router.replace(redirectUrl);
    }
  }, [isLoaded, user, redirectUrl, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) return null;

  const signInHref = inviteToken
    ? `/sign-in?invite_token=${inviteToken}&invite_email=${inviteEmail}&redirect_url=${encodeURIComponent(redirectUrl)}`
    : `/sign-in?redirect=${encodeURIComponent(redirectUrl)}`;

  const afterSignUpUrl = inviteToken
    ? `/auth/callback?redirect_url=${encodeURIComponent(`/invite/accept?token=${inviteToken}`)}`
    : `/auth/callback?redirect_url=${encodeURIComponent(redirectUrl)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="relative w-36 h-36">
            <Image
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/public/Assets/bannerLogo.png`}
              alt="AlumniConnect Logo"
              fill
              className="object-contain"
              priority
              unoptimized
            />
          </div>
        </div>

        {inviteDetails ? (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-3">
              <ShieldCheck className="h-4 w-4" />
              You&apos;ve been invited
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Join {inviteDetails.organizationName}
            </h2>
            <p className="mt-1 text-gray-500 text-sm">
              as <span className="font-semibold text-indigo-600">{inviteDetails.roleName}</span>
            </p>
          </div>
        ) : (
          <div className="mt-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Join AlumniConnect</h2>
            <p className="mt-2 text-sm text-gray-500">Create your account to get started</p>
          </div>
        )}
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md space-y-4">
        {/* Invite Email Banner */}
        {inviteDetails && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <Mail className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Sign up with the invited email</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Please create your account using <strong>{inviteDetails.email}</strong> to accept this invitation.
              </p>
            </div>
          </div>
        )}

        {/* Wrong email hint */}
        {inviteDetails && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 flex items-start gap-2 text-xs text-blue-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-500" />
            <span>
              If you already have an account with <strong>{inviteDetails.email}</strong>,{" "}
              <a href={signInHref} className="underline font-semibold">sign in instead</a>.
            </span>
          </div>
        )}

        {/* Sign Up Form */}
        <div className="bg-white shadow-xl rounded-3xl py-8 px-6 sm:px-8">
          <SignUp
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none bg-transparent",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "border-gray-300 hover:bg-gray-50 h-11 rounded-xl",
                socialButtonsBlockButtonText: "text-sm font-medium",
                dividerLine: "bg-gray-200",
                dividerText: "text-gray-400 text-sm",
                formFieldLabel: "text-gray-700 text-sm font-medium",
                formFieldInput:
                  "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl h-11 text-sm",
                formButtonPrimary:
                  "bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-11 rounded-xl text-sm transition-colors",
                footerActionLink: "text-indigo-600 hover:text-indigo-700 text-sm font-medium",
                footer: "text-gray-500 text-sm",
              },
            }}
            routing="path"
            path="/sign-up"
            signInUrl={signInHref}
            fallbackRedirectUrl={afterSignUpUrl}
          />
        </div>

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{" "}
            <a href={signInHref} className="font-semibold text-indigo-600 hover:text-indigo-500">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <SignUpContent />
    </Suspense>
  );
}
