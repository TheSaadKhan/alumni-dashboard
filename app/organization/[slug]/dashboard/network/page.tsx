"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  MapPin, 
  GraduationCap, 
  Users, 
  Filter, 
  UserPlus, 
  RefreshCw,
  ChevronRight,
  Globe
} from "lucide-react";
import { useAuthProfile } from "@/context/AuthContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function NetworkPage() {
  const router = useRouter();
  const { profile, organization, loading: profileLoading } = useAuthProfile();
  const [searchTerm, setSearchTerm] = useState("");
  const [alumni, setAlumni] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const slug = organization?.slug || "default";

  const fetchNetwork = useCallback(async () => {
    if (!profile?.organizationId) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/network?organizationId=${profile.organizationId}&query=${searchTerm}`);
      if (res.ok) {
        const data = await res.json();
        setAlumni(data.network || []);
      }
    } catch (err) {
      toast.error("Failed to load network members");
    } finally {
      setLoading(false);
    }
  }, [profile, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (profile) fetchNetwork();
    }, 500);
    return () => clearTimeout(timer);
  }, [profile, fetchNetwork]);

  if (profileLoading) {
    return (
       <div className="flex h-[60vh] items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-200" />
       </div>
    );
  }

  if (!profile?.organizationId) {
    return (
      <div className="container py-24 text-center max-w-sm mx-auto space-y-6">
         <Globe className="h-12 w-12 text-slate-200 mx-auto" />
         <h1 className="text-xl font-bold">No Organization</h1>
         <p className="text-sm text-slate-500">You need to be part of an organization to view the network.</p>
         <Button className="w-full" onClick={() => router.push("/organization/setup")}>
            Setup Organization
         </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl mx-auto px-4 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h1 className="text-3xl font-bold text-slate-900">Member Directory</h1>
           <p className="text-slate-500 mt-1">Connect with graduates and students from your institution.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
           <UserPlus className="h-4 w-4 mr-2" /> Invite Member
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex-1 relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Search by name, role, or skills..."
            className="pl-10 h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-11">
          <Filter className="h-4 w-4 mr-2" /> Filter
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {alumni.map((person) => (
          <Card key={person.id} className="hover:shadow-md transition-shadow overflow-hidden group">
             <div className="h-24 bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative">
                <Avatar className="h-20 w-20 border-4 border-white dark:border-slate-900 absolute -bottom-10">
                   <AvatarImage src={person.avatar} />
                   <AvatarFallback className="text-xl font-bold">{person.name?.[0]}</AvatarFallback>
                </Avatar>
             </div>
             <CardHeader className="pt-12 text-center pb-4">
                <CardTitle className="text-base font-bold">{person.name}</CardTitle>
                <CardDescription className="text-xs truncate">{person.headline || "Alumni Member"}</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="space-y-2 text-xs text-slate-500">
                   <div className="flex items-center gap-2">
                       <MapPin className="h-3.5 w-3.5" />
                       <span className="truncate">{person.location || "Location not set"}</span>
                   </div>
                   <div className="flex items-center gap-2">
                       <GraduationCap className="h-3.5 w-3.5" />
                       <span className="truncate">{person.major || "Member"} • {person.graduationYear || "2024"}</span>
                   </div>
                </div>
                <div className="flex flex-wrap gap-1">
                   {(person.skills || []).slice(0, 3).map((skill: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-[10px] px-2 py-0">
                         {skill}
                      </Badge>
                   ))}
                </div>
                <Button variant="outline" className="w-full text-xs" onClick={() => router.push(`/organization/${slug}/dashboard/network/${person.id}`)}>
                    View Profile
                </Button>
             </CardContent>
          </Card>
        ))}
      </div>

      {alumni.length === 0 && !loading && (
        <div className="py-20 text-center space-y-4">
           <Users className="h-12 w-12 text-slate-200 mx-auto" />
           <p className="text-slate-500">No members found matching your search.</p>
           <Button variant="link" onClick={() => setSearchTerm("")}>Clear search</Button>
        </div>
      )}
    </div>
  );
}
