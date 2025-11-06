"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GraduationCap, Loader2, MapPin, Building, Briefcase, User, Globe } from "lucide-react";
import { toast } from "sonner";
import { useAuthContext } from "@/context/AuthContext";
import { profileQueries } from "@/db/queries/profiles";
import Image from "next/image";

// Data for dropdowns
const graduationYears = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);
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
  "Other"
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
  "Retired"
];

export default function CompleteProfilePage() {
  const { user, profile, refreshProfile } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();

  const [formData, setFormData] = useState({
    // Core database fields
    graduation_year: new Date().getFullYear(),
    bio: "",
    headline: "",
    location: "",
    
    // Fields that go into metadata JSON
    metadata: {
      // Educational background
      degree: "",
      major: "",
      
      // Professional information
      current_position: "",
      company: "",
      industry: "",
      employment_type: "",
      
      // Social links
      website_url: "",
      linkedin_url: "",
      github_url: "",
      twitter_url: "",
      
      // Skills
      skills: [] as string[],
      
      // Privacy settings
      privacy_settings: {
        profile_visible: true,
        email_visible: false,
        graduation_year_visible: true,
      }
    }
  });

  const [currentSkill, setCurrentSkill] = useState("");

  useEffect(() => {
    if (!user) {
      toast.error("Authentication required");
      router.push('/auth/login');
      return;
    }

    // If user already has a complete profile (has metadata), redirect to dashboard
    if (profile && profile.metadata && Object.keys(profile.metadata).length > 0) {
      router.push('/dashboard');
    }
  }, [user, profile, router]);

  const handleAddSkill = () => {
    if (currentSkill.trim() && !formData.metadata.skills.includes(currentSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          skills: [...prev.metadata.skills, currentSkill.trim()]
        }
      }));
      setCurrentSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        skills: prev.metadata.skills.filter(skill => skill !== skillToRemove)
      }
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !profile) {
      toast.error("Authentication required");
      return;
    }

    // Validation for required fields
    if (!formData.metadata.degree || !formData.metadata.major) {
      toast.error("Please complete required fields", {
        description: "Degree and Major are required fields.",
      });
      setCurrentStep(1);
      return;
    }

    setLoading(true);

    try {
      // Update profile with all collected information
      const updatedProfile = await profileQueries.updateProfile(profile.id, {
        graduation_year: formData.graduation_year,
        bio: formData.bio,
        headline: formData.headline,
        location: formData.location,
        metadata: {
          ...formData.metadata,
          // Ensure skills array is properly formatted
          skills: formData.metadata.skills,
          // Ensure privacy settings are included
          privacy_settings: formData.metadata.privacy_settings
        },
        is_verified: true,
        is_active: true,
      });

      if (updatedProfile) {
        await refreshProfile();
        
        toast.success("Profile Completed!", {
          description: "Your alumni profile has been successfully set up.",
        });

        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error("Failed to update profile", {
        description: "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    // Validate current step before proceeding
    if (currentStep === 1) {
      if (!formData.metadata.degree || !formData.metadata.major) {
        toast.error("Please complete required fields", {
          description: "Degree and Major are required.",
        });
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-8">
      <div className="flex items-center space-x-4">
        {[1, 2, 3, 4].map(step => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === currentStep 
                ? 'bg-indigo-600 text-white' 
                : step < currentStep 
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}>
              {step < currentStep ? '✓' : step}
            </div>
            {step < 4 && (
              <div className={`w-12 h-1 mx-2 ${
                step < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <User className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Personal Information</h3>
              <p className="text-muted-foreground">Tell us about your educational background</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="graduation_year">Graduation Year *</Label>
                <Select
                  value={formData.graduation_year.toString()}
                  onValueChange={(value) => setFormData({...formData, graduation_year: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select graduation year" />
                  </SelectTrigger>
                  <SelectContent>
                    {graduationYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="degree">Degree *</Label>
                <Input
                  id="degree"
                  placeholder="e.g., Bachelor of Science"
                  value={formData.metadata.degree}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, degree: e.target.value }
                  }))}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="major">Major/Field of Study *</Label>
                <Input
                  id="major"
                  placeholder="e.g., Computer Science, Business Administration"
                  value={formData.metadata.major}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, major: e.target.value }
                  }))}
                  required
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Briefcase className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Professional Information</h3>
              <p className="text-muted-foreground">Share your career details</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current_position">Current Position</Label>
                <Input
                  id="current_position"
                  placeholder="e.g., Software Engineer, Marketing Manager"
                  value={formData.metadata.current_position}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, current_position: e.target.value }
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company/Organization</Label>
                <Input
                  id="company"
                  placeholder="e.g., Google, Microsoft"
                  value={formData.metadata.company}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, company: e.target.value }
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select
                  value={formData.metadata.industry}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, industry: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map(industry => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employment_type">Employment Type</Label>
                <Select
                  value={formData.metadata.employment_type}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, employment_type: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {employmentTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="headline">Professional Headline</Label>
                <Input
                  id="headline"
                  placeholder="e.g., Senior Software Engineer at Tech Company"
                  value={formData.headline}
                  onChange={(e) => setFormData({...formData, headline: e.target.value})}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Location & Social Links</h3>
              <p className="text-muted-foreground">Help others connect with you</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., San Francisco, CA"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website_url">Personal Website</Label>
                <Input
                  id="website_url"
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={formData.metadata.website_url}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, website_url: e.target.value }
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin_url">LinkedIn Profile</Label>
                <Input
                  id="linkedin_url"
                  type="url"
                  placeholder="https://linkedin.com/in/yourname"
                  value={formData.metadata.linkedin_url}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, linkedin_url: e.target.value }
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="github_url">GitHub Profile</Label>
                <Input
                  id="github_url"
                  type="url"
                  placeholder="https://github.com/yourname"
                  value={formData.metadata.github_url}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, github_url: e.target.value }
                  }))}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="twitter_url">Twitter/X Profile</Label>
                <Input
                  id="twitter_url"
                  type="url"
                  placeholder="https://twitter.com/yourname"
                  value={formData.metadata.twitter_url}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, twitter_url: e.target.value }
                  }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself, your career journey, interests, and what you're passionate about..."
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Skills & Expertise</Label>
              <div className="flex gap-2">
                <Input
                  id="skills"
                  placeholder="Add a skill (e.g., JavaScript, Project Management)"
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button type="button" onClick={handleAddSkill}>
                  Add
                </Button>
              </div>
              {formData.metadata.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.metadata.skills.map(skill => (
                    <div
                      key={skill}
                      className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Globe className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Privacy Settings</h3>
              <p className="text-muted-foreground">Control your visibility in the alumni network</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="profile-public" className="text-base">
                    Public Profile
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow other alumni to view your profile
                  </p>
                </div>
                <Switch
                  id="profile-public"
                  checked={formData.metadata.privacy_settings.profile_visible}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    metadata: {
                      ...prev.metadata,
                      privacy_settings: {
                        ...prev.metadata.privacy_settings,
                        profile_visible: checked
                      }
                    }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="show-email" className="text-base">
                    Show Email Address
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Make your email visible to other alumni
                  </p>
                </div>
                <Switch
                  id="show-email"
                  checked={formData.metadata.privacy_settings.email_visible}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    metadata: {
                      ...prev.metadata,
                      privacy_settings: {
                        ...prev.metadata.privacy_settings,
                        email_visible: checked
                      }
                    }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="show-graduation" className="text-base">
                    Show Graduation Year
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Display your graduation year on your profile
                  </p>
                </div>
                <Switch
                  id="show-graduation"
                  checked={formData.metadata.privacy_settings.graduation_year_visible}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    metadata: {
                      ...prev.metadata,
                      privacy_settings: {
                        ...prev.metadata.privacy_settings,
                        graduation_year_visible: checked
                      }
                    }
                  }))}
                />
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Note:</strong> You can always change these settings later from your profile page.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
             <div className="relative w-24 h-24 flex items-center justify-center group">
                        <Image
                          src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/public/Assets/logo.png`}
                          alt="Alumni Connect Logo"
                          fill
                          priority
                          className="object-contain transition-transform duration-300 group-hover:scale-105"
                          unoptimized
                          sizes="96px"
                        />
          
                      </div>
          </div>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Let's set up your alumni profile to help you connect with others
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepIndicator()}
          
          <form onSubmit={handleSubmit}>
            {renderStepContent()}

            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1 || loading}
              >
                Previous
              </Button>

              {currentStep < 4 ? (
                <Button type="button" onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing Profile...
                    </>
                  ) : (
                    "Complete Profile"
                  )}
                </Button>
              )}
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Step {currentStep} of 4
          </div>
        </CardContent>
      </Card>
    </div>
  );
}