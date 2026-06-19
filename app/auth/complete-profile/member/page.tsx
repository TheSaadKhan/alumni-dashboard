"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { updateProfileAction } from "@/app/actions/updateProfileAction";
import { completeOnboarding, type OnboardingData } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  MapPin,
  ArrowRight,
  ArrowLeft,
  Search,
  Building2
} from "lucide-react";
import { Country, City } from "country-state-city";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

type UserRole = "alumni" | "student";

function MemberCompleteProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const { profile, organization, loading, refreshProfile } = useAuthProfile();

  const inviteToken = searchParams.get("invite_token");
  const needsOrganization = !inviteToken && !organization?.id;

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<UserRole>("alumni");
  const [orgSearch, setOrgSearch] = useState("");
  const [orgResults, setOrgResults] = useState<Array<{ id: string; name: string; slug: string; logoUrl?: string | null }>>([]);
  const [orgSearching, setOrgSearching] = useState(false);
  const [selectedOrgName, setSelectedOrgName] = useState("");
  
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
    graduationYear: new Date().getFullYear().toString(),
    currentCompany: "",
    currentTitle: "",
    organizationId: "",
  });

  const [citySearch, setCitySearch] = useState("");
  const [filteredCities, setFilteredCities] = useState<any[]>([]);

  // Auto-fill from Clerk
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        firstName: prev.firstName || user.firstName || "",
        lastName: prev.lastName || user.lastName || "",
      }));
    }
  }, [user]);

  // Pre-fill organization from invite or existing context
  useEffect(() => {
    if (organization?.id && !form.organizationId) {
      setForm(prev => ({ ...prev, organizationId: organization.id }));
      setSelectedOrgName(organization.name);
    }
  }, [organization]);

  // Organization search
  useEffect(() => {
    if (!needsOrganization || orgSearch.length < 2) {
      setOrgResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setOrgSearching(true);
      try {
        const res = await fetch(`/api/organizations?search=${encodeURIComponent(orgSearch)}`);
        if (res.ok) {
          const data = await res.json();
          setOrgResults(data.organizations || []);
        } else {
          toast.error("Could not search organizations. Please try again.");
        }
      } catch {
        setOrgResults([]);
        toast.error("Network error while searching organizations.");
      } finally {
        setOrgSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [orgSearch, needsOrganization]);

  // City Search logic
  useEffect(() => {
    if (citySearch.length > 2) {
      const cities = City.getCitiesOfCountry(form.countryCode) || [];
      const filtered = cities
        .filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase()))
        .slice(0, 10);
      setFilteredCities(filtered);
    } else {
      setFilteredCities([]);
    }
  }, [citySearch, form.countryCode]);

  const handleComplete = async () => {
    const orgId = form.organizationId || organization?.id || null;

    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("First and last name are required.");
      setStep(1);
      return;
    }

    if (!inviteToken && !orgId) {
      toast.error("Please select your organization to continue.");
      if (needsOrganization) setStep(orgStep);
      return;
    }

    setSaving(true);
    try {
      const onboardingPayload: OnboardingData = {
        userType: role as any,
        organizationId: orgId,
        inviteToken: inviteToken || null,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        graduationYear: role === "alumni" ? form.graduationYear : null,
        expectedGraduation: role === "student" ? form.graduationYear : null,
        headline: form.headline || null,
        bio: form.bio || null,
        degree: form.degree || null,
        major: form.major || null,
        city: form.city || null,
        countryCode: form.countryCode || null,
        currentCompany: form.currentCompany || null,
        currentTitle: form.currentTitle || null,
      };

      toast.loading("Creating your account...", { id: "onboarding" });

      const res = await completeOnboarding(onboardingPayload);

      if (!res.success) {
        toast.error(res.error || "Failed to complete onboarding", { id: "onboarding" });
        return;
      }

      const profileResult = await updateProfileAction({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        headline: form.headline,
        bio: form.bio,
        degree: form.degree,
        major: form.major,
        city: form.city,
        countryCode: form.countryCode,
        stateCode: form.stateCode,
        ...(role === "student"
          ? { expectedGraduation: parseInt(form.graduationYear) }
          : { graduationYear: parseInt(form.graduationYear) }),
        company: form.currentCompany,
        currentTitle: form.currentTitle,
      });

      if (profileResult && "success" in profileResult && !profileResult.success) {
        toast.warning("Profile saved, but some details could not be updated.", { id: "onboarding" });
      } else {
        toast.success("Profile completed successfully!", { id: "onboarding" });
      }

      await refreshProfile();
      router.push(res.redirectUrl || "/auth/complete-profile");
    } catch (err: any) {
      console.error("Onboarding error:", err);
      toast.error(err?.message || "Something went wrong. Please try again.", { id: "onboarding" });
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
         <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const steps = [
    { title: "Basics", icon: User },
    ...(needsOrganization ? [{ title: "Organization", icon: Building2 }] : []),
    { title: "Location", icon: MapPin },
    { title: "Education", icon: GraduationCap },
    { title: "Work", icon: Briefcase },
  ];

  const locationStep = needsOrganization ? 3 : 2;
  const educationStep = needsOrganization ? 4 : 3;
  const workStep = needsOrganization ? 5 : 4;
  const orgStep = needsOrganization ? 2 : -1;

  const canContinue = () => {
    if (step === 1) return form.firstName.trim() && form.lastName.trim();
    if (step === orgStep) return !!form.organizationId;
    return true;
  };

  const handleNext = () => {
    if (!canContinue()) {
      if (step === 1) toast.error("Enter your first and last name to continue.");
      else if (step === orgStep) toast.error("Select an organization to continue.");
      else toast.error("Please fill in the required fields.");
      return;
    }
    setStep(s => s + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-md mx-auto space-y-8">
        <div className="text-center space-y-2">
           <h1 className="text-2xl font-bold text-slate-900">Complete Profile</h1>
           <p className="text-sm text-slate-500 font-medium">Please provide a few details to get started.</p>
        </div>

        <div className="flex justify-between relative px-4">
           <div className="absolute top-4 left-10 right-10 h-px bg-slate-200" />
           {steps.map((s, i) => (
             <div key={i} className="relative z-10 flex flex-col items-center gap-1">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                  step > i + 1 ? "bg-emerald-500 text-white" : 
                  step === i + 1 ? "bg-blue-600 text-white" : 
                  "bg-white text-slate-300 border border-slate-200"
                }`}>
                   {step > i + 1 ? <CheckCircle2 className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                </div>
                <span className={`text-[10px] font-bold ${step === i + 1 ? "text-blue-600" : "text-slate-400"}`}>
                  {s.title}
                </span>
             </div>
           ))}
        </div>

        <Card className="rounded-xl border border-slate-200 shadow-sm bg-white">
           <CardContent className="p-8">
              {step === 1 && (
                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                         <Label className="text-xs font-semibold text-slate-600">First Name</Label>
                         <Input 
                          placeholder="Jane" 
                          className="h-10 rounded-md bg-slate-50 border-slate-200"
                          value={form.firstName}
                          onChange={e => setForm({...form, firstName: e.target.value})}
                         />
                      </div>
                      <div className="space-y-1.5">
                         <Label className="text-xs font-semibold text-slate-600">Last Name</Label>
                         <Input 
                          placeholder="Doe" 
                          className="h-10 rounded-md bg-slate-50 border-slate-200"
                          value={form.lastName}
                          onChange={e => setForm({...form, lastName: e.target.value})}
                         />
                      </div>
                   </div>
                   <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Headline</Label>
                      <Input 
                        placeholder="e.g. Software Engineer" 
                        className="h-10 rounded-md bg-slate-50 border-slate-200"
                        value={form.headline}
                        onChange={e => setForm({...form, headline: e.target.value})}
                      />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-600">Account Type</Label>
                      <div className="grid grid-cols-2 gap-3">
                         {["alumni", "student"].map((r) => (
                           <button
                            key={r}
                            onClick={() => setRole(r as any)}
                            className={`h-12 rounded-md border flex items-center justify-center gap-2 transition-all text-sm font-semibold ${
                              role === r ? "border-blue-600 bg-blue-50 text-blue-600" : "border-slate-200 bg-white text-slate-500"
                            }`}
                           >
                             <span className="capitalize">{r}</span>
                           </button>
                         ))}
                      </div>
                   </div>
                </div>
              )}

              {step === orgStep && (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Find Your Organization</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search by school or organization name..."
                        className="h-10 rounded-md bg-slate-50 border-slate-200 pl-9"
                        value={orgSearch}
                        onChange={e => setOrgSearch(e.target.value)}
                      />
                    </div>
                    {orgSearching && (
                      <p className="text-xs text-slate-400 flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" /> Searching...
                      </p>
                    )}
                    {selectedOrgName && form.organizationId && (
                      <div className="flex items-center gap-2 p-3 rounded-md bg-emerald-50 border border-emerald-100 text-sm text-emerald-800">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span className="font-medium">{selectedOrgName}</span>
                      </div>
                    )}
                    {orgResults.length > 0 && (
                      <div className="border border-slate-200 rounded-md overflow-hidden max-h-48 overflow-y-auto">
                        {orgResults.map(org => (
                          <button
                            key={org.id}
                            type="button"
                            onClick={() => {
                              setForm({ ...form, organizationId: org.id });
                              setSelectedOrgName(org.name);
                              setOrgSearch(org.name);
                              setOrgResults([]);
                              toast.success(`Selected ${org.name}`);
                            }}
                            className={`w-full px-4 py-3 text-left text-sm hover:bg-slate-50 flex items-center gap-3 border-b border-slate-100 last:border-0 ${
                              form.organizationId === org.id ? "bg-blue-50" : ""
                            }`}
                          >
                            <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                            <span className="font-medium text-slate-800">{org.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {orgSearch.length >= 2 && !orgSearching && orgResults.length === 0 && (
                      <p className="text-xs text-slate-400">No organizations found. Try a different search term.</p>
                    )}
                  </div>
                </div>
              )}

              {step === locationStep && (
                <div className="space-y-6">
                   <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Country</Label>
                      <Select value={form.countryCode} onValueChange={v => setForm({...form, countryCode: v, city: ""})}>
                         <SelectTrigger className="h-10 rounded-md bg-slate-50 border-slate-200">
                            <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                            {Country.getAllCountries().map(c => (
                              <SelectItem key={c.isoCode} value={c.isoCode}>{c.name}</SelectItem>
                            ))}
                         </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-1.5 relative">
                      <Label className="text-xs font-semibold text-slate-600">City</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                          placeholder="Search city..." 
                          className="h-10 rounded-md bg-slate-50 border-slate-200 pl-9"
                          value={citySearch}
                          onChange={e => setCitySearch(e.target.value)}
                        />
                        {filteredCities.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-50 overflow-hidden">
                             {filteredCities.map(c => (
                               <button
                                key={c.name}
                                onClick={() => { setForm({...form, city: c.name}); setCitySearch(c.name); setFilteredCities([]); }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                               >
                                 {c.name}
                               </button>
                             ))}
                          </div>
                        )}
                      </div>
                   </div>
                </div>
              )}

              {step === educationStep && (
                <div className="space-y-6">
                   <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Degree</Label>
                      <Input 
                        placeholder="e.g. Bachelor of Science" 
                        className="h-10 rounded-md bg-slate-50 border-slate-200"
                        value={form.degree}
                        onChange={e => setForm({...form, degree: e.target.value})}
                      />
                   </div>
                   <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Major / Field of Study</Label>
                      <Input 
                        placeholder="e.g. Computer Science" 
                        className="h-10 rounded-md bg-slate-50 border-slate-200"
                        value={form.major}
                        onChange={e => setForm({...form, major: e.target.value})}
                      />
                   </div>
                   <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">{role === "alumni" ? "Graduation Year" : "Expected Graduation"}</Label>
                      <Select value={form.graduationYear} onValueChange={v => setForm({...form, graduationYear: v})}>
                         <SelectTrigger className="h-10 rounded-md bg-slate-50 border-slate-200">
                            <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                            {Array.from({length: 50}, (_, i) => (new Date().getFullYear() + 5 - i).toString()).map(y => (
                              <SelectItem key={y} value={y}>{y}</SelectItem>
                            ))}
                         </SelectContent>
                      </Select>
                   </div>
                </div>
              )}

              {step === workStep && (
                <div className="space-y-6">
                   <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Current Company</Label>
                      <Input 
                        placeholder="e.g. Microsoft (Optional)" 
                        className="h-10 rounded-md bg-slate-50 border-slate-200"
                        value={form.currentCompany}
                        onChange={e => setForm({...form, currentCompany: e.target.value})}
                      />
                   </div>
                   <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Job Title</Label>
                      <Input 
                        placeholder="e.g. Software Engineer (Optional)" 
                        className="h-10 rounded-md bg-slate-50 border-slate-200"
                        value={form.currentTitle}
                        onChange={e => setForm({...form, currentTitle: e.target.value})}
                      />
                   </div>
                   <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Bio</Label>
                      <textarea
                        className="w-full h-24 rounded-md bg-slate-50 border border-slate-200 p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="A brief summary about yourself..."
                        value={form.bio}
                        onChange={e => setForm({...form, bio: e.target.value})}
                      />
                   </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-8">
                 {step > 1 && (
                   <Button variant="ghost" onClick={prevStep} className="h-11 px-6 font-semibold text-slate-500">
                      Back
                   </Button>
                 )}
                 <Button 
                   onClick={step === workStep ? handleComplete : handleNext} 
                   disabled={saving}
                   className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                 >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : step === workStep ? "Complete" : "Continue"}
                 </Button>
              </div>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function MemberCompleteProfilePage() {
  return (
    <Suspense fallback={null}>
      <MemberCompleteProfileContent />
    </Suspense>
  );
}
