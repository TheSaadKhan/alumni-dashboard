"use client";

import { SignUp } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";

export default function SignUpPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  /**
   * ✅ If user is already logged in → ALWAYS send to `/`
   * Middleware will route:
   * - super_admin/admin → /admin
   * - alumni/student   → /dashboard
   * - profile/org enforcement still applies
   */
  useEffect(() => {
    if (isLoaded && user) {
      router.replace("/");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null; // ✅ Middleware will handle final routing
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Logo Section */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="relative w-40 h-40">
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
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Join AlumniConnect
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Create your account to connect with alumni
        </p>
      </div>

      {/* Sign Up Form */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <SignUp
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none bg-transparent",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "border-gray-300 hover:bg-gray-50 h-10 rounded-md",
                socialButtonsBlockButtonText: "text-sm",
                dividerLine: "bg-gray-300",
                dividerText: "text-gray-500 text-sm",
                formFieldLabel:
                  "text-gray-700 text-sm font-medium",
                formFieldInput:
                  "border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md h-10 text-sm",
                formButtonPrimary:
                  "bg-blue-600 hover:bg-blue-700 text-white font-medium h-10 rounded-md text-sm",
                footerActionLink:
                  "text-blue-600 hover:text-blue-700 text-sm",
                footer: "text-gray-600 text-sm",
              },
            }}
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"

            /**
             * ✅ ALWAYS send to `/`
             * ✅ Middleware decides final destination
             */
            afterSignUpUrl="/"
            redirectUrl="/"
          />
        </div>

        {/* Sign In Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <a
              href="/sign-in"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </a>
          </p>
        </div>

        {/* Simple Features List */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Why join AlumniConnect?
          </h3>
          <ul className="space-y-3">
            {[
              "Network with alumni",
              "Find career opportunities",
              "Join events and webinars",
              "Free forever",
            ].map((text) => (
              <li key={text} className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mt-0.5 mr-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-600">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
