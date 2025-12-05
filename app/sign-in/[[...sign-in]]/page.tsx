"use client";

import { SignIn } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { Loader2 } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  /**
   * ✅ If user is already logged in → ALWAYS send to `/`
   * Middleware will route:
   * - super_admin/admin → /admin
   * - alumni/student   → /dashboard
   */
  useEffect(() => {
    if (isLoaded && user) {
      router.replace("/");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Preparing your experience…
          </p>
        </div>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4">
      <div className="mx-auto min-h-screen max-w-6xl grid grid-cols-1 lg:grid-cols-2 items-center gap-10">

        {/* ================= LEFT BRAND PANEL ================= */}
        <div className="hidden lg:flex flex-col items-center text-center space-y-6">
          <div className="relative w-44 h-44">
            <Image
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/public/Assets/bannerLogo.png`}
              alt="AlumniConnect Logo"
              fill
              className="object-contain drop-shadow-lg"
              priority
              unoptimized
            />
          </div>

          <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Welcome back
          </h1>

          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md">
            Reconnect with alumni, unlock opportunities, and expand your professional network.
          </p>

          <div className="pt-6 space-y-4 text-slate-700 dark:text-slate-300 text-sm">
            {[
              "Exclusive alumni-only events",
              "Powerful career networking",
              "Verified job opportunities",
            ].map((text) => (
              <div key={text} className="flex items-center justify-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ================= RIGHT AUTH CARD ================= */}
        <div className="w-full flex items-center justify-center">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 px-6 py-8">

            {/* Mobile Logo */}
            <div className="lg:hidden flex flex-col items-center mb-6">
              <div className="relative w-20 h-20 mb-4">
                <Image
                  src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/public/Assets/bannerLogo.png`}
                  alt="AlumniConnect Logo"
                  fill
                  className="object-contain"
                  priority
                  unoptimized
                />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Welcome back
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Sign in to continue
              </p>
            </div>

            <SignIn
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "shadow-none border-0 bg-transparent p-0",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton:
                    "border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 h-11 rounded-lg transition",
                  formFieldInput:
                    "border-slate-300 dark:border-slate-700 rounded-lg h-11 text-sm bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500",
                  formButtonPrimary:
                    "bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 text-white h-11 rounded-lg font-medium transition",
                  footerActionLink:
                    "text-indigo-600 hover:text-indigo-700 font-medium",
                },
              }}
              routing="path"
              path="/sign-in"
              signUpUrl="/sign-up"

              /**
               * ✅ ALWAYS send to `/`
               * ✅ Middleware decides final destination
               */
              afterSignInUrl="/"
              redirectUrl="/"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
