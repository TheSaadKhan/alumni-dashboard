"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthProfile } from "@/context/AuthContext";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Briefcase,
  Globe,
  Save,
  ArrowLeft,
  Plus,
  X,
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export default function EditProfilePage() {
  const router = useRouter();
  const { profile, organization, loading: profileLoading, refreshProfile } = useAuthProfile();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const [formData, setFormData] = useState({
    full_name: "",
    headline: "",
    bio: "",
    location: "",
    graduation_year: new Date().getFullYear(),
    degree: "",
    skills: {} as Record<string, any>,
    major: "",
    company: "",
    industry: "",
    current_position: "",
    employment_type: "",
    website_url: "",
    linkedin_url: "",
    github_url: "",
    twitter_url: "",
    privacy: {
      profile_visible: true,
      email_visible: false,
      graduation_year_visible: true,
    },
  });

  const [currentSkill, setCurrentSkill] = useState("");

  useEffect(() => {
    if (profile) {
      const metadata = profile.metadata || {};
      const professional = metadata.professional || {};
      const social = metadata.social || {};
      const privacy = metadata.privacy || { profile_visible: true, email_visible: false, graduation_year_visible: true };

      setFormData({
        full_name: profile.fullName || "",
        headline: profile.headline || "",
        bio: profile.bio || "",
        location: profile.location || "",
        graduation_year: profile.graduation_year || new Date().getFullYear(),
        degree: profile.degree || "",
        skills: profile.skills || {},
        major: metadata.major || "",
        company: professional.company || "",
        industry: professional.industry || "",
        current_position: professional.current_position || "",
        employment_type: professional.employment_type || "",
        website_url: social.website_url || "",
        linkedin_url: social.linkedin_url || "",
        github_url: social.github_url || "",
        twitter_url: social.twitter_url || "",
        privacy: privacy,
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: name === "graduation_year" ? parseInt(value) : value }));
  };

  const addSkill = () => {
    if (!currentSkill.trim()) return;
    setFormData((prev) => ({
      ...prev,
      skills: { ...prev.skills, [currentSkill.trim()]: "5" }
    }));
    setCurrentSkill("");
  };

  const removeSkill = (skillName: string) => {
    setFormData((prev) => {
      const newSkills = { ...prev.skills };
      delete newSkills[skillName];
      return { ...prev, skills: newSkills };
    });
  };

  const handleSubmit = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const names = formData.full_name.split(' ');
      const firstName = names[0];
      const lastName = names.slice(1).join(' ');

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          headline: formData.headline,
          bio: formData.bio,
          location: formData.location,
          graduationYear: formData.graduation_year,
          degree: formData.degree,
          major: formData.major,
          currentTitle: formData.current_position,
          currentCompany: formData.company,
          industry: formData.industry,
          websiteUrl: formData.website_url,
          linkedinUrl: formData.linkedin_url,
          githubUrl: formData.github_url,
          twitterUrl: formData.twitter_url,
          skills: Object.keys(formData.skills).map(name => ({ name })),
          privacy: formData.privacy
        }),
      });
      if (res.ok) {
        toast.success("Profile updated successfully!");
        await refreshProfile();
        router.push(`/organization/${organization?.slug || 'default'}/dashboard/profile`);
      } else {
         const data = await res.json();
         throw new Error(data.error || "Update failed");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (profileLoading) {
    return (
       <div className="flex h-[60vh] items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-200" />
       </div>
    );
  }

  const years = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="container py-8 max-w-4xl mx-auto px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
           <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
           </Button>
           <div>
              <h1 className="text-3xl font-bold text-slate-900">Edit Profile</h1>
              <p className="text-slate-500 mt-1">Keep your information up to date for better networking.</p>
           </div>
        </div>
        <Button onClick={handleSubmit} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 font-bold">
           {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
           Save Profile
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
         <TabsList className="grid grid-cols-4 w-full h-12 mb-8">
            <TabsTrigger value="basic" className="gap-2"><User className="h-4 w-4" /> <span className="hidden sm:inline">Basic</span></TabsTrigger>
            <TabsTrigger value="professional" className="gap-2"><Briefcase className="h-4 w-4" /> <span className="hidden sm:inline">Career</span></TabsTrigger>
            <TabsTrigger value="social" className="gap-2"><Globe className="h-4 w-4" /> <span className="hidden sm:inline">Social</span></TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2"><ShieldCheck className="h-4 w-4" /> <span className="hidden sm:inline">Privacy</span></TabsTrigger>
         </TabsList>

         <Card>
            <CardContent className="pt-6">
               <TabsContent value="basic" className="m-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input name="full_name" value={formData.full_name} onChange={handleInputChange} />
                     </div>
                     <div className="space-y-2">
                        <Label>Headline</Label>
                        <Input name="headline" value={formData.headline} placeholder="e.g. Senior Product Designer" onChange={handleInputChange} />
                     </div>
                     <div className="space-y-2">
                        <Label>Degree</Label>
                        <Input name="degree" value={formData.degree} placeholder="e.g. B.S. Computer Science" onChange={handleInputChange} />
                     </div>
                     <div className="space-y-2">
                        <Label>Graduation Year</Label>
                        <Select value={formData.graduation_year.toString()} onValueChange={(v) => handleSelectChange("graduation_year", v)}>
                           <SelectTrigger>
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                           </SelectContent>
                        </Select>
                     </div>
                  </div>
                  <div className="space-y-2">
                     <Label>Bio / Summary</Label>
                     <Textarea name="bio" value={formData.bio} onChange={handleInputChange} rows={5} placeholder="Tell others about yourself..." />
                  </div>
               </TabsContent>

               <TabsContent value="professional" className="m-0 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label>Current Position</Label>
                        <Input name="current_position" value={formData.current_position} onChange={handleInputChange} />
                     </div>
                     <div className="space-y-2">
                        <Label>Current Company</Label>
                        <Input name="company" value={formData.company} onChange={handleInputChange} />
                     </div>
                  </div>
                  <div className="space-y-4">
                     <Label>Skills</Label>
                     <div className="flex gap-2">
                        <Input placeholder="Add a skill..." value={currentSkill} onChange={(e) => setCurrentSkill(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addSkill()} />
                        <Button type="button" variant="secondary" onClick={addSkill}><Plus className="h-4 w-4" /></Button>
                     </div>
                     <div className="flex flex-wrap gap-2 pt-2">
                        {Object.keys(formData.skills).map((skill) => (
                           <Badge key={skill} variant="secondary" className="px-3 py-1 gap-2">
                              {skill}
                              <X className="h-3 w-3 cursor-pointer text-slate-400 hover:text-rose-500" onClick={() => removeSkill(skill)} />
                           </Badge>
                        ))}
                     </div>
                  </div>
               </TabsContent>

               <TabsContent value="social" className="m-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label>Website Portfolio</Label>
                        <Input name="website_url" value={formData.website_url} onChange={handleInputChange} placeholder="https://..." />
                     </div>
                     <div className="space-y-2">
                        <Label>LinkedIn Profile</Label>
                        <Input name="linkedin_url" value={formData.linkedin_url} onChange={handleInputChange} placeholder="https://linkedin.com/in/..." />
                     </div>
                     <div className="space-y-2">
                        <Label>GitHub Profile</Label>
                        <Input name="github_url" value={formData.github_url} onChange={handleInputChange} placeholder="https://github.com/..." />
                     </div>
                     <div className="space-y-2">
                        <Label>Twitter / X Profile</Label>
                        <Input name="twitter_url" value={formData.twitter_url} onChange={handleInputChange} placeholder="https://twitter.com/..." />
                     </div>
                  </div>
               </TabsContent>

               <TabsContent value="privacy" className="m-0 space-y-4">
                  {[
                    { id: "profile_visible", label: "Public Profile", desc: "Allows other members of your institution to find you." },
                    { id: "email_visible", label: "Show Email Address", desc: "Displays your email to verified members only." },
                    { id: "graduation_year_visible", label: "Show Graduation Year", desc: "Reveals your batch information on your profile." }
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border border-transparent hover:bg-slate-50 transition-colors">
                       <div>
                          <p className="text-sm font-semibold">{item.label}</p>
                          <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                       </div>
                       <Switch 
                          checked={(formData.privacy as any)[item.id]} 
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, privacy: { ...prev.privacy, [item.id]: checked } }))} 
                       />
                    </div>
                  ))}
               </TabsContent>
            </CardContent>
         </Card>
      </Tabs>

      <div className="flex justify-end gap-3 pb-12">
         <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
         <Button onClick={handleSubmit} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 font-bold px-8">
            {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : "Save Changes"}
         </Button>
      </div>
    </div>
  );
}