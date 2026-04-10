"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowRight, RotateCw, CheckCircle2, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  // Check if email is already verified
  useEffect(() => {
    if (isLoaded && user) {
      if (user.primaryEmailAddress?.verification?.status === "verified") {
        // Email already verified, redirect to dashboard
        toast.success("Email already verified!");
        router.push("/dashboard");
      }
    }
  }, [isLoaded, user, router]);

  // Handle URL verification token
  useEffect(() => {
    const verifyEmailFromToken = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");

      if (token) {
        setIsVerifying(true);
        try {
          const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data?.error || "Verification failed");
          }
          
          toast.success("Email verified successfully!");
          router.push("/dashboard");
        } catch (error: any) {
          console.error("Email verification error:", error);
          toast.error("Failed to verify email", {
            description: error.message || "The verification link may have expired.",
          });
        } finally {
          setIsVerifying(false);
        }
      }
    };

    verifyEmailFromToken();
  }, [router]);

  const handleResendEmail = async () => {
    if (countdown > 0 || !user) return;
    
    setIsResending(true);
    setResendSuccess(false);
    
    try {
      const res = await fetch("/api/auth/verify-email", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to resend email");
      }
      
      setResendSuccess(true);
      setCountdown(60); // 60 second cooldown
      toast.success("Verification email sent!", {
        description: "Please check your inbox for the verification link.",
      });
    } catch (error: any) {
      console.error('Failed to resend email:', error);
      toast.error("Failed to resend email", {
        description: error.message || "Please try again later.",
      });
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (!isLoaded || isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          <p className="text-sm text-muted-foreground">
            {isVerifying ? "Verifying your email..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to verify your email address.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/sign-in">Go to Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isEmailVerified = user.primaryEmailAddress?.verification?.status === "verified";

  if (isEmailVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">Email Already Verified</CardTitle>
            <CardDescription>
              Your email address has already been verified.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const emailAddress = user.primaryEmailAddress?.emailAddress || "your email";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] bg-purple-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[20%] left-[20%] w-[40%] h-[40%] bg-pink-500/10 blur-[100px] rounded-full" />
      </div>

      <Card className="w-full max-w-md border-0 shadow-2xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-3xl rounded-2xl overflow-hidden relative z-10">
        <CardHeader className="relative pb-8 pt-8 text-center">
          {/* Animated email icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg animate-bounce-slow">
                <Mail className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center animate-ping">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            </div>
          </div>

          <CardTitle className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Check Your Email
          </CardTitle>
          <CardDescription className="text-lg mt-3 text-muted-foreground">
            We've sent a verification link to your email address
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 relative pb-8">
          {/* Progress indicator */}
          <div className="flex justify-center space-x-2">
            {[1, 2, 3].map((dot) => (
              <div
                key={dot}
                className={cn(
                  "w-2 h-2 rounded-full bg-indigo-300 animate-pulse",
                  dot === 1 && "animate-bounce",
                  dot === 2 && "animate-bounce [animation-delay:0.2s]",
                  dot === 3 && "animate-bounce [animation-delay:0.4s]"
                )}
              />
            ))}
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-4 text-center">
            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300 break-all">
              {emailAddress}
            </p>
          </div>

          <p className="text-muted-foreground leading-relaxed text-center">
            Please check your inbox and click on the verification link to activate your account. 
            The link will expire in 24 hours for security reasons.
          </p>

          {/* Success message */}
          {resendSuccess && (
            <div className="flex items-center justify-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl animate-in fade-in duration-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm text-emerald-700 dark:text-emerald-300">
                Verification email sent successfully!
              </span>
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or{" "}
              <Button
                variant="link"
                className={cn(
                  "p-0 h-auto font-semibold text-indigo-600",
                  countdown > 0 && "text-gray-400 cursor-not-allowed"
                )}
                onClick={handleResendEmail}
                disabled={isResending || countdown > 0}
              >
                {isResending ? (
                  <>
                    <RotateCw className="mr-1 h-3 w-3 animate-spin" />
                    Sending...
                  </>
                ) : countdown > 0 ? (
                  `Resend in ${countdown}s`
                ) : (
                  "resend verification email"
                )}
              </Button>
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button 
              asChild 
              className="w-full h-12 rounded-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02]"
              size="lg"
            >
              <Link href="/dashboard" className="flex items-center justify-center group">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          {/* Support link */}
          <div className="text-center">
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
              <Link href="/support" className="text-xs">
                Need help? Contact Support
              </Link>
            </Button>
          </div>

          {/* Email tips */}
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-800/50">
            <p className="text-xs text-amber-800 dark:text-amber-300 text-center">
              <strong>Tip:</strong> If you don't see the email within a few minutes, check your spam or junk folder.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}