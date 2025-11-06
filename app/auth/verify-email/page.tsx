"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowRight, RotateCw, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleResendEmail = async () => {
    if (countdown > 0) return;
    
    setIsResending(true);
    setResendSuccess(false);
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Add your actual resend API call here
      // await resendVerificationEmail();
      
      setResendSuccess(true);
      setCountdown(30); // 30 second cooldown
      setIsResending(false);
    } catch (error) {
      console.error('Failed to resend email:', error);
      setIsResending(false);
    }
  };

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-xl border-0 dark:border dark:border-gray-700 overflow-hidden relative">
        {/* Logo positioned correctly at the top */}
     

        {/* Animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 animate-pulse" />
        
        <CardHeader className="relative pb-8 pt-16"> {/* Increased pt to accommodate logo */}
          {/* Animated email icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg animate-bounce-slow">
                <Mail className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-ping">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            </div>
          </div>

          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Check Your Email
          </CardTitle>
          <CardDescription className="text-lg mt-3 text-gray-600 dark:text-gray-300">
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
                  "w-2 h-2 rounded-full bg-gray-300 animate-pulse",
                  dot === 1 && "animate-bounce",
                  dot === 2 && "animate-bounce [animation-delay:0.2s]",
                  dot === 3 && "animate-bounce [animation-delay:0.4s]"
                )}
              />
            ))}
          </div>

          <p className="text-muted-foreground leading-relaxed">
            Please check your inbox and click on the verification link to activate your account. 
            The link will expire in 24 hours for security reasons.
          </p>

          {/* Success message */}
          {resendSuccess && (
            <div className="flex items-center justify-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg animate-in fade-in duration-300">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-700 dark:text-green-300">
                Verification email sent successfully!
              </span>
            </div>
          )}

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Didn't receive the email? Check your spam folder or{" "}
              <Button
                variant="link"
                className={cn(
                  "p-0 h-auto font-semibold",
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
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              size="lg"
            >
              <Link href="/auth/login" className="flex items-center justify-center group">
                Return to Sign In
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          {/* Support link */}
          <div className="text-center">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/support" className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                Need help? Contact Support
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}