"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Bell, 
  Shield, 
  User, 
  Mail, 
  Globe,
  RefreshCw,
  ChevronRight,
  Monitor,
  Lock,
  Eye,
  Settings as SettingsIcon,
  ShieldCheck,
  Check
} from "lucide-react";
import { useAuthProfile } from "@/context/AuthContext";
import { toast } from "sonner";

export default function SettingsPage() {
  const { profile, organization, loading: profileLoading } = useAuthProfile();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    privacy: {
      profile_visible: true,
      email_visible: false,
      graduation_year_visible: true,
      search_visible: "yes"
    },
    notifications: [
      { notificationType: "email", label: "Matrix Alerts", desc: "Real-time updates to your primary email relay.", icon: Mail, checked: true },
      { notificationType: "desktop", label: "Interface Echo", desc: "Direct browser push notifications for node alerts.", icon: Monitor, checked: true },
      { notificationType: "activity", label: "Engagement Pings", desc: "Notify upon connection requests or data mentions.", icon: User, checked: true }
    ]
  });

  const slug = organization?.slug || "default";

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        // Merge with labels and icons for UI
        const apiNotifs = data.settings.notifications;
        const uiNotifs = settings.notifications.map((n: any) => {
          const apiMatch = apiNotifs.find((an: any) => an.notificationType === n.notificationType);
          return apiMatch ? { ...n, checked: apiMatch.inAppEnabled || apiMatch.emailEnabled } : n;
        });
        
        setSettings({
          privacy: data.settings.privacy,
          notifications: uiNotifs
        });
      }
    } catch (err) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyChange = (key: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      privacy: { ...prev.privacy, [key]: value }
    }));
  };

  const handleNotificationToggle = (type: string) => {
    setSettings((prev: any) => ({
      ...prev,
      notifications: prev.notifications.map((n: any) => 
        n.notificationType === type ? { ...n, checked: !n.checked } : n
      )
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          privacy: settings.privacy,
          notifications: settings.notifications.map((n: any) => ({
            notificationType: n.notificationType,
            inAppEnabled: n.checked,
            emailEnabled: n.checked,
            pushEnabled: n.checked
          }))
        })
      });
      if (res.ok) {
        toast.success("Settings saved successfully");
      } else {
        throw new Error("Failed to update");
      }
    } catch (err) {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-slate-200" />
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl mx-auto px-6 space-y-8 animate-in fade-in duration-700">
      {/* Header Context */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em]">Governance</span>
              <div className="h-1 w-1 rounded-full bg-slate-300"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Global Config</span>
           </div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Account Preferences</h1>
           <p className="text-slate-500 font-medium mt-1">Manage your identity, visibility, and system interactions.</p>
        </div>
        <Button variant="outline" className="h-11 rounded-xl font-bold text-slate-400 px-6" onClick={fetchSettings}>
           <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> System Sync
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Matrix */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: "profile", label: "Identity", icon: User, active: true },
            { id: "notifications", label: "Relay Pulse", icon: Bell },
            { id: "privacy", label: "Shield Access", icon: Shield },
            { id: "communication", label: "Network Mail", icon: Mail },
            { id: "preferences", label: "System Sync", icon: Monitor }
          ].map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={`w-full justify-between h-12 rounded-2xl transition-all px-4 ${
                item.active 
                  ? "bg-white text-blue-600 shadow-sm font-bold" 
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                 <item.icon className="h-4 w-4" />
                 <span className="text-[10px] uppercase font-black tracking-widest">{item.label}</span>
              </div>
              {item.active && <ChevronRight className="h-3 w-3" />}
            </Button>
          ))}
        </div>

        {/* Configuration Core */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Identity visibility */}
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden group">
            <CardHeader className="p-8 pb-4 border-b border-slate-50 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20">
              <div className="flex items-center gap-4">
                 <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Eye className="h-5 w-5 text-blue-600" />
                 </div>
                 <div>
                    <CardTitle className="text-lg font-bold uppercase tracking-tight italic">Visibility Logic</CardTitle>
                    <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update your profile exposure status.</CardDescription>
                 </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 italic">Network Exposure</Label>
                  <Select 
                    value={settings.privacy.profile_visible ? "alumni" : "connections"} 
                    onValueChange={(v) => handlePrivacyChange("profile_visible", v === "alumni")}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                       <SelectItem value="public" className="text-[10px] font-black uppercase tracking-widest">Global Access</SelectItem>
                       <SelectItem value="alumni" className="text-[10px] font-black uppercase tracking-widest">Verified Alumni Only</SelectItem>
                       <SelectItem value="connections" className="text-[10px] font-black uppercase tracking-widest">Direct Synergy Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 italic">Matrix Searchability</Label>
                  <Select 
                    value={settings.privacy.search_visible || "yes"} 
                    onValueChange={(v) => handlePrivacyChange("search_visible", v)}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                       <SelectItem value="yes" className="text-[10px] font-black uppercase tracking-widest">Integrated (Index)</SelectItem>
                       <SelectItem value="no" className="text-[10px] font-black uppercase tracking-widest">Isolated (Untraceable)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-slate-50">
                 <div className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/30">
                    <div>
                       <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight italic">Relay Mail Disclosure</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Allow verified entities to view direct email coordinates.</p>
                    </div>
                    <Switch 
                      checked={settings.privacy.email_visible} 
                      onCheckedChange={(checked) => handlePrivacyChange("email_visible", checked)}
                      className="data-[state=checked]:bg-blue-600" 
                    />
                 </div>
                 <div className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/30">
                    <div>
                       <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight italic">Batch / Class Visibility</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Allow members to see your graduation information.</p>
                    </div>
                    <Switch 
                      checked={settings.privacy.graduation_year_visible} 
                      onCheckedChange={(checked) => handlePrivacyChange("graduation_year_visible", checked)}
                      className="data-[state=checked]:bg-blue-600" 
                    />
                 </div>
              </div>
            </CardContent>
          </Card>

          {/* Relay pulse */}
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden group">
            <CardHeader className="p-8 pb-4 border-b border-slate-50 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20">
              <div className="flex items-center gap-4">
                 <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-purple-600" />
                 </div>
                 <div>
                    <CardTitle className="text-lg font-bold uppercase tracking-tight italic">Relay Pulse</CardTitle>
                    <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Define your alert and notification boundaries.</CardDescription>
                 </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              {settings.notifications.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-3xl hover:bg-slate-50 transition-colors">
                   <div className="flex items-center gap-4">
                      <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center">
                         <item.icon className="h-4 w-4 text-slate-400" />
                      </div>
                      <div>
                         <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight italic">{item.label}</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.desc}</p>
                      </div>
                   </div>
                   <Switch 
                    checked={item.checked} 
                    onCheckedChange={() => handleNotificationToggle(item.notificationType)}
                    className="data-[state=checked]:bg-purple-600" 
                   />
                </div>
              ))}
            </CardContent>
          </Card>

          <footer className="flex justify-end items-center gap-4 pt-4 border-t border-slate-100">
             <Button variant="ghost" className="h-12 px-8 rounded-xl font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900">Restore Default Protocol</Button>
             <Button 
               className="h-12 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 text-white font-bold uppercase tracking-widest text-[10px]"
               onClick={handleSave}
               disabled={saving}
             >
                {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Save Configuration
             </Button>
          </footer>
        </div>
      </div>
    </div>
  );
}