"use client";

import { useState, useEffect, Suspense, JSX } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { updateProfileAction } from "@/app/actions/updateProfileAction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  AlertCircle,
  User,
  GraduationCap,
  Briefcase,
  Link2,
  School,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

// Removed dynamic export

type UserRole = "alumni" | "student";

const STEPS_ALUMNI = ["Basic Info", "Education", "Professional", "Social & Skills"];
const STEPS_STUDENT = ["Basic Info", "Education", "Career Goals", "Social & Skills"];

const countries = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "IN", name: "India" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "SG", name: "Singapore" },
  { code: "BR", name: "Brazil" },
];

const industries = [
  "Technology", "Healthcare", "Finance", "Education", "Manufacturing",
  "Consulting", "Marketing", "Engineering", "Research", "Government",
  "Non-profit", "Entrepreneurship", "Real Estate", "Legal", "Arts & Entertainment", "Other",
];

const graduationYears = Array.from({ length: 60 }, (_, i) => new Date().getFullYear() - i);
const futureYears = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);

function MemberCompleteProfileContent() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [role, setRole] = useState<UserRole>("alumni");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    headline: "",
    bio: "",
    city: "",
    countryCode: "",
    // Education
    degree: "",
    major: "",
    minor: "",
    graduationYear: new Date().getFullYear(),
    enrollmentYear: new Date().getFullYear(),
    expectedGraduation: new Date().getFullYear() + 3,
    // Professional (alumni)
    currentCompany: "",
    currentTitle: "",
    industry: "",
    yearsOfExperience: 0,
    isOpenToWork: false,
    isMentorAvailable: false,
    // Goals (student)
    isSeekingInternship: false,
    isSeekingFulltime: false,
    isSeekingMentorship: false,
    // Social
    linkedinUrl: "",
    githubUrl: "",
    twitterUrl: "",
    websiteUrl: "",
    // Skills
    skills: [] as Array<{ name: string; proficiencyLevel: number }>,
  });

  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.replace("/"); return; }
    setForm((prev) => ({
      ...prev,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
    }));
  }, [isLoaded, user, router]);

  const set = (key: keyof typeof form, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const STEPS = role === "alumni" ? STEPS_ALUMNI : STEPS_STUDENT;
  const maxSteps = STEPS.length;

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!form.firstName.trim()) e.firstName = "First name is required";
      if (!form.lastName.trim()) e.lastName = "Last name is required";
    }
    if (s === 2 && role === "alumni") {
      if (!form.degree.trim()) e.degree = "Degree is required";
      if (!form.major.trim()) e.major = "Major / Field of study is required";
    }
    if (s === 2 && role === "student") {
      if (!form.major.trim()) e.major = "Major / Field of study is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => validate(step) && setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  const addSkill = () => {
    const name = skillInput.trim();
    if (!name) return;
    if (form.skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Skill already added");
      return;
    }
    set("skills", [...form.skills, { name, proficiencyLevel: 7 }]);
    setSkillInput("");
  };

  const handleSubmit = async () => {
    if (!validate(step)) return;
    setSaving(true);
    try {
      const result = await updateProfileAction({
        firstName: form.firstName,
        lastName: form.lastName,
        headline: form.headline || null,
        bio: form.bio || null,
        city: form.city || null,
        countryCode: form.countryCode || null,
        degree: form.degree || undefined,
        major: form.major || undefined,
        minor: form.minor || undefined,
        graduationYear: role === "alumni" ? form.graduationYear : null,
        enrollmentYear: role === "student" ? form.enrollmentYear : null,
        expectedGraduation: role === "student" ? form.expectedGraduation : null,
        company: form.currentCompany || null,
        currentTitle: form.currentTitle || null,
        industry: form.industry || null,
        yearsOfExperience: form.yearsOfExperience,
        isOpenToWork: form.isOpenToWork,
        isMentorAvailable: form.isMentorAvailable,
        isSeekingInternship: form.isSeekingInternship,
        isSeekingFulltime: form.isSeekingFulltime,
        isSeekingMentorship: form.isSeekingMentorship,
        linkedinUrl: form.linkedinUrl || null,
        githubUrl: form.githubUrl || null,
        twitterUrl: form.twitterUrl || null,
        websiteUrl: form.websiteUrl || null,
        skills: form.skills,
      });

      if (result.success) {
        toast.success("Profile saved! Welcome to AlumniConnect 🎉");
        await new Promise((r) => setTimeout(r, 600));
        router.replace("/onboarding");
      } else {
        toast.error("Failed to save profile. Please try again.");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const stepContent: Record<number, JSX.Element> = {
    1: (
      <div className="space-y-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <User className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Basic Information</h2>
            <p className="text-sm text-slate-500">Tell us a little about yourself.</p>
          </div>
        </div>

        {/* Role Toggle */}
        <div>
          <Label className="mb-2 block">I am joining as…</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("alumni")}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                role === "alumni"
                  ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
              }`}
            >
              <GraduationCap className={`h-6 w-6 mb-2 ${role === "alumni" ? "text-indigo-600" : "text-slate-400"}`} />
              <div className="font-semibold text-sm">Alumni</div>
              <div className="text-xs text-slate-500 mt-0.5">I have graduated</div>
            </button>
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                role === "student"
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
              }`}
            >
              <School className={`h-6 w-6 mb-2 ${role === "student" ? "text-blue-600" : "text-slate-400"}`} />
              <div className="font-semibold text-sm">Student</div>
              <div className="text-xs text-slate-500 mt-0.5">Currently studying</div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>First Name *</Label>
            <Input
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              placeholder="John"
              className={errors.firstName ? "border-red-400" : ""}
            />
            {errors.firstName && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.firstName}</p>}
          </div>
          <div>
            <Label>Last Name *</Label>
            <Input
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              placeholder="Doe"
              className={errors.lastName ? "border-red-400" : ""}
            />
            {errors.lastName && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.lastName}</p>}
          </div>
        </div>

        <div>
          <Label>Professional Headline</Label>
          <Input value={form.headline} onChange={(e) => set("headline", e.target.value)} placeholder="e.g., Software Engineer at Google | MIT '22" />
        </div>

        <div>
          <Label>Short Bio</Label>
          <Textarea rows={3} value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Tell people a bit about yourself and what you're passionate about…" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>City</Label>
            <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="New York" />
          </div>
          <div>
            <Label>Country</Label>
            <Select value={form.countryCode} onValueChange={(v) => set("countryCode", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {countries.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    ),

    2: (
      <div className="space-y-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Education</h2>
            <p className="text-sm text-slate-500">
              {role === "alumni" ? "Your academic background." : "Your current studies."}
            </p>
          </div>
        </div>

        {role === "alumni" && (
          <div>
            <Label>Degree *</Label>
            <Input value={form.degree} onChange={(e) => set("degree", e.target.value)} placeholder="e.g., B.Sc. Computer Science, MBA" className={errors.degree ? "border-red-400" : ""} />
            {errors.degree && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.degree}</p>}
          </div>
        )}

        <div>
          <Label>Major / Field of Study *</Label>
          <Input value={form.major} onChange={(e) => set("major", e.target.value)} placeholder="e.g., Computer Science, Economics" className={errors.major ? "border-red-400" : ""} />
          {errors.major && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.major}</p>}
        </div>

        <div>
          <Label>Minor (Optional)</Label>
          <Input value={form.minor} onChange={(e) => set("minor", e.target.value)} placeholder="e.g., Mathematics, Data Science" />
        </div>

        {role === "alumni" ? (
          <div>
            <Label>Graduation Year</Label>
            <Select value={String(form.graduationYear)} onValueChange={(v) => set("graduationYear", Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {graduationYears.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Enrollment Year</Label>
              <Select value={String(form.enrollmentYear)} onValueChange={(v) => set("enrollmentYear", Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {graduationYears.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Expected Graduation</Label>
              <Select value={String(form.expectedGraduation)} onValueChange={(v) => set("expectedGraduation", Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {futureYears.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    ),

    3: (
      <div className="space-y-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Briefcase className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {role === "alumni" ? "Professional Experience" : "Career Goals"}
            </h2>
            <p className="text-sm text-slate-500">
              {role === "alumni" ? "Your current work." : "What are you looking for?"}
            </p>
          </div>
        </div>

        {role === "alumni" ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Current Company</Label>
                <Input value={form.currentCompany} onChange={(e) => set("currentCompany", e.target.value)} placeholder="Google" />
              </div>
              <div>
                <Label>Current Title</Label>
                <Input value={form.currentTitle} onChange={(e) => set("currentTitle", e.target.value)} placeholder="Software Engineer" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Industry</Label>
                <Select value={form.industry} onValueChange={(v) => set("industry", v)}>
                  <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                  <SelectContent>
                    {industries.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Years of Experience</Label>
                <Input type="number" min={0} max={50} value={form.yearsOfExperience} onChange={(e) => set("yearsOfExperience", Number(e.target.value))} />
              </div>
            </div>
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div>
                  <div className="text-sm font-medium">Open to Work</div>
                  <div className="text-xs text-slate-500">Let others know you're looking for opportunities</div>
                </div>
                <Switch checked={form.isOpenToWork} onCheckedChange={(v) => set("isOpenToWork", v)} />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div>
                  <div className="text-sm font-medium">Available for Mentorship</div>
                  <div className="text-xs text-slate-500">Guide students with your experience</div>
                </div>
                <Switch checked={form.isMentorAvailable} onCheckedChange={(v) => set("isMentorAvailable", v)} />
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Select all that apply to help us connect you with the right opportunities.</p>
            {[
              { key: "isSeekingInternship", label: "Seeking Internship", desc: "Looking for internship opportunities" },
              { key: "isSeekingFulltime", label: "Seeking Full-time Role", desc: "Looking for full-time positions after graduation" },
              { key: "isSeekingMentorship", label: "Seeking Mentorship", desc: "Want to connect with alumni mentors" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div>
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-xs text-slate-500">{desc}</div>
                </div>
                <Switch checked={(form as any)[key]} onCheckedChange={(v) => set(key as any, v)} />
              </div>
            ))}
          </div>
        )}
      </div>
    ),

    4: (
      <div className="space-y-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Link2 className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Social & Skills</h2>
            <p className="text-sm text-slate-500">Connect your online presence and showcase your expertise.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>LinkedIn</Label>
            <Input value={form.linkedinUrl} onChange={(e) => set("linkedinUrl", e.target.value)} placeholder="linkedin.com/in/you" />
          </div>
          <div>
            <Label>GitHub</Label>
            <Input value={form.githubUrl} onChange={(e) => set("githubUrl", e.target.value)} placeholder="github.com/you" />
          </div>
          <div>
            <Label>Twitter / X</Label>
            <Input value={form.twitterUrl} onChange={(e) => set("twitterUrl", e.target.value)} placeholder="x.com/you" />
          </div>
          <div>
            <Label>Website</Label>
            <Input value={form.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)} placeholder="yoursite.com" />
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-5">
          <Label className="mb-3 block">Skills (Optional)</Label>
          <div className="flex gap-2 mb-3">
            <Input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              placeholder="e.g., React, Python, Leadership"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={addSkill}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.skills.map((s, i) => (
              <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
                {s.name}
                <button onClick={() => set("skills", form.skills.filter((_, j) => j !== i))} className="text-indigo-400 hover:text-red-500 transition-colors">×</button>
              </span>
            ))}
            {form.skills.length === 0 && <p className="text-sm text-slate-400 italic">No skills added yet</p>}
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-indigo-950/20 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4 ${
            role === "alumni"
              ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
              : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
          }`}>
            {role === "alumni" ? <GraduationCap className="h-3.5 w-3.5" /> : <School className="h-3.5 w-3.5" />}
            {role === "alumni" ? "Alumni Member" : "Student Member"}
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Complete Your Profile</h1>
          <p className="text-slate-500 mt-2">Step {step} of {maxSteps} — {STEPS[step - 1]}</p>
        </div>

        {/* Step Progress */}
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((label, i) => {
            const num = i + 1;
            const done = num < step;
            const active = num === step;
            return (
              <div key={label} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all flex-shrink-0 ${
                  done ? "bg-green-500 text-white" : active ? "bg-indigo-600 text-white ring-4 ring-indigo-200 dark:ring-indigo-900" : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                }`}>
                  {done ? <CheckCircle2 className="h-4 w-4" /> : num}
                </div>
                {i < maxSteps - 1 && (
                  <div className={`flex-1 h-1 mx-1 rounded-full transition-all ${done ? "bg-green-400" : "bg-slate-200 dark:bg-slate-700"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
          {stepContent[step]}

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <Button variant="outline" onClick={back} className="flex-1" disabled={saving}>
                Back
              </Button>
            )}
            {step < maxSteps ? (
              <Button onClick={next} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="flex-1 bg-green-600 hover:bg-green-700" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <><CheckCircle2 className="h-4 w-4 mr-2" /> Finish & Join Network</>
                )}
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Need help? Contact <span className="text-indigo-600">support@alumniconnect.com</span>
        </p>
      </div>
    </div>
  );
}

export default function MemberCompleteProfile() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>}>
      <MemberCompleteProfileContent />
    </Suspense>
  );
}
