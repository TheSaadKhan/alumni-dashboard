import { Metadata } from "next";
import DashboardLayoutClient from "./dashboard-layout-client";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Access your personalized alumni network, jobs, and mentorship opportunities.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}