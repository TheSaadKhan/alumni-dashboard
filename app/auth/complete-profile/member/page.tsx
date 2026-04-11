"use client";

import { useState, useEffect, Suspense, JSX } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { updateProfileAction } from "@/app/actions/updateProfileAction";
import { searchOrganizationsAction, createOrganizationAction } from "@/app/actions/createOrganization";
import { completeOnboarding } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  AlertCircle,
  User,
  GraduationCap,
  Briefcase,
  School,
  ArrowRight,
  Globe,
  Search,
  Building2
} from "lucide-react";
import { Country, State, City } from 'country-state-city';
import { toast } from "sonner";
import Image from "next/image";

type UserRole = "alumni" | "student";

const STEPS_ALUMNI = ["Identity", "Education", "Career", "Institution"];
const STEPS_STUDENT = ["Identity", "Studies", "Goals", "Institution"];

const graduationYears = Array.from({ length: 60 }, (_, i) => new Date().getFullYear() - i);
const futureYears = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() + i);

function MemberCompleteProfileContent() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { profile, organization, loading, refreshProfile } = useAuthProfile();
  
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
    stateCode: "",
    countryCode: "IN",
    degree: "",
    major: "",
    minor: "",
    graduationYear: new Date().getFullYear(),
    enrollmentYear: new Date().getFullYear(),
    expectedGraduation: new Date().getFullYear() + 3,
    currentCompany: "",
    currentTitle: "",
    industry: "",
    yearsOfExperience: 0,
    isOpenToWork: false,
    isMentorAvailable: false,
    isSeekingInternship: false,
    isSeekingFulltime: false,
    isSeekingMentorship: false,
    linkedinUrl: "",
    githubUrl: "",
    organizationId: "",
    selectedOrgName: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [dbMatches, setDbMatches] = useState<any[]>([]);
  const [apiMatches, setApiMatches] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const countriesList = Country.getAllCountries();
  const [statesList, setStatesList] = useState<any[]>([]);
  const [citiesList, setCitiesList] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoaded || loading) return;
    if (!user) { router.replace("/"); return; }
    
    // If onboarding is already completed, get them out of here
    if (profile?.onboardingCompleted && profile?.organizationId) {
      if (organization?.slug) {
        router.push(`/organization/${organization.slug}/dashboard`);
      }
      return; // Return early regardless of slug presence to prevent fall-through to Step 1
    }

    setForm((prev) => ({
      ...prev,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
    }));
  }, [isLoaded, loading, user, profile, organization, router]);

  useEffect(() => {
    if (form.countryCode) setStatesList(State.getStatesOfCountry(form.countryCode));
  }, [form.countryCode]);

  useEffect(() => {
    if (form.countryCode && form.stateCode) setCitiesList(City.getCitiesOfState(form.countryCode, form.stateCode));
  }, [form.countryCode, form.stateCode]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm.length >= 2 && searchTerm !== form.selectedOrgName) {
        setSearching(true);
        setShowDropdown(true);
        try {
          const dbRes = await searchOrganizationsAction(searchTerm);
          setDbMatches(dbRes.organizations || []);
          const apiRes = await fetch(`http://universities.hipolabs.com/search?name=${encodeURIComponent(searchTerm)}`);
          if (apiRes.ok) {
            const apiData = await apiRes.json();
            const dbNames = new Set(dbRes.organizations.map((o: any) => o.name.toLowerCase()));
            setApiMatches(apiData.filter((uni: any) => !dbNames.has(uni.name.toLowerCase())).slice(0, 5).map((uni: any) => ({
                id: `api-${uni.name}`,
                name: uni.name,
                isApi: true
            })));
          }
        } finally {
          setSearching(false);
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, form.selectedOrgName]);

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!form.firstName.trim()) e.firstName = "First name is required";
      if (!form.lastName.trim()) e.lastName = "Last name is required";
    }
    if (s === 4 && !form.organizationId) e.org = "Selection required";
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

      let finalOrgId = form.organizationId;
      if (finalOrgId.startsWith("api-")) {
        const res = await createOrganizationAction({
          name: form.selectedOrgName,
          type: "college"
        });
        finalOrgId = res.organizationId;
      }

      const onboardingData = new FormData();
      onboardingData.set("userType", role);
      onboardingData.set("firstName", form.firstName);
      onboardingData.set("lastName", form.lastName);
      onboardingData.set("organizationId", finalOrgId);
      if (role === "alumni") onboardingData.set("graduationYear", String(form.graduationYear));
      else onboardingData.set("expectedGraduation", String(form.expectedGraduation));

      // 1. Critical: Perform the server update
      const result = await completeOnboarding(onboardingData);
      
      if (result.success) {
         toast.success("Profile saved! Initializing dashboard...");
         // 2. Critical: Refresh the local session BEFORE navigating
         await refreshProfile();
         // 3. Navigate away
         router.push(`/organization/${result.slug}/dashboard`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to complete setup");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof typeof form, value: any) => setForm(p => ({ ...p, [key]: value }));
  const STEPS = role === "alumni" ? STEPS_ALUMNI : STEPS_STUDENT;
  const maxSteps = STEPS.length;

  const stepContent: Record<number, JSX.Element> = {
    1: (
        <div className="space-y-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <User className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Identity</h2>
              <p className="text-sm text-slate-500">Pick your role.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button type="button" onClick={() => setRole("alumni")} className={`p-4 rounded-2xl border-2 text-left transition-all ${role === "alumni" ? "border-indigo-600 bg-indigo-50" : "border-slate-100"}`}>
               <GraduationCap className="h-6 w-6 mb-2" />
               <div className="font-bold text-sm">Alumni</div>
            </button>
            <button type="button" onClick={() => setRole("student")} className={`p-4 rounded-2xl border-2 text-left transition-all ${role === "student" ? "border-blue-600 bg-blue-50" : "border-slate-100"}`}>
               <School className="h-6 w-6 mb-2" />
               <div className="font-bold text-sm">Student</div>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>First Name</Label><Input value={form.firstName} onChange={e => set("firstName", e.target.value)} /></div>
            <div className="space-y-2"><Label>Last Name</Label><Input value={form.lastName} onChange={e => set("lastName", e.target.value)} /></div>
          </div>
          <div className="space-y-2">
             <Label>Country</Label>
             <Select value={form.countryCode} onValueChange={v => set("countryCode", v)}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                   {countriesList.map(c => <SelectItem key={c.isoCode} value={c.isoCode}>{c.name}</SelectItem>)}
                </SelectContent>
             </Select>
          </div>
        </div>
    ),
    2: (
        <div className="space-y-5">
           <h2 className="text-xl font-bold">Academic</h2>
           <div className="space-y-2"><Label>Major</Label><Input value={form.major} onChange={e => set("major", e.target.value)} /></div>
           {role === 'alumni' ? (
              <div className="space-y-2"><Label>Graduation Year</Label>
                 <Select value={String(form.graduationYear)} onValueChange={v => set("graduationYear", Number(v))}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{graduationYears.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                 </Select>
              </div>
           ) : (
              <div className="space-y-2"><Label>Expected Graduation</Label>
                 <Select value={String(form.expectedGraduation)} onValueChange={v => set("expectedGraduation", Number(v))}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{futureYears.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                 </Select>
              </div>
           )}
        </div>
    ),
    3: (
        <div className="space-y-5">
           <h2 className="text-xl font-bold">Professional</h2>
           <div className="space-y-2"><Label>Company</Label><Input value={form.currentCompany} onChange={e => set("currentCompany", e.target.value)} /></div>
           <div className="space-y-2"><Label>Bio</Label><Textarea value={form.bio} onChange={e => set("bio", e.target.value)} /></div>
        </div>
    ),
    4: (
        <div className="space-y-5">
           <h2 className="text-xl font-bold">Institution</h2>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-12 rounded-xl" placeholder="Search university..." />
              {showDropdown && (
                <div className="absolute z-50 w-full mt-2 bg-white border rounded-2xl shadow-2xl p-2 space-y-1">
                   {dbMatches.map(org => (
                      <button key={org.id} onClick={() => { set("organizationId", org.id); set("selectedOrgName", org.name); setSearchTerm(org.name); setShowDropdown(false); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl flex items-center gap-2">
                         <Building2 className="h-4 w-4 text-indigo-500" />
                         <span className="text-sm font-semibold">{org.name}</span>
                      </button>
                   ))}
                   {apiMatches.map(org => (
                      <button key={org.id} onClick={() => { set("organizationId", org.id); set("selectedOrgName", org.name); setSearchTerm(org.name); setShowDropdown(false); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl flex items-center gap-2">
                         <Globe className="h-4 w-4 text-blue-500" />
                         <span className="text-sm font-semibold">{org.name}</span>
                      </button>
                   ))}
                </div>
              )}
           </div>
           {form.selectedOrgName && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-2">
                 <CheckCircle2 className="h-5 w-5 text-green-600" />
                 <span className="text-sm font-bold">{form.selectedOrgName}</span>
              </div>
           )}
        </div>
    )
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl p-10">
        <div className="mb-8 h-1 bg-slate-100 rounded-full flex gap-1">
           {Array.from({ length: maxSteps }).map((_, i) => (
              <div key={i} className={`flex-1 rounded-full ${step > i ? 'bg-indigo-600' : 'bg-transparent'}`} />
           ))}
        </div>
        {stepContent[step]}
        <div className="flex gap-4 mt-10">
          {step > 1 && <Button variant="ghost" onClick={() => setStep(s => s - 1)} className="flex-1">Back</Button>}
          {step < maxSteps ? (
            <Button onClick={() => validate(step) && setStep(s => s + 1)} className="flex-1 bg-indigo-600 text-white">Continue</Button>
          ) : (
            <Button onClick={handleSubmit} className="flex-1 bg-green-600 text-white" disabled={saving}>Finish Setup</Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MemberCompleteProfile() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MemberCompleteProfileContent />
    </Suspense>
  );
}
