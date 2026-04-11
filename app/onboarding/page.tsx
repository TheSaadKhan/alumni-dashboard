"use client";

import { useAuthProfile } from "@/context/AuthContext";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GradientText, GlassPanel, Glow } from "@/components/ui/aceternity-wrappers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { completeOnboarding } from "@/app/actions/onboarding";
import {
  createOrganizationAction,
  getUserOrganizationsAction,
} from "@/app/actions/createOrganization";
import { Loader2, GraduationCap, School, CheckCircle2, Building2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
}

export default function OnboardingPage() {
  const { profile, loading, refreshProfile } = useAuthProfile();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userType, setUserType] = useState<string>("");
  const [organizationId, setOrganizationId] = useState<string>("");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [customOrgName, setCustomOrgName] = useState("");
  const [showCustomOrg, setShowCustomOrg] = useState(false);

  useEffect(() => {
    if (!loading && profile) {
      if (profile.onboardingCompleted) {
        router.push("/dashboard"); // Redirect to dashboard if already completed
      } else if (profile.userType === "alumni" || profile.userType === "student") {
        // If they already have a type but aren't completed, pre-select and go to step 2
        setUserType(profile.userType);
        setStep(2);
      }
    }
  }, [loading, profile, router]);

  // Fetch organizations for super admin or regular users
  useEffect(() => {
    async function fetchOrganizations() {
      if (!profile || step !== 2) return;
      
      setLoadingOrgs(true);
      try {
        const result = await getUserOrganizationsAction();
        if (result.organizations && result.organizations.length > 0) {
          setOrganizations(
            result.organizations.map((org: any) => ({
              id: org.id,
              name: org.name,
              slug: org.slug,
              logoUrl: org.logoUrl ?? null,
            }))
          );
          
          // Auto-select if only one organization
          if (result.organizations.length === 1 && !profile.organizationId) {
            setOrganizationId(result.organizations[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch organizations:", err);
      } finally {
        setLoadingOrgs(false);
      }
    }
    
    fetchOrganizations();
  }, [profile, step]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      let finalOrgId = organizationId;
      let selectedOrgSlug: string | null = null;

      if (showCustomOrg) {
        if (!customOrgName.trim()) {
          toast.error("Please enter a name for the organization.");
          setIsSubmitting(false);
          return;
        }

        const createResult = await createOrganizationAction({
          name: customOrgName.trim(),
          type: "college",
          description: `Created during onboarding by ${profile?.fullName || "user"}`,
        });

        finalOrgId = createResult.organizationId;
        selectedOrgSlug = createResult.slug;
      }

      if (!finalOrgId) {
        toast.error("Please select an organization.");
        setIsSubmitting(false);
        return;
      }

      formData.set("organizationId", finalOrgId);

      await completeOnboarding(formData);
      await refreshProfile();

      const selectedOrg = organizations.find((org) => org.id === finalOrgId);
      if (selectedOrg) {
        router.push(`/organization/${selectedOrg.slug}/dashboard`);
      } else if (selectedOrgSlug) {
        router.push(`/organization/${selectedOrgSlug}/dashboard`);
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Onboarding error:", err);
      toast.error(err.message || "Failed to complete onboarding. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden">
      <Glow size="lg" className="-top-1/4 -left-1/4" color="rgba(124, 58, 237, 0.2)" />
      <Glow size="lg" className="-bottom-1/4 -right-1/4" color="rgba(59, 130, 246, 0.2)" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl z-10"
      >
        <header className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
            Welcome to <GradientText>AlumniConnect</GradientText>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Complete your profile to join your professional network.
          </p>
        </header>

        <GlassPanel className="p-8 md:p-12 relative overflow-hidden">
          <form onSubmit={handleSubmit}>
            <input type="hidden" name="userType" value={userType} />
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="space-y-8"
                >
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-semibold">Join As...</h2>
                    <p className="text-muted-foreground text-sm">
                      Tell us about your status to tailor your experience.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => { setUserType("alumni"); nextStep(); }}
                      className={`p-6 border-2 rounded-xl text-left transition-all hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 ${
                        userType === "alumni" 
                          ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10 ring-2 ring-indigo-600/20" 
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <GraduationCap className={`h-8 w-8 mb-3 ${
                        userType === "alumni" ? "text-indigo-600" : "text-slate-400"
                      }`} />
                      <div className="font-bold text-lg">Alumni</div>
                      <div className="text-sm text-slate-500 mt-1">
                        I have graduated and want to mentor or network.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setUserType("student"); nextStep(); }}
                      className={`p-6 border-2 rounded-xl text-left transition-all hover:bg-blue-50/50 dark:hover:bg-blue-900/10 ${
                        userType === "student" 
                          ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 ring-2 ring-blue-600/20" 
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <School className={`h-8 w-8 mb-3 ${
                        userType === "student" ? "text-blue-600" : "text-slate-400"
                      }`} />
                      <div className="font-bold text-lg">Student</div>
                      <div className="text-sm text-slate-500 mt-1">
                        I am currently studying and looking for opportunities.
                      </div>
                    </button>
                  </div>
                  <input type="hidden" name="userType" value={userType} />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-semibold">Personal Details</h2>
                    <p className="text-slate-500 text-sm">
                      Let others recognize you and connect with your community.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        id="firstName" 
                        name="firstName" 
                        defaultValue={profile?.fullName?.split(" ")[0] || ""} 
                        placeholder="John"
                        required 
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName" 
                        name="lastName" 
                        defaultValue={profile?.fullName?.split(" ").slice(1).join(" ") || ""} 
                        placeholder="Doe"
                        required 
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organizationId">University / Institution</Label>
                    {loadingOrgs ? (
                      <div className="flex items-center justify-center p-4 border rounded-lg">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Select 
                          value={organizationId} 
                          onValueChange={(value) => {
                            setOrganizationId(value);
                            setShowCustomOrg(false);
                          }}
                          disabled={showCustomOrg}
                          required={!showCustomOrg}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select your university" />
                          </SelectTrigger>
                          <SelectContent>
                            {organizations.map((org) => (
                              <SelectItem key={org.id} value={org.id}>
                                <div className="flex items-center gap-2">
                                  {org.logoUrl ? (
                                    <img src={org.logoUrl} alt="" className="w-5 h-5 rounded" />
                                  ) : (
                                    <Building2 className="w-4 h-4" />
                                  )}
                                  {org.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {profile?.userType === "super_admin" && (
                          <div className="flex items-center gap-2 text-sm">
                            <button
                              type="button"
                              onClick={() => {
                                setShowCustomOrg(!showCustomOrg);
                                if (!showCustomOrg) setOrganizationId("");
                              }}
                              className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                            >
                              {showCustomOrg ? "Select existing organization" : "+ Create new organization"}
                            </button>
                          </div>
                        )}
                        
                        {showCustomOrg && (
                          <div className="mt-3 p-4 border border-indigo-200 dark:border-indigo-800 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30">
                            <Label className="text-sm font-medium">New Organization Name</Label>
                            <Input
                              placeholder="e.g., Harvard University Alumni"
                              value={customOrgName}
                              onChange={(e) => setCustomOrgName(e.target.value)}
                              className="mt-2"
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                              You'll be redirected to create this organization after onboarding.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    <input type="hidden" name="organizationId" value={organizationId} />
                  </div>

                  {userType === "alumni" ? (
                    <div className="space-y-2">
                      <Label htmlFor="graduationYear">Graduation Year</Label>
                      <Input 
                        id="graduationYear" 
                        name="graduationYear" 
                        type="number" 
                        placeholder="e.g., 2020" 
                        min="1950" 
                        max={new Date().getFullYear()}
                        required 
                        className="h-12"
                      />
                      <p className="text-xs text-muted-foreground">
                        When did you graduate from this institution?
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="expectedGraduation">Expected Graduation Year</Label>
                      <Input 
                        id="expectedGraduation" 
                        name="expectedGraduation" 
                        type="number" 
                        placeholder="e.g., 2026" 
                        min={new Date().getFullYear()} 
                        max={new Date().getFullYear() + 10}
                        required 
                        className="h-12"
                      />
                      <p className="text-xs text-muted-foreground">
                        When do you expect to complete your studies?
                      </p>
                    </div>
                  )}

                  {/* Info Box */}
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800 dark:text-blue-300">
                        <p className="font-medium">What happens next?</p>
                        <p className="text-xs mt-1">
                          After completing onboarding, you'll get access to your organization's alumni network,
                          where you can connect with peers, find mentors, discover opportunities, and more.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={prevStep} 
                      className="flex-1 py-6 h-auto text-lg font-medium"
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 py-6 h-auto text-lg font-medium bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg" 
                      disabled={isSubmitting || (!organizationId && !showCustomOrg)}
                    >
                      {isSubmitting ? (
                        <Loader2 className="animate-spin h-5 w-5" />
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-5 w-5" />
                          Complete Setup
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </GlassPanel>

        {/* Progress indicators */}
        <div className="mt-8 flex justify-center gap-2">
          {[1, 2].map((s) => (
            <div 
              key={s} 
              className={`h-2 rounded-full transition-all duration-300 ${
                step === s 
                  ? "w-8 bg-indigo-600" 
                  : "w-2 bg-slate-300 dark:bg-slate-700"
              }`} 
            />
          ))}
        </div>
        
        {/* Help text */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Need help? Contact support@alumniconnect.com
        </p>
      </motion.div>
    </div>
  );
}