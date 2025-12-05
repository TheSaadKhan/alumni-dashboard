"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import { createOrganizationAction } from "@/app/actions/createOrganization";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

import { toast } from "sonner";
import {
  Building2,
  Globe,
  ImageIcon,
  FileText,
  Loader2,
  Shield,
  CheckCircle2,
  Camera,
} from "lucide-react";

export default function SetupOrganizationPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [loading, setLoading] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [form, setForm] = useState({
    name: "",
    description: "",
    website: "",
    logo_url: "",
    cover_image_url: "",
  });

  /* ---------------- SLUG PREVIEW ---------------- */
  const slugPreview =
    form.name
      ?.toLowerCase()
      ?.replace(/[^a-z0-9]+/g, "-")
      ?.replace(/(^-|-$)/g, "") || "";

  /* ---------------- ACCESS CHECK ---------------- */
  useEffect(() => {
    async function checkAccess() {
      if (!isLoaded) return;
      if (!user) {
        router.push("/");
        return;
      }

      try {
        const res = await fetch(`/api/profile?authUserId=${user.id}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          toast.error("Failed to load profile");
          router.push("/auth/complete-profile");
          return;
        }

        const { profile } = await res.json();

        if (!profile) {
          router.push("/auth/complete-profile");
          return;
        }

        const metadata = (profile.metadata as any) || {};
        const isProfileComplete =
          profile.degree?.trim() &&
          metadata.major &&
          String(metadata.major).trim();

        if (!isProfileComplete) {
          toast.error("Please complete your profile first");
          router.push("/auth/complete-profile");
          return;
        }

        if (profile.user_type !== "super_admin") {
          toast.error("Only Super Admin can create an organization.");
          router.push("/dashboard");
          return;
        }
      } catch (err) {
        toast.error("Access verification failed");
        router.push("/dashboard");
      } finally {
        setCheckingAccess(false);
      }
    }

    checkAccess();
  }, [isLoaded, user, router]);

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Organization name is required");
      return;
    }

    setLoading(true);

    try {
      const result = await createOrganizationAction(form);

      toast.success("Organization created successfully!", {
        description: "Redirecting you to your new organization…",
      });

      router.push(`/organization/${result.slug}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create organization");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- ACCESS LOADING ---------------- */
  if (checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/60">
        <div className="glass-card px-8 py-6 rounded-2xl shadow-glow flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Checking your access…
          </p>
        </div>
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/40 to-background flex justify-center items-center px-4 py-10">
      <Card className="w-full max-w-3xl overflow-hidden glass-card shadow-glow border border-border/60">

        {/* ✅ BANNER HEADER WITH LOGO + TITLE */}
        <div className="relative h-48 bg-muted overflow-hidden">
          {form.cover_image_url ? (
            <img
              src={form.cover_image_url}
              alt="Cover"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) =>
                ((e.target as HTMLImageElement).style.display = "none")
              }
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/30 to-purple-500/30" />
          )}

          <div className="absolute inset-0 bg-black/30" />

          {/* Logo */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-10 flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-2xl bg-background shadow-xl flex items-center justify-center overflow-hidden border">
              {form.logo_url ? (
                <img
                  src={form.logo_url}
                  alt="Logo"
                  className="w-full h-full object-contain"
                  onError={(e) =>
                    ((e.target as HTMLImageElement).style.display = "none")
                  }
                />
              ) : (
                <Building2 className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Camera className="h-3 w-3" /> Logo Preview
            </span>
          </div>

          {/* Banner Title */}
          <div className="absolute top-6 w-full text-center px-4">
            <h1 className="text-3xl font-bold text-white drop-shadow">
              {form.name || "Your Organization"}
            </h1>
            <p className="text-white/80 text-sm mt-1">
              Public URL:{" "}
              <span className="font-medium">
                /organization/{slugPreview || "organization-slug"}
              </span>
            </p>
          </div>
        </div>

        {/* ✅ MAIN FORM */}
        <CardContent className="pt-16 space-y-8">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* BASIC INFO */}
            <section className="bg-background/60 p-5 rounded-xl space-y-4 border">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Basic Information
              </h3>

              <Input
                placeholder="Organization Name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="focus-visible:ring-primary"
                required
              />

              <Textarea
                placeholder="Short description about your institution..."
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="min-h-[90px] resize-none"
              />
            </section>

            {/* BRANDING */}
            <section className="bg-background/60 p-5 rounded-xl space-y-4 border">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Branding
              </h3>

              <Input
                placeholder="Logo Image URL"
                value={form.logo_url}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, logo_url: e.target.value }))
                }
              />

              <Input
                placeholder="Cover Banner Image URL"
                value={form.cover_image_url}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    cover_image_url: e.target.value,
                  }))
                }
              />
            </section>

            {/* WEBSITE */}
            <section className="bg-background/60 p-5 rounded-xl space-y-4 border">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Website
              </h3>

              <Input
                placeholder="https://www.university.edu"
                value={form.website}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, website: e.target.value }))
                }
              />
            </section>

            {/* SUBMIT */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-base font-semibold gradient-primary text-white shadow-glow hover:opacity-95"
            >
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating organization…
                </span>
              ) : (
                "Create Organization"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
