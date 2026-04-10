"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Loader2,
  Calendar,
  MapPin,
  Users,
  Tag,
  Clock,
  Globe,
  Video,
  Image as ImageIcon,
  Link,
  DollarSign,
  FileText,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Zap,
  ShieldCheck,
  Award,
  Flame,
  X,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthProfile } from "@/context/AuthContext";

type EventFormData = {
  title: string;
  description: string;
  event_type: string;
  start_date: string;
  end_date: string;
  location: string;
  virtual_link: string;
  max_attendees: string;
  registration_deadline: string;
  status: "draft" | "published";
  price: string;
  tags: string[];
  cover_image: string;
  featured: boolean;
  requires_approval: boolean;
  additional_info: string;
};

export default function CreateEventPage() {
  const router = useRouter();
  const { user } = useUser();
  const { profile } = useAuthProfile();
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [activeTab, setActiveTab] = useState("basic");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    event_type: "general",
    start_date: "",
    end_date: "",
    location: "",
    virtual_link: "",
    max_attendees: "",
    registration_deadline: "",
    status: "draft",
    price: "",
    tags: [],
    cover_image: "",
    featured: false,
    requires_approval: false,
    additional_info: "",
  });

  const organizationId = (profile as any)?.organizationId;

  // Add tag
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = "Event title is required";
    }

    if (!formData.start_date) {
      errors.start_date = "Start date is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!organizationId) {
      toast.error("Organization node not identified");
      return;
    }

    if (!validateForm()) {
      toast.error("Required identifiers missing or invalid");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        organizationId,
        title: formData.title,
        description: formData.description || null,
        event_type: formData.event_type,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        location: formData.location || null,
        virtual_link: formData.virtual_link || null,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        registration_deadline: formData.registration_deadline 
          ? new Date(formData.registration_deadline).toISOString() 
          : null,
        status: formData.status,
        price: formData.price ? parseFloat(formData.price) : null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        cover_image: formData.cover_image || null,
        featured: formData.featured,
        requires_approval: formData.requires_approval,
        additional_info: formData.additional_info || null,
      };

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to deploy event node");
      }

      const event = await res.json();
      
      toast.success("Event node deployed successfully");
      
      setTimeout(() => {
        router.push("/admin/events");
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || "Failed to deploy event asset");
    } finally {
      setLoading(false);
    }
  };

  const eventTypes = [
    { value: "reunion", label: "REUNION", icon: Users, color: "bg-purple-500" },
    { value: "webinar", label: "WEBINAR", icon: Video, color: "bg-blue-500" },
    { value: "career", label: "CAREER FAIR", icon: Globe, color: "bg-emerald-500" },
    { value: "workshop", label: "WORKSHOP", icon: Tag, color: "bg-amber-500" },
    { value: "general", label: "GENERAL", icon: Calendar, color: "bg-slate-500" },
  ];

  return (
    <div className="container py-8 max-w-5xl mx-auto px-6 space-y-8 animate-in fade-in duration-700">
      {/* Event Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
           <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900" onClick={() => router.push("/admin/events")}>
              <ArrowLeft className="h-4 w-4" />
           </Button>
           <div>
              <div className="flex items-center gap-2 mb-1">
                 <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em]">Event Orchestration</span>
                 <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Initialize Asset</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Deploy Event Cycle</h1>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="ghost" className="h-11 rounded-xl font-bold text-slate-400 px-6 uppercase text-[10px] tracking-widest" onClick={() => router.push("/admin/events")}>Abort</Button>
           <Button onClick={handleSubmit} disabled={loading} className="h-11 rounded-xl font-bold px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/10 uppercase text-[10px] tracking-widest">
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-3" /> : <Zap className="h-4 w-4 mr-3" />}
              Initialize Deployment
           </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
         <TabsList className="bg-slate-100 dark:bg-slate-950/40 p-1.5 rounded-2xl w-fit flex gap-1 mb-8 overflow-x-auto no-scrollbar h-12">
            {[
              { id: "basic", label: "Core Identity", icon: Calendar },
              { id: "details", label: "Temporal Vector", icon: Clock },
              { id: "settings", label: "Governance", icon: ShieldCheck },
              { id: "advanced", label: "Asset Meta", icon: Tag }
            ].map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id} 
                className="h-full px-8 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-400"
              >
                 <tab.icon className="h-3.5 w-3.5 mr-2" />
                 {tab.label}
              </TabsTrigger>
            ))}
         </TabsList>

         <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden p-10">
            <TabsContent value="basic" className="m-0 space-y-10 animate-in fade-in slide-in-from-bottom-2">
               <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Event Institutional Alias *</Label>
                  <Input 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="ANNUAL GRADUATE HUB 2024"
                    className="h-12 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest" 
                  />
               </div>
               <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Mission Narrative (Description)</Label>
                  <Textarea 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={6}
                    placeholder="DEFINE THE IMPACT OF THIS EVENT..."
                    className="rounded-2xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-[10px] font-bold uppercase tracking-widest p-4 resize-none leading-loose" 
                  />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Cycle Classification</Label>
                     <Select value={formData.event_type} onValueChange={(v) => setFormData({...formData, event_type: v})}>
                        <SelectTrigger className="h-12 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-[10px] font-black uppercase tracking-widest">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                           {eventTypes.map(t => <SelectItem key={t.value} value={t.value} className="text-[10px] font-black uppercase tracking-widest">{t.label}</SelectItem>)}
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Deployment State</Label>
                     <Select value={formData.status} onValueChange={(v: any) => setFormData({...formData, status: v})}>
                        <SelectTrigger className="h-12 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-[10px] font-black uppercase tracking-widest">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                           <SelectItem value="draft" className="text-[10px] font-black uppercase tracking-widest">Draft Node</SelectItem>
                           <SelectItem value="published" className="text-[10px] font-black uppercase tracking-widest">Live Deployment</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="details" className="m-0 space-y-10 animate-in fade-in slide-in-from-bottom-2">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Temporal Start Cycle *</Label>
                     <Input 
                        type="datetime-local" 
                        value={formData.start_date}
                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                        className="h-12 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-[10px] font-black uppercase tracking-widest" 
                     />
                  </div>
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Temporal Termination Cycle</Label>
                     <Input 
                        type="datetime-local" 
                        value={formData.end_date}
                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                        className="h-12 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-[10px] font-black uppercase tracking-widest" 
                     />
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Geographic Vertex (Location)</Label>
                     <Input 
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        placeholder="INSTITUTIONAL HUB - MAIN WING"
                        className="h-12 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest" 
                     />
                  </div>
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Virtual Relay Link</Label>
                     <Input 
                        value={formData.virtual_link}
                        onChange={(e) => setFormData({...formData, virtual_link: e.target.value})}
                        placeholder="HTTPS://MEET.ZOOM.US/..."
                        className="h-12 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest" 
                     />
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Identity Capacity (Max Attendees)</Label>
                     <Input 
                        type="number"
                        value={formData.max_attendees}
                        onChange={(e) => setFormData({...formData, max_attendees: e.target.value})}
                        className="h-12 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-[10px] font-black uppercase tracking-widest" 
                     />
                  </div>
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Access Yield (Ticket Price)</Label>
                     <Input 
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        placeholder="0.00"
                        className="h-12 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-[10px] font-black uppercase tracking-widest" 
                     />
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="settings" className="m-0 space-y-8 animate-in fade-in slide-in-from-bottom-2">
               {[
                 { id: "featured", label: "Priority Deployment", desc: "Highlight this asset on the institutional nexus homepage.", icon: Flame },
                 { id: "requires_approval", label: "Gateway Approval Protocol", desc: "Mandate manual verification for each identity node enrollment.", icon: ShieldCheck }
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
                    <Switch 
                       checked={(formData as any)[item.id]} 
                       onCheckedChange={(c) => setFormData({...formData, [item.id]: c})} 
                       className="bg-slate-200" 
                    />
                 </div>
               ))}
            </TabsContent>

            <TabsContent value="advanced" className="m-0 space-y-10 animate-in fade-in slide-in-from-bottom-2">
               <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Identity Clusters (Tags)</Label>
                  <div className="flex gap-4">
                     <Input 
                        placeholder="ENTER TAG IDENTIFIER..." 
                        value={tagInput} 
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        className="h-12 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-[10px] font-black uppercase tracking-widest" 
                     />
                     <Button type="button" onClick={addTag} className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 shadow-sm"><Plus className="h-5 w-5" /></Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                     {formData.tags.map((tag) => (
                        <Badge key={tag} className="px-5 py-2.5 bg-slate-50 text-slate-500 border-none font-black text-[9px] uppercase tracking-widest rounded-xl italic gap-3">
                           {tag}
                           <X className="h-3 w-3 cursor-pointer hover:text-rose-500" onClick={() => removeTag(tag)} />
                        </Badge>
                     ))}
                  </div>
               </div>
               <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Asset Visual Proxy (Cover Image URL)</Label>
                  <Input 
                    value={formData.cover_image} 
                    onChange={(e) => setFormData({...formData, cover_image: e.target.value})}
                    placeholder="HTTPS://EXAMPLE.COM/IMAGE.JPG"
                    className="h-12 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest" 
                  />
               </div>
               <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Additional Technical Payloads</Label>
                  <Textarea 
                    value={formData.additional_info} 
                    onChange={(e) => setFormData({...formData, additional_info: e.target.value})}
                    rows={4}
                    placeholder="SUPPLEMENTARY IDENTITY CONTEXT..."
                    className="rounded-2xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-[10px] font-bold uppercase tracking-widest p-4 resize-none leading-loose" 
                  />
               </div>
            </TabsContent>
         </Card>
      </Tabs>

      <footer className="pt-10 border-t border-slate-50 flex items-center justify-center">
         <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Integrated Event Deployment v1.0.2 • Institutional Nucleus</p>
      </footer>
    </div>
  );
}