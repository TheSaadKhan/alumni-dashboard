"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Bell, Lock, Eye, Globe, Shield, Trash2, Download,
  User, Building2, Mail, Phone, CheckCircle2, Loader2,
  LogOut, AlertTriangle, Key, Smartphone, ChevronRight,
  Palette, Layout, Heart, Save, RefreshCw, MapPin, Search
} from "lucide-react";
import { useAuthProfile } from "@/context/AuthContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Country, City } from "country-state-city";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-6 border-b border-slate-50 last:border-0 gap-8">
      <div className="flex-1">
        <p className="text-sm font-bold text-slate-900">{label}</p>
        {description && <p className="text-xs font-medium text-slate-400 mt-1 leading-relaxed">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SectionCard({ title, description, icon: Icon, children }: { title: string; description: string; icon: any; children: React.ReactNode }) {
  return (
    <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-950/30">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center border border-slate-100 dark:border-slate-800">
             <Icon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{description}</p>
          </div>
        </div>
      </div>
      <CardContent className="p-8">
        {children}
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const { profile, organization, loading: profileLoading } = useAuthProfile();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [notifications, setNotifications] = useState({
    emailMessages: true,
    emailJobs: true,
    emailEvents: true,
    emailMentorship: true,
    pushMessages: true,
    weeklyDigest: true,
    mentorRequests: true,
  });

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showEmail: false,
    showPhone: false,
    showLocation: true,
    allowMessages: true,
    showInSearch: true,
    allowMentorRequests: true,
  });

  const [profileData, setProfileData] = useState({
    fullName: "",
    phone: "",
    linkedinUrl: "",
    bio: "",
    city: "",
    countryCode: "IN",
  });

  const [citySearch, setCitySearch] = useState("");
  const [filteredCities, setFilteredCities] = useState<any[]>([]);

  const userType = profile?.userType;
  const isAlumni = userType === "alumni";

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.notifications) setNotifications(prev => ({ ...prev, ...data.notifications }));
        if (data.privacy) setPrivacy(prev => ({ ...prev, ...data.privacy }));
        if (data.profile) setProfileData(prev => ({ ...prev, ...data.profile }));
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (profile) {
      setProfileData({
        fullName: profile.fullName || "",
        phone: (profile as any).phone || "",
        linkedinUrl: (profile as any).alumniProfile?.linkedinUrl || (profile as any).studentProfile?.linkedinUrl || "",
        bio: (profile as any).alumniProfile?.bio || (profile as any).studentProfile?.bio || "",
        city: profile.city || "",
        countryCode: profile.countryCode || "IN",
      });
      setCitySearch(profile.city || "");
      loadSettings();
    }
  }, [profile, loadSettings]);

  useEffect(() => {
    if (citySearch.length > 2 && citySearch !== profileData.city) {
      const cities = City.getCitiesOfCountry(profileData.countryCode) || [];
      const filtered = cities
        .filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase()))
        .slice(0, 8);
      setFilteredCities(filtered);
    } else {
      setFilteredCities([]);
    }
  }, [citySearch, profileData.countryCode, profileData.city]);

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await Promise.all([
        fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "notifications", data: notifications }),
        }),
        fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "privacy", data: privacy }),
        }),
        fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileData),
        })
      ]);
      toast.success("Settings updated!");
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (profileLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 animate-in fade-in duration-300">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-[2.5rem]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Settings</h1>
          <p className="text-slate-500 font-medium text-sm">Personalize your experience and security.</p>
        </div>
        <Button 
          onClick={handleSaveAll} 
          disabled={saving}
          className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black px-8 shadow-xl shadow-blue-500/20"
        >
          {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-8">
        <TabsList className="bg-slate-50 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 h-auto w-auto">
          <TabsTrigger value="profile" className="px-6 py-2.5 rounded-xl text-xs font-black data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Profile</TabsTrigger>
          <TabsTrigger value="notifications" className="px-6 py-2.5 rounded-xl text-xs font-black data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Notifications</TabsTrigger>
          <TabsTrigger value="privacy" className="px-6 py-2.5 rounded-xl text-xs font-black data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
          <SectionCard title="Personal Info" description="Basic details" icon={User}>
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Full Name</Label>
                  <Input 
                    placeholder="Jane Doe" 
                    className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 border-none font-semibold px-5"
                    value={profileData.fullName}
                    onChange={e => setProfileData({...profileData, fullName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Phone</Label>
                  <Input 
                    placeholder="+1 (555) 000-0000" 
                    className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 border-none font-semibold px-5"
                    value={profileData.phone}
                    onChange={e => setProfileData({...profileData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Country</Label>
                  <Select value={profileData.countryCode} onValueChange={v => setProfileData({...profileData, countryCode: v, city: ""})}>
                     <SelectTrigger className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 border-none font-semibold px-5 shadow-none">
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent className="rounded-2xl border-slate-100 max-h-60">
                        {Country.getAllCountries().map(c => (
                          <SelectItem key={c.isoCode} value={c.isoCode}>{c.name}</SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 relative">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">City Search</Label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <Input 
                      placeholder="Start typing..." 
                      className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 border-none font-semibold pl-12"
                      value={citySearch}
                      onChange={e => setCitySearch(e.target.value)}
                    />
                    {filteredCities.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50">
                         {filteredCities.map(c => (
                           <button
                            key={c.name}
                            onClick={() => {
                              setProfileData({...profileData, city: c.name});
                              setCitySearch(c.name);
                              setFilteredCities([]);
                            }}
                            className="w-full px-5 py-3 text-left text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                           >
                             {c.name}
                           </button>
                         ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">LinkedIn URL</Label>
                <Input 
                  placeholder="https://linkedin.com/..." 
                  className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 border-none font-semibold px-5"
                  value={profileData.linkedinUrl}
                  onChange={e => setProfileData({...profileData, linkedinUrl: e.target.value})}
                />
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-8">
           <SectionCard title="Notifications" description="Email alerts" icon={Bell}>
             <SettingRow label="Direct Messages" description="When someone sends you a message.">
               <Switch checked={notifications.emailMessages} onCheckedChange={v => setNotifications({...notifications, emailMessages: v})} />
             </SettingRow>
             <SettingRow label="Job Alerts" description="New opportunities in your field.">
               <Switch checked={notifications.emailJobs} onCheckedChange={v => setNotifications({...notifications, emailJobs: v})} />
             </SettingRow>
           </SectionCard>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-8">
           <SectionCard title="Privacy" description="Control your data" icon={Shield}>
             <SettingRow label="Profile Visibility" description="Allow others to find you.">
               <Switch checked={privacy.profileVisible} onCheckedChange={v => setPrivacy({...privacy, profileVisible: v})} />
             </SettingRow>
             <SettingRow label="Show Email" description="Display email to verified members.">
               <Switch checked={privacy.showEmail} onCheckedChange={v => setPrivacy({...privacy, showEmail: v})} />
             </SettingRow>
           </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}