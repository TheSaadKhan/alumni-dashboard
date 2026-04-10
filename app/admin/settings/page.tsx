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
  Eye,
  Settings2,
  ChevronRight,
  ShieldCheck,
  Zap,
  Activity,
  Download,
  RefreshCw,
  Cpu
} from "lucide-react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    siteName: "AlumniConnect",
    siteDescription: "Bridging Graduates, Building Futures",
    contactEmail: "admin@alumniconnect.edu",
    supportEmail: "support@alumniconnect.edu",
    requireEmailVerification: true,
    allowRegistrations: true,
    maxLoginAttempts: 5,
    sessionTimeout: 24,
    emailNotifications: true,
    adminAlerts: true,
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    toast.success("Platform configuration updated");
    setSaving(false);
  };

  return (
    <div className="container py-8 max-w-7xl mx-auto px-6 space-y-10 animate-in fade-in duration-700">
      {/* Settings Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em]">Institutional Control</span>
              <div className="h-1 w-1 rounded-full bg-slate-300"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Nexus Core v1.2.0</span>
           </div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Platform Governance</h1>
           <p className="text-slate-500 font-medium mt-1">Regulate institutional parameters, security protocols, and global relay logic.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="h-12 rounded-xl font-bold px-10 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/10">
           {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-3" /> : <Save className="h-4 w-4 mr-3" />}
           Save Configuration
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
         <TabsList className="bg-slate-100 dark:bg-slate-950/40 p-1.5 rounded-2xl w-fit flex gap-1 mb-10 overflow-x-auto no-scrollbar">
            {[
              { id: "general", icon: Globe, label: "Identity Nexus" },
              { id: "security", icon: Shield, label: "Shield Access" },
              { id: "notifications", icon: Bell, label: "Alert Matrix" },
              { id: "email", icon: Mail, label: "Relay Hub" },
              { id: "advanced", icon: Cpu, label: "Kernel Logic" }
            ].map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id} 
                className="h-10 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-400"
              >
                 <tab.icon className="h-3.5 w-3.5 mr-2" />
                 {tab.label}
              </TabsTrigger>
            ))}
         </TabsList>

         <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            <div className="lg:col-span-3 space-y-8">
               <TabsContent value="general" className="m-0 animate-in fade-in slide-in-from-bottom-2">
                  <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-10">
                     <div className="space-y-10">
                        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                           <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                              <Globe className="h-6 w-6 text-blue-600" />
                           </div>
                           <div>
                              <h3 className="text-xl font-bold italic uppercase tracking-tighter">Identity Core</h3>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Foundation institutional identifiers.</p>
                           </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-3">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Institutional Alias</Label>
                              <Input 
                                value={settings.siteName} 
                                onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                                className="h-12 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest" 
                              />
                           </div>
                           <div className="space-y-3">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Primary Relay Coordinates</Label>
                              <Input 
                                value={settings.contactEmail} 
                                onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                                className="h-12 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest" 
                              />
                           </div>
                        </div>
                        <div className="space-y-3">
                           <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Mission Manifesto</Label>
                           <Textarea 
                             value={settings.siteDescription} 
                             onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                             className="rounded-2xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-[10px] font-bold uppercase tracking-widest min-h-[140px] p-4 resize-none leading-loose" 
                           />
                        </div>
                     </div>
                  </Card>
               </TabsContent>

               <TabsContent value="security" className="m-0 animate-in fade-in slide-in-from-bottom-2">
                  <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-10">
                     <div className="space-y-10">
                        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                           <div className="h-12 w-12 bg-rose-50 rounded-2xl flex items-center justify-center">
                              <ShieldCheck className="h-6 w-6 text-rose-600" />
                           </div>
                           <div>
                              <h3 className="text-xl font-bold italic uppercase tracking-tighter">Shield Protocols</h3>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authentication telemetry and threat logic.</p>
                           </div>
                        </div>
                        <div className="space-y-4">
                           {[
                             { id: "requireEmailVerification", label: "Verify Entity Integrity", desc: "Mandate email authentication for all network nodes.", icon: Shield },
                             { id: "allowRegistrations", label: "Open Pulse Registration", desc: "Enable external entities to initialize identity nodes.", icon: Globe }
                           ].map((item) => (
                             <div key={item.id} className="flex items-center justify-between p-6 rounded-[2rem] bg-slate-50/50 hover:bg-white transition-all group">
                                <div className="flex items-center gap-4">
                                   <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                      <item.icon className="h-4 w-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                                   </div>
                                   <div>
                                      <p className="text-sm font-bold text-slate-900 uppercase italic leading-none">{item.label}</p>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 italic">{item.desc}</p>
                                   </div>
                                </div>
                                <Switch checked={(settings as any)[item.id]} onCheckedChange={(c) => setSettings({...settings, [item.id]: c})} className="bg-slate-200" />
                             </div>
                           ))}
                        </div>
                     </div>
                  </Card>
               </TabsContent>

               <TabsContent value="notifications" className="m-0 animate-in fade-in slide-in-from-bottom-2">
                  <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-10">
                     <div className="space-y-10">
                        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                           <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                              <Bell className="h-6 w-6 text-amber-600" />
                           </div>
                           <div>
                              <h3 className="text-xl font-bold italic uppercase tracking-tighter">Alert Matrix</h3>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global platform-to-entity relay configuration.</p>
                           </div>
                        </div>
                        <div className="space-y-4">
                           {[
                             { id: "emailNotifications", label: "Relay Pulse", desc: "Standardized system-wide notification broadcasting.", icon: Zap },
                             { id: "adminAlerts", label: "Kernel Sentry Alerts", desc: "Critical security and governance alerts for administrators.", icon: Shield }
                           ].map((item) => (
                             <div key={item.id} className="flex items-center justify-between p-6 rounded-[2rem] bg-slate-50/50 hover:bg-white transition-all group">
                                <div className="flex items-center gap-4">
                                   <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                      <item.icon className="h-4 w-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
                                   </div>
                                   <div>
                                      <p className="text-sm font-bold text-slate-900 uppercase italic leading-none">{item.label}</p>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 italic">{item.desc}</p>
                                   </div>
                                </div>
                                <Switch checked={(settings as any)[item.id]} onCheckedChange={(c) => setSettings({...settings, [item.id]: c})} />
                             </div>
                           ))}
                        </div>
                     </div>
                  </Card>
               </TabsContent>
            </div>

            <div className="lg:col-span-1 space-y-8">
               <Card className="border-none shadow-sm rounded-[2.5rem] bg-indigo-600 p-8 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-1000 rotate-12">
                     <ShieldCheck className="h-32 w-32" />
                  </div>
                  <div className="relative z-10 space-y-6">
                     <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                        <Lock className="h-6 w-6" />
                     </div>
                     <div>
                        <h4 className="text-xl font-bold uppercase italic tracking-tighter">Security Audit</h4>
                        <p className="text-indigo-100/60 text-[10px] font-black uppercase tracking-widest mt-2 leading-loose">Systematic scan of institutional authentication logs and nodal access.</p>
                     </div>
                     <Button className="w-full h-12 rounded-2xl bg-white text-indigo-700 hover:bg-white/90 text-[10px] font-black uppercase tracking-widest shadow-xl">
                        Dispatch Sentry
                     </Button>
                  </div>
               </Card>

               <Card className="border-none shadow-sm rounded-[2.5rem] bg-white/60 backdrop-blur-xl p-8 space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic mb-4">Resource Management</h4>
                  <div className="space-y-2">
                     {[
                       { label: "Identity Export", icon: Download, sub: "JSON Payload" },
                       { label: "Matrix Sync", icon: RefreshCw, sub: "Kernel Node" },
                       { label: "Heartbeat Log", icon: Activity, sub: "System Logic" }
                     ].map((item, i) => (
                        <button key={i} className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all group">
                           <div className="flex items-center gap-4">
                              <div className="h-9 w-9 bg-white shadow-sm rounded-xl flex items-center justify-center text-slate-300 group-hover:text-blue-600 transition-colors">
                                 <item.icon className="h-4 w-4" />
                              </div>
                              <div className="text-left">
                                 <p className="text-[11px] font-bold text-slate-900 uppercase italic">{item.label}</p>
                                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-0.5">{item.sub}</p>
                              </div>
                           </div>
                           <ChevronRight className="h-3.5 w-3.5 text-slate-100 group-hover:text-slate-400 transition-transform" />
                        </button>
                     ))}
                  </div>
               </Card>
            </div>
         </div>
      </Tabs>

      <footer className="pt-10 border-t border-slate-50 flex items-center justify-center">
         <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Integrated Nexus Governor v1.2.0 • System Registry</p>
      </footer>
    </div>
  );
}