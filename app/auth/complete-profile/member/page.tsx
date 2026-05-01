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

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
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
    setSaving(true);
    try {
      const { organizationId, currentCompany, graduationYear, ...rest } = form;
      await updateProfileAction({
        ...rest,
        graduationYear: parseInt(graduationYear),
        company: currentCompany,
      });
      
      const onboardingPayload: OnboardingData = {
        userType: role as any,
        organizationId: form.organizationId || organization?.id || null,
        inviteToken: inviteToken || null,
        firstName: form.firstName,
        lastName: form.lastName,
        graduationYear: form.graduationYear,
      };
      const res = await completeOnboarding(onboardingPayload);

      if (res.success) {
        toast.success("Profile completed!");
        await refreshProfile();
        router.push(res.redirectUrl || "/");
      } else {
        toast.error(res.error || "Failed to complete onboarding");
      }
    } catch (err: any) {
      toast.error("An error occurred. Please try again.");
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
    { title: "Location", icon: MapPin },
    { title: "Education", icon: GraduationCap },
    { title: "Work", icon: Briefcase },
  ];

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

              {step === 2 && (
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

              {step === 3 && (
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

              {step === 4 && (
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
                   onClick={step === 4 ? handleComplete : nextStep} 
                   disabled={saving}
                   className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                 >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : step === 4 ? "Complete" : "Continue"}
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
