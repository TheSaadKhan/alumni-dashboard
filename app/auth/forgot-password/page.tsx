"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { GraduationCap, ArrowLeft, Loader2, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { useClerk } from "@clerk/nextjs";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const clerk = useClerk();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Email required", {
        description: "Please enter your email address.",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Invalid email format", {
        description: "Please enter a valid email address.",
      });
      return;
    }

    setLoading(true);

    try {
      // Use Clerk's password reset functionality
      await clerk.client.signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });

      toast.success("Reset link sent!", {
        description: "Check your email for the password reset link.",
        duration: 5000,
      });
      setSubmitted(true);
    } catch (error: any) {
      console.error("Password reset error:", error);
      
      // Handle different error cases
      if (error.status === 404) {
        toast.error("Email not found", {
          description: "No account found with this email address.",
        });
      } else if (error.status === 429) {
        toast.error("Too many attempts", {
          description: "Please wait a few minutes before trying again.",
        });
      } else {
        toast.error("Failed to send reset email", {
          description: error.message || "Please try again later.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-2xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-3xl rounded-2xl overflow-hidden">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-emerald-100 dark:ring-emerald-900/20">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
            <CardDescription className="text-base mt-2">
              We've sent a password reset link to:
            </CardDescription>
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-3 bg-indigo-50 dark:bg-indigo-950/30 py-2 px-4 rounded-full inline-block">
              {email}
            </p>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Click the link in the email to reset your password. The link will expire in 1 hour.
              </p>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Didn't receive the email? Check your spam folder or{" "}
                <Button 
                  variant="link" 
                  className="p-0 h-auto font-semibold text-indigo-600"
                  onClick={() => setSubmitted(false)}
                >
                  try again
                </Button>
              </p>
              
              <Link href="/sign-in" className="block">
                <Button variant="outline" className="w-full h-11 rounded-xl font-medium">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] bg-purple-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[20%] left-[20%] w-[40%] h-[40%] bg-pink-500/10 blur-[100px] rounded-full" />
      </div>

      <Card className="w-full max-w-md border-0 shadow-2xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-3xl rounded-2xl overflow-hidden relative z-10">
        <CardHeader className="text-center pt-8 pb-6">
          <div className="flex justify-center mb-6">
            <div className="relative w-20 h-20 drop-shadow-xl">
              <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
              <Image
                src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/public/Assets/logo.png`}
                alt="Alumni Connect Logo"
                fill
                priority
                className="object-contain relative z-10 drop-shadow-md"
                unoptimized
                sizes="80px"
              />
            </div>
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Reset Password
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Enter your email to receive a password reset link
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 pt-0">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
                  className="pl-10 h-12 rounded-xl border-gray-200 dark:border-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02]"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Reset Link...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Link 
              href="/sign-in" 
              className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium transition-colors inline-flex items-center gap-1 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                <Mail className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-1">
                  Important Note
                </p>
                <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed">
                  The password reset link will be valid for 1 hour. Make sure to check your spam folder if you don't see the email within a few minutes.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}