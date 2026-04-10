"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthProfile } from "@/context/AuthContext";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
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
  GraduationCap,
  Save,
  ArrowLeft,
  Plus,
  X,
  ShieldCheck,
  RefreshCw,
  ChevronRight,
  Monitor
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";

export default function EditProfilePage() {
  const router = useRouter();
  const { profile, loading: profileLoading, refreshProfile } = useAuthProfile();
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
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authUserId: profile.id,
          ...formData,
        }),
      });
      if (res.ok) {
        toast.success("Identity profile updated.");
        await refreshProfile();
        router.push("/dashboard/profile");
      }
    } catch (error) {
      toast.error("Failed to transmit identity update.");
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
    <div className="container py-8 max-w-5xl mx-auto px-6 space-y-8 animate-in fade-in duration-700">
      {/* Header Context */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
           <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
           </Button>
           <div>
              <div className="flex items-center gap-2 mb-1">
                 <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em]">Identity Governance</span>
                 <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Modify Node</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Profile Modification</h1>
           </div>
        </div>
        <Button onClick={handleSubmit} disabled={saving} className="h-12 rounded-xl font-bold px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/10">
           {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
           Save Identification
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
         <TabsList className="bg-slate-100 dark:bg-slate-950/40 p-1.5 rounded-2xl w-fit flex gap-1 mb-8">
            {[
              { id: "basic", label: "Core Identity", icon: User },
              { id: "professional", label: "Market Load", icon: Briefcase },
              { id: "social", label: "Relay Hubs", icon: Globe },
              { id: "privacy", label: "Shield Access", icon: ShieldCheck }
            ].map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id} 
                className="h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-400"
              >
                 <tab.icon className="h-3 w-3 mr-2" />
                 {tab.label}
              </TabsTrigger>
            ))}
         </TabsList>

         <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden p-10">
            <TabsContent value="basic" className="m-0 space-y-10 animate-in fade-in slide-in-from-bottom-2">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Legal Identity Node</Label>
                     <Input name="full_name" value={formData.full_name} onChange={handleInputChange} className="h-12 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest" />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Identity Headline</Label>
                     <Input name="headline" value={formData.headline} onChange={handleInputChange} className="h-12 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest" />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Degree Program</Label>
                     <Input name="degree" value={formData.degree} onChange={handleInputChange} className="h-12 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest" />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Graduation Cycle</Label>
                     <Select value={formData.graduation_year.toString()} onValueChange={(v) => handleSelectChange("graduation_year", v)}>
                        <SelectTrigger className="h-12 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                           {years.map(y => <SelectItem key={y} value={y.toString()} className="text-[10px] font-black uppercase tracking-widest">{y}</SelectItem>)}
                        </SelectContent>
                     </Select>
                  </div>
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Narrative Stream (Bio)</Label>
                  <Textarea name="bio" value={formData.bio} onChange={handleInputChange} rows={6} className="rounded-2xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-medium leading-loose italic" />
               </div>
            </TabsContent>

            <TabsContent value="professional" className="m-0 space-y-10 animate-in fade-in slide-in-from-bottom-2">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Position Identifier</Label>
                     <Input name="current_position" value={formData.current_position} onChange={handleInputChange} className="h-12 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest" />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Institutional Loader (Company)</Label>
                     <Input name="company" value={formData.company} onChange={handleInputChange} className="h-12 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest" />
                  </div>
               </div>
               <div className="space-y-6 pt-10 border-t border-slate-50">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Skillset Clusters</Label>
                  <div className="flex gap-4">
                     <Input placeholder="TRANSMIT SKILL IDENTIFIER..." value={currentSkill} onChange={(e) => setCurrentSkill(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addSkill()} className="h-12 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-[10px] font-black uppercase tracking-widest" />
                     <Button type="button" onClick={addSkill} className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100"><Plus className="h-5 w-5" /></Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                     {Object.keys(formData.skills).map((skill) => (
                        <Badge key={skill} className="px-5 py-2.5 bg-slate-50 text-slate-500 border-none font-black text-[9px] uppercase tracking-widest rounded-xl italic gap-3">
                           {skill}
                           <X className="h-3 w-3 cursor-pointer hover:text-rose-500" onClick={() => removeSkill(skill)} />
                        </Badge>
                     ))}
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="social" className="m-0 space-y-10 animate-in fade-in slide-in-from-bottom-2">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {["website_url", "linkedin_url", "github_url", "twitter_url"].map((field) => (
                     <div key={field} className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">{field.replace('_', ' ').toUpperCase()}</Label>
                        <Input name={field} value={(formData as any)[field]} onChange={handleInputChange} className="h-12 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest" />
                     </div>
                  ))}
               </div>
            </TabsContent>

            <TabsContent value="privacy" className="m-0 space-y-8 animate-in fade-in slide-in-from-bottom-2">
               {[
                 { id: "profile_visible", label: "Global Profile Identification", desc: "Allow institutional indexers to surface your identity node." },
                 { id: "email_visible", label: "Relay Mail Disclosure", desc: "Enable direct email coordinates for verified connections." },
                 { id: "graduation_year_visible", label: "Graduation Cycle Display", desc: "Reveal academic temporal identifiers globally." }
               ].map((item) => (
                 <div key={item.id} className="flex items-center justify-between p-6 rounded-[2rem] bg-slate-50/50 hover:bg-white transition-all">
                    <div>
                       <p className="text-sm font-bold text-slate-900 uppercase italic leading-none">{item.label}</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 italic">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={(formData.privacy as any)[item.id]} onChange={(e) => setFormData(prev => ({ ...prev, privacy: { ...prev.privacy, [item.id]: e.target.checked } }))} className="sr-only peer" />
                      <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-6"></div>
                    </label>
                 </div>
               ))}
            </TabsContent>
         </Card>
      </Tabs>

      <footer className="pt-10 border-t border-slate-50 flex items-center justify-center">
         <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Identity Modification Protocol v1.0.8 • Secure Admin Node</p>
      </footer>
    </div>
  );
}