import { Metadata } from "next";
import AdminLayoutClient from "./admin-layout-client";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Manage your alumni community and institutional intelligence.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}