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
  Monitor,
  Eye,
  RefreshCw,
  ChevronRight,
  Check
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
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
      { notificationType: "email", label: "Email Notifications", desc: "Receive updates via your primary email.", icon: Mail, checked: true },
      { notificationType: "desktop", label: "Desktop Alerts", desc: "Show push notifications on your computer.", icon: Monitor, checked: true },
      { notificationType: "activity", label: "Activity Pings", desc: "Notify when someone likes or comments on your post.", icon: User, checked: true }
    ]
  });

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

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-slate-200" />
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-5xl mx-auto px-4 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
           <p className="text-slate-500 mt-1">Manage your account preferences and notification settings.</p>
        </div>
        <Button variant="outline" onClick={fetchSettings}>
           <RefreshCw className="h-4 w-4 mr-2" /> Sync Account
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-1">
          {[
            { id: "profile", label: "Profile Information", icon: User, active: true },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "privacy", label: "Privacy & Visibility", icon: Shield },
            { id: "communication", label: "Messages", icon: Mail },
            { id: "preferences", label: "Appearance", icon: Monitor }
          ].map((item) => (
            <Button
              key={item.id}
              variant={item.active ? "secondary" : "ghost"}
              className="w-full justify-start gap-3 h-11"
            >
              <item.icon className={`h-4 w-4 ${item.active ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className="text-sm font-medium">{item.label}</span>
            </Button>
          ))}
        </div>

        <div className="lg:col-span-3 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Visibility Settings</CardTitle>
              <CardDescription>Control how your profile is seen by other members.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase">Profile Visibility</Label>
                  <Select 
                    value={settings.privacy.profile_visible ? "alumni" : "connections"} 
                    onValueChange={(v) => handlePrivacyChange("profile_visible", v === "alumni")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="public">Anyone can view</SelectItem>
                       <SelectItem value="alumni">Only verified members</SelectItem>
                       <SelectItem value="connections">Only direct connections</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase">Searchability</Label>
                  <Select 
                    value={settings.privacy.search_visible || "yes"} 
                    onValueChange={(v) => handlePrivacyChange("search_visible", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="yes">Appear in search results</SelectItem>
                       <SelectItem value="no">Hide from search results</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                 <div className="flex items-center justify-between">
                    <div>
                       <p className="text-sm font-semibold">Show Email Address</p>
                       <p className="text-xs text-slate-500">Allow members to see your email address on your profile.</p>
                    </div>
                    <Switch 
                      checked={settings.privacy.email_visible} 
                      onCheckedChange={(checked) => handlePrivacyChange("email_visible", checked)} 
                    />
                 </div>
                 <div className="flex items-center justify-between">
                    <div>
                       <p className="text-sm font-semibold">Show Batch / Class</p>
                       <p className="text-xs text-slate-500">Allow other members to see your graduation information.</p>
                    </div>
                    <Switch 
                      checked={settings.privacy.graduation_year_visible} 
                      onCheckedChange={(checked) => handlePrivacyChange("graduation_year_visible", checked)} 
                    />
                 </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified of new activity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.notifications.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
                   <div className="flex items-center gap-4">
                      <div className="h-9 w-9 rounded-md bg-slate-100 flex items-center justify-center">
                         <item.icon className="h-4 w-4 text-slate-500" />
                      </div>
                      <div>
                         <p className="text-sm font-semibold">{item.label}</p>
                         <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                   </div>
                   <Switch 
                    checked={item.checked} 
                    onCheckedChange={() => handleNotificationToggle(item.notificationType)} 
                   />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-4 border-t">
             <Button variant="ghost" disabled={saving}>Cancel</Button>
             <Button 
              className="bg-indigo-600 hover:bg-indigo-700 font-bold px-8" 
              onClick={handleSave} 
              disabled={saving}
             >
                {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Save Changes
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}