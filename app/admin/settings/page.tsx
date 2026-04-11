"use client";

import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Save, 
  Shield, 
  Bell, 
  Mail, 
  Globe, 
  Database,
  Lock,
  RefreshCw,
  Cpu
} from "lucide-react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    siteName: "AlumniConnect",
    siteDescription: "Bridging Graduates, Building Futures",
    contactEmail: "admin@alumniconnect.edu",
    requireEmailVerification: true,
    allowRegistrations: true,
    emailNotifications: true,
    adminAlerts: true,
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    toast.success("Settings saved successfully");
    setSaving(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
           <p className="text-slate-500 mt-1">Configure global parameters and security protocols.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
           {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
           Save Settings
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
         <TabsList className="mb-8">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
         </TabsList>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
               <TabsContent value="general" className="m-0">
                  <Card>
                     <CardHeader>
                        <CardTitle>Organization Info</CardTitle>
                        <CardDescription>Basic details about your alumni portal.</CardDescription>
                     </CardHeader>
                     <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <Label>Portal Name</Label>
                              <Input 
                                value={settings.siteName} 
                                onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                              />
                           </div>
                           <div className="space-y-2">
                              <Label>Contact Email</Label>
                              <Input 
                                value={settings.contactEmail} 
                                onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                              />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <Label>Portal Description</Label>
                           <Textarea 
                             value={settings.siteDescription} 
                             onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                             className="min-h-[100px]"
                           />
                        </div>
                     </CardContent>
                  </Card>
               </TabsContent>

               <TabsContent value="security" className="m-0">
                  <Card>
                     <CardHeader>
                        <CardTitle>Security & Access</CardTitle>
                        <CardDescription>Manage how users join and authenticate.</CardDescription>
                     </CardHeader>
                     <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border">
                           <div>
                              <p className="text-sm font-semibold">Email Verification</p>
                              <p className="text-xs text-slate-500">Require users to verify their email address before access.</p>
                           </div>
                           <Switch checked={settings.requireEmailVerification} onCheckedChange={(c) => setSettings({...settings, requireEmailVerification: c})} />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border">
                           <div>
                              <p className="text-sm font-semibold">Allow Registrations</p>
                              <p className="text-xs text-slate-500">Allow new users to create accounts without an invitation.</p>
                           </div>
                           <Switch checked={settings.allowRegistrations} onCheckedChange={(c) => setSettings({...settings, allowRegistrations: c})} />
                        </div>
                     </CardContent>
                  </Card>
               </TabsContent>

               <TabsContent value="notifications" className="m-0">
                  <Card>
                     <CardHeader>
                        <CardTitle>Notification Settings</CardTitle>
                        <CardDescription>Configure global notification behavior.</CardDescription>
                     </CardHeader>
                     <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border">
                           <div>
                              <p className="text-sm font-semibold">Push Notifications</p>
                              <p className="text-xs text-slate-500">Enable real-time browser notifications for users.</p>
                           </div>
                           <Switch checked={settings.emailNotifications} onCheckedChange={(c) => setSettings({...settings, emailNotifications: c})} />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border">
                           <div>
                              <p className="text-sm font-semibold">Admin Security Alerts</p>
                              <p className="text-xs text-slate-500">Send alerts to administrators regarding suspicious activity.</p>
                           </div>
                           <Switch checked={settings.adminAlerts} onCheckedChange={(c) => setSettings({...settings, adminAlerts: c})} />
                        </div>
                     </CardContent>
                  </Card>
               </TabsContent>
            </div>

            <div className="space-y-6">
               <Card className="bg-slate-900 text-white">
                  <CardHeader>
                     <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5 text-indigo-400" />
                        System Security
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <p className="text-sm text-slate-400">Your system is currently in secure mode. All data is encrypted and backed up daily.</p>
                     <Button variant="secondary" className="w-full">
                        Run Security Audit
                     </Button>
                  </CardContent>
               </Card>
               
               <Card>
                  <CardHeader>
                     <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Platform Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                     <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Version</span>
                        <span className="font-semibold text-slate-900">1.2.0</span>
                     </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Environment</span>
                        <span className="font-semibold text-slate-900">Production</span>
                     </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Uptime</span>
                        <span className="font-semibold text-emerald-600">99.9%</span>
                     </div>
                  </CardContent>
               </Card>
            </div>
         </div>
      </Tabs>
    </div>
  );
}