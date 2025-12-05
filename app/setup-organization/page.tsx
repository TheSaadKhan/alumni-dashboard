"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import { createOrganizationAction } from "@/app/actions/createOrganization";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { toast } from "sonner";
import { Building2, Globe, ImageIcon, FileText } from "lucide-react";

export default function SetupOrganizationPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    website: "",
    logo_url: "",
    cover_image_url: "",
  });

  /** -----------------------------
   *  AUTO SLUG PREVIEW
   * ------------------------------*/
  const slugPreview =
    form.name
      ?.toLowerCase()
      ?.replace(/[^a-z0-9]+/g, "-")
      ?.replace(/(^-|-$)/g, "") || "";

  /** -----------------------------
   *  PROTECT ROUTE → ONLY SUPER ADMIN + CHECK PROFILE COMPLETE
   * ------------------------------*/
  useEffect(() => {
    async function checkAccess() {
      if (!isLoaded || !user) {
        router.push("/");
        return;
      }

      try {
        // Get profile
        const res = await fetch(`/api/profile?authUserId=${user.id}`);
        if (!res.ok) {
          toast.error("Failed to load profile");
          router.push("/auth/complete-profile");
          return;
        }

        const data = await res.json();
        const profile = data.profile;

        if (!profile) {
          router.push("/auth/complete-profile");
          return;
        }

        // Check if profile is complete
        const metadata = (profile.metadata as any) || {};
        const isProfileComplete =
          profile.degree && profile.degree.trim() !== "" && metadata.major;

        if (!isProfileComplete) {
          toast.error("Please complete your profile first");
          router.push("/auth/complete-profile");
          return;
        }

        // Check if user is super_admin
        if (profile.user_type !== "super_admin") {
          toast.error("Only Super Admin can create an organization.");
          router.push("/dashboard");
          return;
        }

        // Check if organization already exists
        const orgRes = await fetch("/api/organizations");
        if (orgRes.ok) {
          const orgsData = await orgRes.json();
          if (orgsData.organizations && orgsData.organizations.length > 0) {
            // Organization exists, allow access but show info
            // User can still create additional organizations if needed
          }
        }
      } catch (err) {
        console.error("Access check failed:", err);
        toast.error("Failed to verify access");
        router.push("/dashboard");
      }
    }

    checkAccess();
  }, [isLoaded, user, router]);

  /** -----------------------------
   *  SUBMIT FORM → CREATE ORG
   * ------------------------------*/
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Organization name is required");
      return;
    }

    setLoading(true);

    try {
      const result = await createOrganizationAction(form);

      toast.success("Organization created successfully!");

      router.push(`/organization/${result.slug}`);
    } catch (err: any) {
      console.error("❌ Create org failed:", err);
      toast.error(err.message || "Failed to create organization");
    }

    setLoading(false);
  };

  /** -----------------------------
   *  PAGE UI
   * ------------------------------*/
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 flex justify-center items-center p-6">
      <Card className="w-full max-w-2xl shadow-xl border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center flex items-center justify-center gap-3">
            <Building2 className="h-8 w-8 text-indigo-600" />
            Setup Your Organization
          </CardTitle>
          <p className="text-center text-gray-500 dark:text-gray-300 mt-1">
            This will become your institution’s main identity.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* ------------------ BASIC INFO ------------------ */}
            <div className="bg-white/70 dark:bg-gray-800/50 p-5 rounded-xl space-y-4 shadow-sm border">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Basic Information
              </h3>

              <div>
                <label className="block font-medium mb-1">
                  Organization Name *
                </label>
                <Input
                  placeholder="Ex: Stanford University"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Slug Preview:</strong>{" "}
                <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                  {slugPreview || "organization-slug"}
                </span>
              </div>

              <div>
                <label className="block font-medium mb-1">Description</label>
                <Textarea
                  placeholder="Write a short description..."
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
            </div>

            {/* ------------------ BRANDING ------------------ */}
            <div className="bg-white/70 dark:bg-gray-800/50 p-5 rounded-xl space-y-4 shadow-sm border">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-indigo-600" />
                Branding
              </h3>

              <div>
                <label className="block font-medium mb-1">Logo URL</label>
                <Input
                  placeholder="https://example.com/logo.png"
                  value={form.logo_url}
                  onChange={(e) =>
                    setForm({ ...form, logo_url: e.target.value })
                  }
                />
              </div>

              {form.logo_url && (
                <div className="flex justify-center">
                  <img
                    src={form.logo_url}
                    alt="Logo Preview"
                    className="w-24 h-24 object-contain rounded-lg shadow"
                    onError={(e) =>
                      ((e.target as HTMLImageElement).style.display = "none")
                    }
                  />
                </div>
              )}

              <div>
                <label className="block font-medium mb-1">
                  Cover Image URL
                </label>
                <Input
                  placeholder="https://example.com/banner.jpg"
                  value={form.cover_image_url}
                  onChange={(e) =>
                    setForm({ ...form, cover_image_url: e.target.value })
                  }
                />
              </div>

              {form.cover_image_url && (
                <div className="flex justify-center mt-2">
                  <img
                    src={form.cover_image_url}
                    alt="Cover Preview"
                    className="w-full max-h-32 object-cover rounded-lg shadow"
                    onError={(e) =>
                      ((e.target as HTMLImageElement).style.display = "none")
                    }
                  />
                </div>
              )}
            </div>

            {/* ------------------ WEBSITE ------------------ */}
            <div className="bg-white/70 dark:bg-gray-800/50 p-5 rounded-xl space-y-4 shadow-sm border">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-indigo-600" />
                Website
              </h3>

              <Input
                placeholder="https://www.university.edu"
                value={form.website}
                onChange={(e) =>
                  setForm({ ...form, website: e.target.value })
                }
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full text-lg py-5 font-semibold"
            >
              {loading ? "Creating..." : "Create Organization"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
