"use client";

import { useState, useEffect, Suspense, JSX } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { updateProfileAction } from "@/app/actions/updateProfileAction";
import { completeOnboarding } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthProfile } from "@/context/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  CheckCircle2,
  User,
  GraduationCap,
  Briefcase,
  School,
  Building2,
  ShieldCheck,
  Lock,
  Sparkles,
  MapPin,
  BookOpen,
} from "lucide-react";
import { Country, State } from "country-state-city";
import { toast } from "sonner";

type UserRole = "alumni" | "student";

const graduationYears = Array.from({ length: 60 }, (_, i) => new Date().getFullYear() - i);
const futureYears = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() + i);

interface InviteInfo {
  organizationId: string;
  organizationName: string;
  organizationLogo?: string | null;
  organizationSlug: string;
  roleName: string;
  roleSlug: string;
  userType: string;
  email: string;
}

const STEPS_WITH_INVITE = ["Profile", "Academic", "Professional"];
const STEPS_ALUMNI_FREE = ["Profile", "Academic", "Professional", "Institution"];
const STEPS_STUDENT_FREE = ["Profile", "Studies", "Goals", "Institution"];

function MemberCompleteProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const { profile, organization, loading, refreshProfile } = useAuthProfile();

  const inviteToken = searchParams.get("invite_token");

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [role, setRole] = useState<UserRole>("alumni");
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [inviteLoading, setInviteLoading] = useState(!!inviteToken);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    headline: "",
    bio: "",
    city: "",
    stateCode: "",
    countryCode: "IN",
    degree: "",
    major: "",
    graduationYear: new Date().getFullYear(),
    enrollmentYear: new Date().getFullYear(),
    expectedGraduation: new Date().getFullYear() + 3,
    currentCompany: "",
    currentTitle: "",
    industry: "",
    organizationId: "",
    selectedOrgName: "",
  });

  const countriesList = Country.getAllCountries();
  const [statesList, setStatesList] = useState<any[]>([]);

  // Fetch invite details
  useEffect(() => {
    if (!inviteToken) return;
    setInviteLoading(true);
    fetch(`/api/invitations/preview?token=${inviteToken}`)
      .then(r => r.json())
      .then(data => {
        if (data.organizationName) {
          setInviteInfo({
            organizationId: data.organizationId || "",
            organizationName: data.organizationName,
            organizationLogo: data.organizationLogo,
            organizationSlug: data.organizationSlug,
            roleName: data.roleName,
            roleSlug: data.roleSlug,
            userType: data.userType,
            email: data.email,
          });
          // Lock the role to what was invited
          if (data.userType === "student") setRole("student");
          else setRole("alumni");

          setForm(prev => ({
            ...prev,
            organizationId: data.organizationSlug,
            selectedOrgName: data.organizationName,
          }));
        }
      })
      .catch(() => {})
      .finally(() => setInviteLoading(false));
  }, [inviteToken]);

  useEffect(() => {
    if (!isLoaded || loading) return;
    if (!user) { router.replace("/"); return; }

    if (profile?.onboardingCompleted && profile?.organizationId) {
      if (organization?.slug) {
        router.push(`/organization/${organization.slug}/dashboard`);
      }
      return;
    }

    setForm(prev => ({
      ...prev,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
    }));
  }, [isLoaded, loading, user, profile, organization, router]);

  useEffect(() => {
    if (form.countryCode) setStatesList(State.getStatesOfCountry(form.countryCode));
  }, [form.countryCode]);

  const STEPS = inviteToken
    ? STEPS_WITH_INVITE
    : role === "alumni"
    ? STEPS_ALUMNI_FREE
    : STEPS_STUDENT_FREE;

  const maxSteps = STEPS.length;

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!form.firstName.trim()) e.firstName = "First name is required";
      if (!form.lastName.trim()) e.lastName = "Last name is required";
    }
    if (s === maxSteps && !inviteToken && !form.organizationId) {
      e.org = "Please select an institution";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate(maxSteps)) return;
    setSaving(true);
    try {
      await updateProfileAction({
        firstName: form.firstName,
        lastName: form.lastName,
        headline: form.headline || null,
        bio: form.bio || null,
        city: form.city || null,
        countryCode: form.countryCode,
        stateCode: form.stateCode || null,
        graduationYear: role === "alumni" ? form.graduationYear : null,
        expectedGraduation: role === "student" ? form.expectedGraduation : null,
        company: form.currentCompany || null,
        currentTitle: form.currentTitle || null,
        industry: form.industry || null,
        major: form.major || undefined,
        degree: form.degree || undefined,
      });

      const onboardingData = new FormData();
      onboardingData.set("userType", role);
      onboardingData.set("firstName", form.firstName);
      onboardingData.set("lastName", form.lastName);
      onboardingData.set("organizationId", form.organizationId);
      if (inviteToken) onboardingData.set("inviteToken", inviteToken);
      if (role === "alumni") onboardingData.set("graduationYear", String(form.graduationYear));
      else onboardingData.set("expectedGraduation", String(form.expectedGraduation));

      const result = await completeOnboarding(onboardingData);

      if (result.success) {
        toast.success("🎉 Profile complete! Welcome to your dashboard.");
        await refreshProfile();
        router.push(`/organization/${result.slug}/dashboard`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to complete setup");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof typeof form, value: any) => setForm(p => ({ ...p, [key]: value }));

  // Step contents
  const stepContent: Record<number, JSX.Element> = {
    1: (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Your Identity</h2>
            <p className="text-sm text-slate-400">Tell us who you are</p>
          </div>
        </div>

        {/* Role picker — locked if invite */}
        {inviteInfo ? (
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center gap-3">
            <Lock className="h-5 w-5 text-indigo-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide">Role assigned by invitation</p>
              <p className="font-bold text-slate-800 capitalize">{inviteInfo.roleName}</p>
            </div>
          </div>
        ) : (
          <div>
            <Label className="text-sm font-semibold text-slate-600 mb-2 block">I am a…</Label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setRole("alumni")}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${role === "alumni" ? "border-indigo-500 bg-indigo-50 shadow-md" : "border-slate-200 hover:border-slate-300 bg-white"}`}>
                <GraduationCap className={`h-6 w-6 mb-2 ${role === "alumni" ? "text-indigo-600" : "text-slate-400"}`} />
                <div className={`font-bold text-sm ${role === "alumni" ? "text-indigo-700" : "text-slate-700"}`}>Alumni</div>
                <div className="text-xs text-slate-400 mt-0.5">Graduated</div>
              </button>
              <button type="button" onClick={() => setRole("student")}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${role === "student" ? "border-blue-500 bg-blue-50 shadow-md" : "border-slate-200 hover:border-slate-300 bg-white"}`}>
                <School className={`h-6 w-6 mb-2 ${role === "student" ? "text-blue-600" : "text-slate-400"}`} />
                <div className={`font-bold text-sm ${role === "student" ? "text-blue-700" : "text-slate-700"}`}>Student</div>
                <div className="text-xs text-slate-400 mt-0.5">Enrolled</div>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-600">First Name</Label>
            <Input value={form.firstName} onChange={e => set("firstName", e.target.value)}
              className="h-11 rounded-xl border-slate-200" placeholder="John" />
            {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-600">Last Name</Label>
            <Input value={form.lastName} onChange={e => set("lastName", e.target.value)}
              className="h-11 rounded-xl border-slate-200" placeholder="Doe" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-600">Headline <span className="text-slate-400 font-normal">(optional)</span></Label>
          <Input value={form.headline} onChange={e => set("headline", e.target.value)}
            className="h-11 rounded-xl border-slate-200" placeholder="e.g. Software Engineer at Google" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-600 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Country</Label>
          <Select value={form.countryCode} onValueChange={v => set("countryCode", v)}>
            <SelectTrigger className="h-11 rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
            <SelectContent>
              {countriesList.map(c => <SelectItem key={c.isoCode} value={c.isoCode}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {statesList.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-600">State / Province <span className="text-slate-400 font-normal">(optional)</span></Label>
            <Select value={form.stateCode} onValueChange={v => set("stateCode", v)}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200"><SelectValue placeholder="Select state..." /></SelectTrigger>
              <SelectContent>
                {statesList.map(s => <SelectItem key={s.isoCode} value={s.isoCode}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    ),

    2: (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Academic Background</h2>
            <p className="text-sm text-slate-400">Your education details</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-600">Field of Study / Major</Label>
          <Input value={form.major} onChange={e => set("major", e.target.value)}
            className="h-11 rounded-xl border-slate-200" placeholder="e.g. Computer Science" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-600">Degree</Label>
          <Select value={form.degree} onValueChange={v => set("degree", v)}>
            <SelectTrigger className="h-11 rounded-xl border-slate-200"><SelectValue placeholder="Select degree..." /></SelectTrigger>
            <SelectContent>
              {["Bachelor's", "Master's", "PhD", "MBA", "Associate's", "Other"].map(d => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {role === "alumni" ? (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-600">Graduation Year</Label>
            <Select value={String(form.graduationYear)} onValueChange={v => set("graduationYear", Number(v))}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
              <SelectContent>{graduationYears.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-600">Expected Graduation</Label>
            <Select value={String(form.expectedGraduation)} onValueChange={v => set("expectedGraduation", Number(v))}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
              <SelectContent>{futureYears.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
      </div>
    ),

    3: (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Professional Info</h2>
            <p className="text-sm text-slate-400">Your career details (optional)</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-600">Current Company</Label>
          <Input value={form.currentCompany} onChange={e => set("currentCompany", e.target.value)}
            className="h-11 rounded-xl border-slate-200" placeholder="e.g. Google, Self-employed" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-600">Job Title</Label>
          <Input value={form.currentTitle} onChange={e => set("currentTitle", e.target.value)}
            className="h-11 rounded-xl border-slate-200" placeholder="e.g. Software Engineer" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-600">Bio <span className="text-slate-400 font-normal">(optional)</span></Label>
          <Textarea value={form.bio} onChange={e => set("bio", e.target.value)}
            className="rounded-xl border-slate-200 resize-none" rows={3}
            placeholder="A brief introduction about yourself..." />
        </div>
      </div>
    ),
  };

  // Step 4 only for free-flow (no invite): institution picker
  if (!inviteToken) {
    stepContent[4] = (
      <div className="space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Your Institution</h2>
            <p className="text-sm text-slate-400">Search and select your university</p>
          </div>
        </div>

        {/* Institution search handled by the free-flow version */}
        <div className="p-4 bg-slate-50 rounded-2xl text-center text-slate-400 text-sm">
          Institution search available in the free-signup flow.
        </div>
      </div>
    );
  }

  if (inviteLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto" />
          <p className="text-slate-400">Loading your invitation details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          {inviteInfo ? (
            <>
              <div className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold mb-3">
                <ShieldCheck className="h-3.5 w-3.5" />
                Invited by {inviteInfo.organizationName}
              </div>
              <h1 className="text-2xl font-bold text-slate-800">Complete Your Profile</h1>
              <p className="text-slate-400 text-sm mt-1">Just a few steps to get started</p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold mb-3">
                <Sparkles className="h-3.5 w-3.5" />
                Getting Started
              </div>
              <h1 className="text-2xl font-bold text-slate-800">Set Up Your Profile</h1>
              <p className="text-slate-400 text-sm mt-1">Connect with your alumni network</p>
            </>
          )}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
          {/* Progress Bar */}
          <div className="h-1.5 bg-slate-100 flex">
            {Array.from({ length: maxSteps }).map((_, i) => (
              <div key={i}
                className={`flex-1 transition-all duration-500 ${step > i ? "bg-gradient-to-r from-indigo-500 to-purple-600" : "bg-transparent"}`}
              />
            ))}
          </div>

          {/* Step Labels */}
          <div className="flex px-6 pt-4 pb-0 gap-1">
            {STEPS.map((label, i) => (
              <div key={i} className={`flex-1 text-center text-xs font-medium pb-1 border-b-2 transition-colors ${step === i + 1 ? "border-indigo-500 text-indigo-600" : step > i + 1 ? "border-green-400 text-green-600" : "border-transparent text-slate-300"}`}>
                {step > i + 1 ? <CheckCircle2 className="h-3.5 w-3.5 inline" /> : label}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="px-6 sm:px-8 py-6">
            {stepContent[step]}
          </div>

          {/* Invite Org Banner (at bottom if invite) */}
          {inviteInfo && step === maxSteps && (
            <div className="mx-6 sm:mx-8 mb-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl flex items-center gap-3">
              <Building2 className="h-5 w-5 text-indigo-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wide">You will be joining</p>
                <p className="font-bold text-slate-800">{inviteInfo.organizationName}</p>
                <p className="text-xs text-slate-500">Role: {inviteInfo.roleName}</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="px-6 sm:px-8 pb-6 flex gap-3">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1 h-11 rounded-xl border-slate-200">
                ← Back
              </Button>
            )}
            {step < maxSteps ? (
              <Button onClick={() => validate(step) && setStep(s => s + 1)}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md">
                Continue →
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={saving}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-md">
                {saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Setting up...</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4 mr-2" /> Complete Setup</>
                )}
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Step {step} of {maxSteps}
        </p>
      </div>
    </div>
  );
}

export default function MemberCompleteProfile() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    }>
      <MemberCompleteProfileContent />
    </Suspense>
  );
}
