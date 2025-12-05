// Organization setup page for AlumniConnect
// Follows the owner registration flow

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Building2, MapPin, Globe, Users, BookOpen, Calendar } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/db/client/supabase-browser";
import Image from "next/image";

export default function OrganizationSetupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    organizationName: "",
    organizationType: "school",
    establishedYear: "",
    address: "",
    city: "",
    state: "",
    country: "",
    website: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);

  const organizationTypes = [
    { value: "school", label: "School" },
    { value: "college", label: "College" },
    { value: "university", label: "University" },
    { value: "training_institute", label: "Training Institute" },
    { value: "educational_trust", label: "Educational Trust" },
    { value: "other", label: "Other" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 200 }, (_, i) => currentYear - i);

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!formData.organizationName) {
      toast.error("Organization Name Required");
      return;
    }
    if (!formData.organizationType) {
      toast.error("Organization Type Required");
      return;
    }
    if (!formData.establishedYear) {
      toast.error("Established Year Required");
      return;
    }
    if (!formData.country) {
      toast.error("Country Required");
      return;
    }

    setLoading(true);

    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error("Authentication Required", { description: "Please log in to create an organization" });
        router.push("/auth/login");
        return;
      }

      // Create organization
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: formData.organizationName,
          type: formData.organizationType,
          established_year: parseInt(formData.establishedYear),
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          country: formData.country,
          website: formData.website || null,
          description: formData.description || null,
          is_active: true,
          created_by: user.id,
          metadata: {
            setup_complete: true,
            initial_setup: true,
          },
        })
        .select()
        .single();

      if (orgError) {
        toast.error("Organization Creation Failed", { description: orgError.message });
        console.error(orgError);
        setLoading(false);
        return;
      }

      // Update user profile to link with organization and mark setup complete
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          organization_id: orgData.id,
          metadata: {
            hierarchy_level: "owner",
            registration_stage: "complete",
            organization_setup_complete: true,
          },
        })
        .eq("id", user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        // Continue anyway as the organization was created successfully
      }

      toast.success("Organization Created!", {
        description: "Your AlumniConnect platform is ready to use.",
      });

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      let message = "An unexpected error occurred";
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === "string") {
        message = err;
      } else {
        try {
          message = JSON.stringify(err);
        } catch {
          // ignore stringify errors and keep the default message
        }
      }
      toast.error("Setup Failed", { description: message });
    }

    setLoading(false);
  };

  const setData = (k: string, v: string) => setFormData((p) => ({ ...p, [k]: v }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.15),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.15),transparent_60%)] pointer-events-none" />

      <div className="w-full max-w-2xl z-10">
        <Card className="w-full shadow-2xl border-slate-200/60 dark:border-slate-700/70 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl">
          <CardHeader className="text-center space-y-2 pb-4">
            <div className="flex justify-center mb-2">
              <div className="p-4 bg-green-100 dark:bg-green-900/40 rounded-2xl shadow-md">
                <div className="relative w-16 h-16 group">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/public/Assets/logo.png`}
                    alt="Alumni Connect Logo"
                    fill
                    priority
                    className="object-contain transition-transform duration-300 group-hover:scale-105"
                    unoptimized
                    sizes="64px"
                  />
                </div>
              </div>
            </div>
            <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-white">
              Set Up Your Organization
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400 text-sm">
              Complete your AlumniConnect setup by adding your institution details
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Organization Name */}
              <div className="space-y-1.5">
                <Label className="text-slate-700 dark:text-slate-300">Organization Name *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    value={formData.organizationName}
                    onChange={(e) => setData("organizationName", e.target.value)}
                    className="pl-10 h-12 rounded-xl"
                    placeholder="Enter your organization name"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Organization Type */}
                <div className="space-y-1.5">
                  <Label className="text-slate-700 dark:text-slate-300">Organization Type *</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 z-10" />
                    <Select value={formData.organizationType} onValueChange={(v) => setData("organizationType", v)}>
                      <SelectTrigger className="pl-10 h-12 rounded-xl">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizationTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Established Year */}
                <div className="space-y-1.5">
                  <Label className="text-slate-700 dark:text-slate-300">Established Year *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 z-10" />
                    <Select value={formData.establishedYear} onValueChange={(v) => setData("establishedYear", v)}>
                      <SelectTrigger className="pl-10 h-12 rounded-xl">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <Label className="text-slate-700 dark:text-slate-300">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-slate-400 h-4 w-4" />
                  <Textarea
                    value={formData.address}
                    onChange={(e) => setData("address", e.target.value)}
                    className="pl-10 min-h-20 rounded-xl resize-none"
                    placeholder="Enter your organization address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* City */}
                <div className="space-y-1.5">
                  <Label className="text-slate-700 dark:text-slate-300">City</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setData("city", e.target.value)}
                    className="h-12 rounded-xl"
                    placeholder="City"
                  />
                </div>

                {/* State */}
                <div className="space-y-1.5">
                  <Label className="text-slate-700 dark:text-slate-300">State/Province</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setData("state", e.target.value)}
                    className="h-12 rounded-xl"
                    placeholder="State"
                  />
                </div>

                {/* Country */}
                <div className="space-y-1.5">
                  <Label className="text-slate-700 dark:text-slate-300">Country *</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setData("country", e.target.value)}
                    className="h-12 rounded-xl"
                    placeholder="Country"
                    required
                  />
                </div>
              </div>

              {/* Website */}
              <div className="space-y-1.5">
                <Label className="text-slate-700 dark:text-slate-300">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setData("website", e.target.value)}
                    className="pl-10 h-12 rounded-xl"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-slate-700 dark:text-slate-300">Description</Label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-3 text-slate-400 h-4 w-4" />
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setData("description", e.target.value)}
                    className="pl-10 min-h-24 rounded-xl resize-none"
                    placeholder="Brief description of your organization..."
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1 h-12 bg-green-600 hover:bg-green-500 text-white text-md rounded-xl shadow-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" /> Creating Organization...
                    </>
                  ) : (
                    "Complete Setup"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12 rounded-xl"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Back
                </Button>
              </div>
            </form>

            <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                This information will be used to set up your AlumniConnect platform.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} AlumniConnect. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}