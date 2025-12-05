"use client";

import { useState, useEffect, JSX } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import {
  Briefcase,
  Globe,
  MapPin,
  User,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import Image from "next/image";
import { toast } from "sonner";

export default function CompleteProfilePage(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();

  const profileIdFromInvite = searchParams.get("profileId");
  const fromInvite = searchParams.get("from");

  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    full_name: "",
    headline: "",
    bio: "",
    location: "",
    graduation_year: new Date().getFullYear(),
    degree: "",
    user_type: "alumni",
    skills: {} as Record<string, any>,
    metadata: {
      major: "",
      professional: {
        company: "",
        industry: "",
        current_position: "",
        employment_type: "",
      },
      social: {
        website_url: "",
        linkedin_url: "",
        github_url: "",
        twitter_url: "",
      },
      privacy: {
        profile_visible: true,
        email_visible: false,
        graduation_year_visible: true,
      },
    },
  });

  const [currentSkill, setCurrentSkill] = useState<string>("");
  const [currentSkillValue, setCurrentSkillValue] = useState<string>("");

  /* ------------------------- Static dropdown data ------------------------- */
  const graduationYears = Array.from(
    { length: 50 },
    (_, i) => new Date().getFullYear() - i
  );

  const industries = [
    "Technology",
    "Healthcare",
    "Finance",
    "Education",
    "Manufacturing",
    "Consulting",
    "Marketing",
    "Engineering",
    "Research",
    "Government",
    "Non-profit",
    "Entrepreneurship",
    "Real Estate",
    "Legal",
    "Arts & Entertainment",
    "Other",
  ];

  const employmentTypes = [
    "Full-time",
    "Part-time",
    "Contract",
    "Freelance",
    "Internship",
    "Self-employed",
    "Unemployed",
    "Student",
    "Retired",
  ];

  /* ------------------------- LOAD USER PROFILE ------------------------- */
  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.replace("/");
      return;
    }

    const authUserId = user.id;

    async function fetchProfile() {
      setLoading(true);
      try {
        const url = profileIdFromInvite
          ? `/api/profile?id=${encodeURIComponent(profileIdFromInvite)}`
          : `/api/profile?authUserId=${encodeURIComponent(authUserId)}`;

        const res = await fetch(url);

        if (res.status === 404) {
          setProfile(null);
          setLoading(false);
          return;
        }

        if (!res.ok) {
          throw new Error(`Failed fetching profile: ${res.status}`);
        }

        const data = await res.json();
        const prof = data?.profile ?? data ?? null;

        if (!prof) {
          setProfile(null);
          setLoading(false);
          return;
        }

        setProfile(prof);

        const skillsData =
          typeof prof.skills === "string"
            ? JSON.parse(prof.skills)
            : prof.skills || {};

        const metadataData =
          typeof prof.metadata === "string"
            ? JSON.parse(prof.metadata)
            : prof.metadata || {};

        setFormData({
          full_name:
            prof.full_name ||
            `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
          headline: prof.headline || "",
          bio: prof.bio || "",
          location: prof.location || "",
          graduation_year: prof.graduation_year || new Date().getFullYear(),
          degree: prof.degree || "",
          user_type: prof.user_type || "alumni",
          skills: skillsData,
          metadata: {
            major: metadataData.major || "",
            professional: {
              company: metadataData.professional?.company || "",
              industry: metadataData.professional?.industry || "",
              current_position:
                metadataData.professional?.current_position || "",
              employment_type:
                metadataData.professional?.employment_type || "",
            },
            social: {
              website_url: metadataData.social?.website_url || "",
              linkedin_url: metadataData.social?.linkedin_url || "",
              github_url: metadataData.social?.github_url || "",
              twitter_url: metadataData.social?.twitter_url || "",
            },
            privacy: {
              profile_visible: metadataData.privacy?.profile_visible ?? true,
              email_visible: metadataData.privacy?.email_visible ?? false,
              graduation_year_visible:
                metadataData.privacy?.graduation_year_visible ?? true,
            },
          },
        });

        // ✅ If already completed & not from invite, send them away
        if (prof.degree && !profileIdFromInvite) {
          router.replace("/");
          return;
        }
      } catch (err) {
        console.error("Profile load failed:", err);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [isLoaded, user, router, profileIdFromInvite]);

  /* ------------------------- Global loading ------------------------- */
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-muted-foreground">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  /* ------------------------- Skills helpers ------------------------- */
  const addSkill = () => {
    const name = currentSkill.trim();
    const level = currentSkillValue.trim();
    if (!name || !level) {
      toast.error("Enter both skill name and level");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      skills: { ...prev.skills, [name]: level },
    }));

    setCurrentSkill("");
    setCurrentSkillValue("");
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => {
      const updated = { ...prev.skills };
      delete updated[skill];
      return { ...prev, skills: updated };
    });
  };

  /* ------------------------- Validation ------------------------- */
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.full_name?.trim()) {
        newErrors.full_name = "Full name is required";
      }
      if (!formData.degree?.trim()) {
        newErrors.degree = "Degree is required";
      }
      if (!formData.metadata.major?.trim()) {
        newErrors.major = "Major is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep((s) => s + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1 && !saving) {
      setCurrentStep((s) => s - 1);
    }
  };

  /* ------------------------- Submit handler ------------------------- */
  const handleSubmit = async () => {
    // Validate all required fields (step 1)
    if (!validateStep(1)) {
      setCurrentStep(1);
      toast.error("Please complete all required fields");
      return;
    }

    if (!formData.degree || !formData.metadata.major) {
      toast.error("Degree and major are required");
      setCurrentStep(1);
      return;
    }

    if (!isLoaded || !user) {
      toast.error("No authenticated user");
      return;
    }

    const authUserId = user.id;

    setSaving(true);
    setErrors({});

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authUserId,
          full_name: formData.full_name,
          headline: formData.headline,
          bio: formData.bio,
          location: formData.location,
          graduation_year: formData.graduation_year,
          degree: formData.degree,
          major: formData.metadata.major,
          user_type: formData.user_type,
          skills: formData.skills,
          metadata: formData.metadata,
        }),
      });

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ error: "Failed to save profile" }));
        console.error("Save profile failed:", res.status, errorData);
        toast.error(errorData.error || "Failed to save profile");
        return;
      }

      const payload = await res.json();
      const updatedProfile = payload.profile ?? payload;

      setProfile(updatedProfile);
      toast.success("Profile completed successfully!");

      // Small delay for smoother UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      /**
       * ✅ CRITICAL:
       * Do NOT decide route here.
       * Let middleware send:
       * - super_admin/admin → /admin or /setup-organization
       * - alumni/student    → /dashboard
       */
      router.replace("/");
    } catch (err: any) {
      console.error("Update failed:", err);
      toast.error(err.message || "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------- Step indicator ------------------------- */
  const StepIndicator = (
    <div className="flex justify-center mb-8">
      <div className="flex items-center space-x-2 sm:space-x-4">
        {[
          { num: 1, label: "Basic Info" },
          { num: 2, label: "Professional" },
          { num: 3, label: "Social & Skills" },
          { num: 4, label: "Privacy" },
        ].map(({ num, label }) => (
          <div key={num} className="flex flex-col items-center">
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                ${
                  num === currentStep
                    ? "bg-indigo-600 text-white ring-4 ring-indigo-200 scale-110"
                    : num < currentStep
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                }`}
              >
                {num < currentStep ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  num
                )}
              </div>

              {num < 4 && (
                <div
                  className={`w-8 sm:w-12 h-1 mx-1 sm:mx-2 transition-all ${
                    num < currentStep
                      ? "bg-green-600"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              )}
            </div>
            <span
              className={`text-xs mt-1 hidden sm:block ${
                num === currentStep
                  ? "text-indigo-600 font-medium"
                  : "text-gray-500"
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  /* ------------------------- Step content ------------------------- */
  const StepContent: Record<number, JSX.Element> = {
    1: (
      <div className="space-y-6">
        <div className="text-center">
          <User className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold">Basic Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Full Name *</Label>
            <Input
              value={formData.full_name}
              onChange={(e) => {
                setFormData({ ...formData, full_name: e.target.value });
                if (errors.full_name)
                  setErrors({ ...errors, full_name: "" });
              }}
              className={errors.full_name ? "border-red-500" : ""}
            />
            {errors.full_name && (
              <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.full_name}
              </p>
            )}
          </div>

          <div>
            <Label>Headline</Label>
            <Input
              placeholder="e.g. Software Engineer at Google"
              value={formData.headline}
              onChange={(e) =>
                setFormData({ ...formData, headline: e.target.value })
              }
            />
          </div>

          <div>
            <Label>Graduation Year</Label>
            <Select
              value={String(formData.graduation_year)}
              onValueChange={(v) =>
                setFormData({ ...formData, graduation_year: Number(v) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {graduationYears.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Degree *</Label>
            <Input
              value={formData.degree}
              onChange={(e) => {
                setFormData({ ...formData, degree: e.target.value });
                if (errors.degree)
                  setErrors({ ...errors, degree: "" });
              }}
              className={errors.degree ? "border-red-500" : ""}
              placeholder="e.g. Bachelor of Science"
            />
            {errors.degree && (
              <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.degree}
              </p>
            )}
          </div>

          <div>
            <Label>Major *</Label>
            <Input
              value={formData.metadata.major}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  metadata: {
                    ...prev.metadata,
                    major: e.target.value,
                  },
                }));
                if (errors.major)
                  setErrors({ ...errors, major: "" });
              }}
              className={errors.major ? "border-red-500" : ""}
              placeholder="e.g. Computer Science"
            />
            {errors.major && (
              <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.major}
              </p>
            )}
          </div>
        </div>
      </div>
    ),

    2: (
      <div className="space-y-6">
        <div className="text-center">
          <Briefcase className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold">Professional Details</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Current Position</Label>
            <Input
              value={formData.metadata.professional.current_position}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  metadata: {
                    ...prev.metadata,
                    professional: {
                      ...prev.metadata.professional,
                      current_position: e.target.value,
                    },
                  },
                }))
              }
            />
          </div>

          <div>
            <Label>Company</Label>
            <Input
              value={formData.metadata.professional.company}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  metadata: {
                    ...prev.metadata,
                    professional: {
                      ...prev.metadata.professional,
                      company: e.target.value,
                    },
                  },
                }))
              }
            />
          </div>

          <div>
            <Label>Industry</Label>
            <Select
              value={formData.metadata.professional.industry}
              onValueChange={(v) =>
                setFormData((prev) => ({
                  ...prev,
                  metadata: {
                    ...prev.metadata,
                    professional: {
                      ...prev.metadata.professional,
                      industry: v,
                    },
                  },
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {industries.map((i) => (
                  <SelectItem key={i} value={i}>
                    {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Employment Type</Label>
            <Select
              value={formData.metadata.professional.employment_type}
              onValueChange={(v) =>
                setFormData((prev) => ({
                  ...prev,
                  metadata: {
                    ...prev.metadata,
                    professional: {
                      ...prev.metadata.professional,
                      employment_type: v,
                    },
                  },
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {employmentTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    ),

    3: (
      <div className="space-y-6">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold">Social Links & Skills</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Location</Label>
            <Input
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
            />
          </div>

          <div>
            <Label>Website</Label>
            <Input
              value={formData.metadata.social.website_url}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  metadata: {
                    ...prev.metadata,
                    social: {
                      ...prev.metadata.social,
                      website_url: e.target.value,
                    },
                  },
                }))
              }
            />
          </div>

          <div>
            <Label>LinkedIn</Label>
            <Input
              value={formData.metadata.social.linkedin_url}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  metadata: {
                    ...prev.metadata,
                    social: {
                      ...prev.metadata.social,
                      linkedin_url: e.target.value,
                    },
                  },
                }))
              }
            />
          </div>

          <div>
            <Label>GitHub</Label>
            <Input
              value={formData.metadata.social.github_url}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  metadata: {
                    ...prev.metadata,
                    social: {
                      ...prev.metadata.social,
                      github_url: e.target.value,
                    },
                  },
                }))
              }
            />
          </div>

          <div className="md:col-span-2">
            <Label>Bio</Label>
            <Textarea
              rows={3}
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <Label className="text-lg mb-4 block">Skills & Expertise</Label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Skill</Label>
              <Input
                value={currentSkill}
                onChange={(e) => setCurrentSkill(e.target.value)}
              />
            </div>
            <div>
              <Label>Level (1–10)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={currentSkillValue}
                onChange={(e) => setCurrentSkillValue(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={addSkill} className="mt-3">
            Add Skill
          </Button>

          <div className="mt-4 space-y-2">
            {Object.entries(formData.skills).map(([key, val]) => (
              <div
                key={key}
                className="p-3 border rounded-lg flex items-center justify-between"
              >
                <div>
                  <strong>{key}</strong>
                  <span className="ml-2 text-sm text-gray-500">
                    (Level: {val})
                  </span>
                </div>
                <button
                  type="button"
                  className="text-red-600 font-bold"
                  onClick={() => removeSkill(key)}
                >
                  ×
                </button>
              </div>
            ))}
            {Object.keys(formData.skills).length === 0 && (
              <p className="text-gray-500 text-sm italic">
                No skills added yet.
              </p>
            )}
          </div>
        </div>
      </div>
    ),

    4: (
      <div className="space-y-6">
        <div className="text-center">
          <Globe className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold">Privacy Settings</h3>
        </div>

        <div className="space-y-4">
          <div className="p-4 border rounded-lg flex justify-between items-center">
            <div>
              <Label>Public Profile</Label>
              <p className="text-sm text-muted-foreground">
                Allow others to see your profile.
              </p>
            </div>
            <Switch
              checked={formData.metadata.privacy.profile_visible}
              onCheckedChange={(v) =>
                setFormData((prev) => ({
                  ...prev,
                  metadata: {
                    ...prev.metadata,
                    privacy: {
                      ...prev.metadata.privacy,
                      profile_visible: v,
                    },
                  },
                }))
              }
            />
          </div>

          <div className="p-4 border rounded-lg flex justify-between items-center">
            <div>
              <Label>Show Email</Label>
              <p className="text-sm text-muted-foreground">
                Allow others to contact you directly.
              </p>
            </div>
            <Switch
              checked={formData.metadata.privacy.email_visible}
              onCheckedChange={(v) =>
                setFormData((prev) => ({
                  ...prev,
                  metadata: {
                    ...prev.metadata,
                    privacy: {
                      ...prev.metadata.privacy,
                      email_visible: v,
                    },
                  },
                }))
              }
            />
          </div>

          <div className="p-4 border rounded-lg flex justify-between items-center">
            <div>
              <Label>Show Graduation Year</Label>
            </div>
            <Switch
              checked={formData.metadata.privacy.graduation_year_visible}
              onCheckedChange={(v) =>
                setFormData((prev) => ({
                  ...prev,
                  metadata: {
                    ...prev.metadata,
                    privacy: {
                      ...prev.metadata.privacy,
                      graduation_year_visible: v,
                    },
                  },
                }))
              }
            />
          </div>
        </div>
      </div>
    ),
  };

  /* ------------------------- RENDER ------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative w-24 h-24">
              <Image
                src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/public/Assets/logo.png`}
                alt="Logo"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
          <CardTitle className="text-2xl">
            Complete Your Profile
          </CardTitle>
          <CardDescription>
            {fromInvite === "invite"
              ? "Welcome! Just a few details to finish setting up your alumni profile."
              : "Your alumni profile is almost ready!"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {StepIndicator}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (currentStep === 4 && !saving) {
                void handleSubmit();
              }
            }}
          >
            {StepContent[currentStep]}

            <div className="flex justify-between mt-8 gap-4">
              <Button
                type="button"
                variant="outline"
                disabled={currentStep === 1 || saving}
                onClick={handlePrevious}
                className="min-w-[100px]"
              >
                Previous
              </Button>

              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="min-w-[100px]"
                  disabled={saving}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={saving}
                  className="min-w-[150px]"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Complete Profile"
                  )}
                </Button>
              )}
            </div>

            <p className="text-center mt-4 text-sm text-muted-foreground">
              Step {currentStep} of 4
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
