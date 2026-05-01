"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { createOrganizationAction, CreateOrgInput } from "@/app/actions/createOrganization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Building2, Globe, ImageIcon, FileText, Loader2, Search
} from "lucide-react";
import { Country, City } from "country-state-city";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SetupOrganizationPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [loading, setLoading] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  type OrgFormState = {
    name: string;
    type: string;
    description: string;
    website: string;
    logoUrl: string;
    primaryColor: string;
    countryCode: string;
    city: string;
  };

  const [form, setForm] = useState<OrgFormState>({
    name: "",
    type: "college",
    description: "",
    website: "",
    logoUrl: "",
    primaryColor: "#2563eb",
    countryCode: "IN",
    city: "",
  });

  const [citySearch, setCitySearch] = useState("");
  const [filteredCities, setFilteredCities] = useState<any[]>([]);

  useEffect(() => {
    if (isLoaded) {
      if (!user) {
        router.push("/sign-in");
      } else if (user.publicMetadata?.userType !== "super_admin") {
        router.push("/dashboard");
      } else {
        setCheckingAccess(false);
      }
    }
  }, [isLoaded, user, router]);

  useEffect(() => {
    if (citySearch.length > 2) {
      const cities = City.getCitiesOfCountry(form.countryCode || "IN") || [];
      const filtered = cities
        .filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase()))
        .slice(0, 8);
      setFilteredCities(filtered);
    } else {
      setFilteredCities([]);
    }
  }, [citySearch, form.countryCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Map flat form state to structured CreateOrgInput
      const payload: CreateOrgInput = {
        name: form.name,
        type: form.type,
        description: form.description,
        website: form.website,
        logoUrl: form.logoUrl,
        primaryColor: form.primaryColor,
        address: {
          country: form.countryCode || "IN",
          city: form.city,
        }
      };

      const res = await createOrganizationAction(payload);
      if (res.success) {
        toast.success("Organization created successfully!");
        router.push(`/organization/${res.slug}/dashboard`);
      } else {
        toast.error(res.error || "Failed to create organization");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
           <h1 className="text-2xl font-bold text-slate-900">Setup New Institution</h1>
           <p className="text-sm text-slate-500 font-medium">Create a dedicated network for your alumni and students.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="rounded-xl border border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardContent className="p-8 space-y-8">
              {/* Basic Info */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                   <Building2 className="h-4 w-4 text-blue-600" />
                   <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Institution Details</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Institution Name</Label>
                    <Input 
                      placeholder="e.g. Stanford University"
                      required
                      className="h-10 rounded-md bg-slate-50 border-slate-200"
                      value={form.name}
                      onChange={e => setForm({...form, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Institution Type</Label>
                    <Select value={form.type} onValueChange={v => setForm({...form, type: v as any})}>
                       <SelectTrigger className="h-10 rounded-md bg-slate-50 border-slate-200">
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                          <SelectItem value="college">College / University</SelectItem>
                          <SelectItem value="school">High School</SelectItem>
                          <SelectItem value="department">Department / Faculty</SelectItem>
                          <SelectItem value="other">Other Organization</SelectItem>
                       </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Description</Label>
                  <Textarea 
                    placeholder="Brief overview of the institution..."
                    className="min-h-[100px] rounded-md bg-slate-50 border-slate-200 resize-none"
                    value={form.description}
                    onChange={e => setForm({...form, description: e.target.value})}
                  />
                </div>
              </div>

              {/* Location & Contact */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                   <Globe className="h-4 w-4 text-blue-600" />
                   <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Location & Branding</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Country</Label>
                    <Select value={form.countryCode} onValueChange={v => setForm({...form, countryCode: v, city: ""})}>
                       <SelectTrigger className="h-10 rounded-md bg-slate-50 border-slate-200">
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                          {Country.getAllCountries().map(c => (
                            <SelectItem key={c.isoCode} value={c.isoCode}>{c.name}</SelectItem>
                          ))}
                       </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 relative">
                    <Label className="text-xs font-semibold text-slate-600">City</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="Search city..."
                        className="h-10 rounded-md bg-slate-50 border-slate-200 pl-9"
                        value={citySearch}
                        onChange={e => setCitySearch(e.target.value)}
                      />
                      {filteredCities.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-50 overflow-hidden">
                           {filteredCities.map(c => (
                             <button
                              key={c.name}
                              type="button"
                              onClick={() => { setForm({...form, city: c.name}); setCitySearch(c.name); setFilteredCities([]); }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                             >
                               {c.name}
                             </button>
                           ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Official Website</Label>
                    <Input 
                      placeholder="https://..."
                      className="h-10 rounded-md bg-slate-50 border-slate-200"
                      value={form.website}
                      onChange={e => setForm({...form, website: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Primary Color</Label>
                    <div className="flex gap-2">
                       <Input 
                        type="color"
                        className="h-10 w-12 p-1 rounded-md bg-slate-50 border-slate-200"
                        value={form.primaryColor}
                        onChange={e => setForm({...form, primaryColor: e.target.value})}
                       />
                       <Input 
                        placeholder="#000000"
                        className="h-10 flex-1 rounded-md bg-slate-50 border-slate-200"
                        value={form.primaryColor}
                        onChange={e => setForm({...form, primaryColor: e.target.value})}
                       />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Institution"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}