"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import { createOrganizationAction, CreateOrgInput } from "@/app/actions/createOrganization";

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
  MapPin,
  Calendar,
  Palette,
  Link as LinkIcon,
} from "lucide-react";

export default function SetupOrganizationPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [loading, setLoading] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [form, setForm] = useState({
    name: "",
    type: "college",
    description: "",
    website: "",
    establishedYear: undefined as number | undefined,
    logoUrl: "",
    coverImageUrl: "",
    customDomain: "",
    primaryColor: "#4f46e5",
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
    },
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
        const res = await fetch("/api/profile", {
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

        const hasOrg = !!profile.organizationId;
        const isSuperAdmin = profile.userType === "super_admin";

        if (!isSuperAdmin) {
          toast.error("Only Super Admin can create an organization.");
          router.push("/dashboard");
          return;
        }

        const canCreateOrg = isSuperAdmin && !hasOrg;

        if (!canCreateOrg && profile.status !== "active") {
          toast.error("Please complete your profile first");
          router.push("/auth/complete-profile");
          return;
        }
      } catch (err) {
        console.error("Access check error:", err);
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

    if (form.establishedYear && (form.establishedYear < 1000 || form.establishedYear > new Date().getFullYear())) {
      toast.error("Please enter a valid established year");
      return;
    }

    setLoading(true);

    try {
      const payload: CreateOrgInput = {
        name: form.name,
        type: form.type,
        description: form.description || undefined,
        website: form.website || undefined,
        establishedYear: form.establishedYear,
        logoUrl: form.logoUrl || undefined,
        coverImageUrl: form.coverImageUrl || undefined,
        customDomain: form.customDomain || undefined,
        primaryColor: form.primaryColor,
        address: form.address.country ? {
          street: form.address.street || undefined,
          city: form.address.city || undefined,
          state: form.address.state || undefined,
          country: form.address.country,
        } : undefined,
      };

      const result = await createOrganizationAction(payload);

      if (result.success) {
        toast.success("Organization created successfully!", {
          description: `"${form.name}" is now ready. Redirecting you to your new organization…`,
          duration: 5000,
        });

        // Small delay to show success message
        setTimeout(() => {
          router.push(`/organization/${result.slug}`);
        }, 1500);
      }
    } catch (err: any) {
      console.error("Create organization error:", err);
      toast.error(err.message || "Failed to create organization", {
        description: "Please check your inputs and try again.",
      });
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
            Verifying your permissions…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-indigo-950/40 dark:to-slate-950 flex justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />

      <Card className="w-full max-w-4xl border-0 shadow-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden ring-1 ring-slate-900/5 dark:ring-white/10 relative z-10">

        {/* BANNER HEADER WITH LOGO + TITLE */}
        <div className="relative h-64 overflow-hidden bg-slate-100 dark:bg-slate-800">
          {form.coverImageUrl ? (
            <img
              src={form.coverImageUrl}
              alt="Cover"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              onError={(e) =>
                ((e.target as HTMLImageElement).style.display = "none")
              }
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 via-purple-500/30 to-rose-500/30 backdrop-blur-sm" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent" />

          {/* Cover Image Upload Hint */}
          <button
            type="button"
            onClick={() => document.getElementById("coverImageUrl")?.focus()}
            className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white/80 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 hover:bg-black/70 transition-all"
          >
            <Camera className="w-3.5 h-3.5" />
            Add Cover
          </button>

          {/* Logo */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-12 flex flex-col items-center gap-3 z-10 group">
            <div 
              className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl flex items-center justify-center overflow-hidden ring-4 ring-white/20 dark:ring-slate-900/50 backdrop-blur-md group-hover:scale-105 transition-transform duration-300 cursor-pointer"
              onClick={() => document.getElementById("logoUrl")?.focus()}
            >
              {form.logoUrl ? (
                <img
                  src={form.logoUrl}
                  alt="Logo"
                  className="w-full h-full object-contain p-2"
                  onError={(e) =>
                    ((e.target as HTMLImageElement).style.display = "none")
                  }
                />
              ) : (
                <Building2 className="h-10 w-10 text-slate-400 dark:text-slate-500" />
              )}
            </div>
            <span className="text-xs text-white/80 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full">
              Click to add logo
            </span>
          </div>

          {/* Banner Title */}
          <div className="absolute top-8 w-full text-center px-4">
            <h1 className="text-4xl font-black text-white drop-shadow-md tracking-tight">
              {form.name || "Your Organization"}
            </h1>
            <div className="mt-4 inline-flex items-center gap-2 bg-black/40 backdrop-blur-md text-white/90 px-4 py-1.5 rounded-full border border-white/10 text-sm font-medium">
              <Globe className="w-4 h-4" />
              /organization/{slugPreview || "organization-slug"}
            </div>
          </div>
        </div>

        {/* MAIN FORM */}
        <CardContent className="pt-20 px-8 pb-10 space-y-8">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* BASIC INFO */}
            <section className="bg-slate-50/50 dark:bg-slate-800/30 p-8 rounded-3xl space-y-5 border border-slate-100 dark:border-slate-800/50 shadow-inner">
              <h3 className="font-extrabold text-xl flex items-center gap-3 text-slate-900 dark:text-white">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1 mb-2 block">
                    Organization Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="E.g. Harvard University Alumni Association"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="bg-white dark:bg-slate-900 border-0 ring-1 ring-slate-200 dark:ring-slate-700 h-14 rounded-xl px-4 shadow-sm focus-visible:ring-indigo-500 font-medium"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1 mb-2 block">
                    Description
                  </label>
                  <Textarea
                    placeholder="Tell us about your alumni network, mission, and community..."
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="bg-white dark:bg-slate-900 border-0 ring-1 ring-slate-200 dark:ring-slate-700 min-h-[120px] rounded-xl p-4 shadow-sm focus-visible:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1 mb-2 block">
                    Organization Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, type: e.target.value }))
                    }
                    className="w-full bg-white dark:bg-slate-900 border-0 ring-1 ring-slate-200 dark:ring-slate-700 h-14 rounded-xl px-4 shadow-sm focus-visible:ring-indigo-500"
                  >
                    <option value="college">College / University</option>
                    <option value="high_school">High School</option>
                    <option value="corporate">Corporate Alumni</option>
                    <option value="nonprofit">Non-Profit</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1 mb-2 block">
                    Established Year
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g., 1876"
                    value={form.establishedYear || ""}
                    onChange={(e) =>
                      setForm((prev) => ({ 
                        ...prev, 
                        establishedYear: e.target.value ? parseInt(e.target.value) : undefined 
                      }))
                    }
                    className="bg-white dark:bg-slate-900 border-0 ring-1 ring-slate-200 dark:ring-slate-700 h-14 rounded-xl px-4 shadow-sm focus-visible:ring-indigo-500"
                  />
                </div>
              </div>
            </section>

            {/* BRANDING & APPEARANCE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <section className="bg-slate-50/50 dark:bg-slate-800/30 p-8 rounded-3xl space-y-5 border border-slate-100 dark:border-slate-800/50 shadow-inner">
                <h3 className="font-extrabold text-xl flex items-center gap-3 text-slate-900 dark:text-white">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  Branding
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1 mb-2 block">
                      Logo URL
                    </label>
                    <Input
                      id="logoUrl"
                      placeholder="https://example.com/logo.png"
                      value={form.logoUrl}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, logoUrl: e.target.value }))
                      }
                      className="bg-white dark:bg-slate-900 border-0 ring-1 ring-slate-200 dark:ring-slate-700 h-12 rounded-xl px-4 shadow-sm focus-visible:ring-purple-500"
                    />
                    {form.logoUrl && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Logo preview available
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1 mb-2 block">
                      Cover Banner URL
                    </label>
                    <Input
                      id="coverImageUrl"
                      placeholder="https://example.com/banner.jpg"
                      value={form.coverImageUrl}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          coverImageUrl: e.target.value,
                        }))
                      }
                      className="bg-white dark:bg-slate-900 border-0 ring-1 ring-slate-200 dark:ring-slate-700 h-12 rounded-xl px-4 shadow-sm focus-visible:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1 mb-2 flex items-center gap-2">
                      <Palette className="w-3.5 h-3.5" />
                      Primary Brand Color
                    </label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={form.primaryColor}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, primaryColor: e.target.value }))
                        }
                        className="w-14 h-14 rounded-xl border-0 ring-1 ring-slate-200 dark:ring-slate-700 cursor-pointer"
                      />
                      <Input
                        value={form.primaryColor}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, primaryColor: e.target.value }))
                        }
                        className="bg-white dark:bg-slate-900 border-0 ring-1 ring-slate-200 dark:ring-slate-700 h-12 rounded-xl px-4 shadow-sm focus-visible:ring-purple-500 flex-1"
                        placeholder="#4f46e5"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* LOCATION & CONTACT */}
              <section className="bg-slate-50/50 dark:bg-slate-800/30 p-8 rounded-3xl space-y-5 border border-slate-100 dark:border-slate-800/50 shadow-inner">
                <h3 className="font-extrabold text-xl flex items-center gap-3 text-slate-900 dark:text-white">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  Location & Contact
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1 mb-2 block">
                      Official Website
                    </label>
                    <Input
                      placeholder="https://www.university.edu"
                      value={form.website}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, website: e.target.value }))
                      }
                      className="bg-white dark:bg-slate-900 border-0 ring-1 ring-slate-200 dark:ring-slate-700 h-12 rounded-xl px-4 shadow-sm focus-visible:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1 mb-2 flex items-center gap-2">
                      <LinkIcon className="w-3.5 h-3.5" />
                      Custom Domain (Optional)
                    </label>
                    <Input
                      placeholder="alumni.yourdomain.com"
                      value={form.customDomain}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, customDomain: e.target.value }))
                      }
                      className="bg-white dark:bg-slate-900 border-0 ring-1 ring-slate-200 dark:ring-slate-700 h-12 rounded-xl px-4 shadow-sm focus-visible:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1 mb-2 block">
                      Country
                    </label>
                    <Input
                      placeholder="United States"
                      value={form.address.country}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          address: { ...prev.address, country: e.target.value }
                        }))
                      }
                      className="bg-white dark:bg-slate-900 border-0 ring-1 ring-slate-200 dark:ring-slate-700 h-12 rounded-xl px-4 shadow-sm focus-visible:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1 mb-2 block">
                        City
                      </label>
                      <Input
                        placeholder="Boston"
                        value={form.address.city}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            address: { ...prev.address, city: e.target.value }
                          }))
                        }
                        className="bg-white dark:bg-slate-900 border-0 ring-1 ring-slate-200 dark:ring-slate-700 h-12 rounded-xl px-4 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1 mb-2 block">
                        State/Province
                      </label>
                      <Input
                        placeholder="MA"
                        value={form.address.state}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            address: { ...prev.address, state: e.target.value }
                          }))
                        }
                        className="bg-white dark:bg-slate-900 border-0 ring-1 ring-slate-200 dark:ring-slate-700 h-12 rounded-xl px-4 shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* SECURITY NOTE */}
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800 dark:text-amber-300">
                <p className="font-semibold">Super Admin Access Required</p>
                <p className="text-xs opacity-80">
                  You are creating this organization as a Super Admin. You will automatically be assigned 
                  the Super Admin role within this organization with full control over all settings and members.
                </p>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-4 pb-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-16 rounded-2xl text-lg font-black bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xl shadow-indigo-600/20 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-3 justify-center">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating your alumni network...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Launch Alumni Network
                  </span>
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-4">
                By creating an organization, you agree to our terms of service and privacy policy.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}