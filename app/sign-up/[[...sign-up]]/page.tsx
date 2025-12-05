"use client";

import { SignUp } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { Loader2 } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const redirectUrl = searchParams.get("redirect_url") || "/auth/complete-profile";

  useEffect(() => {
    if (isLoaded && user) {
      router.push(redirectUrl);
    }
  }, [isLoaded, user, redirectUrl, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col items-center justify-center space-y-6 text-center">
          <div className="relative w-48 h-48 mb-4">
            <Image
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/public/Assets/bannerLogo.png`}
              alt="AlumniConnect Logo"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Join AlumniConnect
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md">
            Start your journey to reconnect with your alma mater and build meaningful connections.
          </p>
          <div className="mt-8 space-y-4">
            <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <span>Free to join and use</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <span>Access to exclusive events</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <span>Network with professionals</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <span>Career opportunities</span>
            </div>
          </div>
        </div>

        {/* Right Side - Sign Up Form */}
        <div className="w-full flex flex-col items-center justify-center">
          <div className="lg:hidden mb-8">
            <div className="relative w-32 h-32 mx-auto">
              <Image
                src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/public/Assets/bannerLogo.png`}
                alt="AlumniConnect Logo"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
          <div className="w-full max-w-md">
            <SignUp
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "shadow-2xl border-0",
                  headerTitle: "text-2xl font-bold text-gray-900 dark:text-white",
                  headerSubtitle: "text-gray-600 dark:text-gray-400",
                  socialButtonsBlockButton: "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800",
                  formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700 text-white",
                  footerActionLink: "text-indigo-600 hover:text-indigo-700",
                },
              }}
              routing="path"
              path="/sign-up"
              signInUrl="/sign-in"
              afterSignUpUrl={redirectUrl}
              redirectUrl={redirectUrl}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

