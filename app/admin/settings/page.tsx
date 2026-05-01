"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Save, Shield, Bell, Globe, Lock, RefreshCw,
  CheckCircle2, Building2, Mail, Users, Key, Palette,
  Smartphone, Database, Layout
} from "lucide-react";
import { toast } from "sonner";
import { useAuthProfile } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";

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
    <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
             <Icon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{title}</p>
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

export default function AdminSettingsPage() {
  const { profile, organization, loading: profileLoading } = useAuthProfile();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState({
    siteName: "",
    siteDescription: "",
    contactEmail: "",
    website: "",
    requireEmailVerification: true,
    allowRegistrations: true,
    requireAdminApproval: false,
    allowStudentJobPost: false,
    allowPublicEvents: true,
    emailNotifications: true,
    adminAlerts: true,
    weeklyReport: false,
    newMemberAlert: true,
    primaryColor: "#3b82f6",
    darkModeEnabled: false,
    mfaRequired: false
  });

  const orgId = profile?.organizationId;

  useEffect(() => {
    const fetchSettings = async () => {
      if (!orgId) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/settings?organizationId=${orgId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }));
        }
      } catch { /* ignore */ } finally { setLoading(false); }
    };
    if (profile && orgId) fetchSettings();
    else if (profile && !orgId) setLoading(false);
  }, [profile, orgId]);

  const handleSave = async () => {
    if (!orgId) { toast.error("No organization found"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId, settings }),
      });
      if (res.ok) toast.success("Institutional settings updated successfully");
      else toast.error("Failed to update settings");
    } catch {
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 animate-in fade-in duration-300">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-[2.5rem]" />
        <Skeleton className="h-96 w-full rounded-[2.5rem]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Console Settings</h1>
          <p className="text-slate-500 font-medium text-sm">Configure your institution's digital presence and platform logic.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-lg shadow-blue-500/20"
        >
          {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-8">
        <TabsList className="bg-slate-50 p-1 rounded-2xl border border-slate-100 h-auto w-auto">
          <TabsTrigger value="general" className="px-6 py-2 rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">General</TabsTrigger>
          <TabsTrigger value="security" className="px-6 py-2 rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Security</TabsTrigger>
          <TabsTrigger value="notifications" className="px-6 py-2 rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Notifications</TabsTrigger>
          <TabsTrigger value="appearance" className="px-6 py-2 rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
          <SectionCard title="Institutional Profile" description="Basic information" icon={Building2}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Platform Title</Label>
                  <Input 
                    placeholder="e.g. Alumni Hub" 
                    className="h-11 rounded-xl bg-slate-50 border-none font-medium"
                    value={settings.siteName}
                    onChange={e => setSettings({...settings, siteName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Contact Email</Label>
                  <Input 
                    placeholder="support@institution.edu" 
                    className="h-11 rounded-xl bg-slate-50 border-none font-medium"
                    value={settings.contactEmail}
                    onChange={e => setSettings({...settings, contactEmail: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Official Website</Label>
                <Input 
                  placeholder="https://institution.edu" 
                  className="h-11 rounded-xl bg-slate-50 border-none font-medium"
                  value={settings.website}
                  onChange={e => setSettings({...settings, website: e.target.value})}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Platform Logic" description="Membership and access" icon={Shield}>
             <SettingRow label="Allow Public Registrations" description="New users can create accounts without an invitation.">
               <Switch checked={settings.allowRegistrations} onCheckedChange={v => setSettings({...settings, allowRegistrations: v})} />
             </SettingRow>
             <SettingRow label="Require Admin Approval" description="Manually verify every new member before they can access the dashboard.">
               <Switch checked={settings.requireAdminApproval} onCheckedChange={v => setSettings({...settings, requireAdminApproval: v})} />
             </SettingRow>
             <SettingRow label="Allow Student Job Postings" description="Let students post career opportunities directly.">
               <Switch checked={settings.allowStudentJobPost} onCheckedChange={v => setSettings({...settings, allowStudentJobPost: v})} />
             </SettingRow>
          </SectionCard>
        </TabsContent>

        <TabsContent value="security" className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
           <SectionCard title="Authentication & Privacy" description="System hardening" icon={Lock}>
             <SettingRow label="Enforce Email Verification" description="Users must verify their email before taking any action.">
               <Switch checked={settings.requireEmailVerification} onCheckedChange={v => setSettings({...settings, requireEmailVerification: v})} />
             </SettingRow>
             <SettingRow label="Two-Factor Authentication (MFA)" description="Require MFA for all administrative accounts.">
               <Switch checked={settings.mfaRequired} onCheckedChange={v => setSettings({...settings, mfaRequired: v})} />
             </SettingRow>
           </SectionCard>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
           <SectionCard title="System Alerts" description="Email and push" icon={Bell}>
             <SettingRow label="Admin Critical Alerts" description="Get notified about failed verifications or system errors.">
               <Switch checked={settings.adminAlerts} onCheckedChange={v => setSettings({...settings, adminAlerts: v})} />
             </SettingRow>
             <SettingRow label="New Member Notifications" description="Receive an email when a new user joins the platform.">
               <Switch checked={settings.newMemberAlert} onCheckedChange={v => setSettings({...settings, newMemberAlert: v})} />
             </SettingRow>
             <SettingRow label="Weekly Performance Digest" description="A summary of institutional engagement sent every Monday.">
               <Switch checked={settings.weeklyReport} onCheckedChange={v => setSettings({...settings, weeklyReport: v})} />
             </SettingRow>
           </SectionCard>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
           <SectionCard title="Branding & UI" description="Visual identity" icon={Palette}>
             <div className="space-y-6">
                <div className="space-y-2">
                   <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Brand Primary Color</Label>
                   <div className="flex gap-4 items-center">
                      <Input 
                        type="color" 
                        className="h-11 w-20 rounded-xl border-none p-1 cursor-pointer bg-slate-50"
                        value={settings.primaryColor}
                        onChange={e => setSettings({...settings, primaryColor: e.target.value})}
                      />
                      <p className="text-xs font-bold text-slate-500 uppercase">{settings.primaryColor}</p>
                   </div>
                </div>
                <SettingRow label="Dark Mode" description="Enable institutional dark theme for the entire dashboard.">
                   <Switch checked={settings.darkModeEnabled} onCheckedChange={v => setSettings({...settings, darkModeEnabled: v})} />
                </SettingRow>
             </div>
           </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}