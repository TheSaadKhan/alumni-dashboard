import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Onboarding",
  description: "Join the professional alumni network and build your future.",
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
