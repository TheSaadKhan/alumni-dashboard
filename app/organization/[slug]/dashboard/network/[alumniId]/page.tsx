"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Mail, 
  MessageCircle, 
  Users, 
  ArrowLeft, 
  Globe, 
  Linkedin, 
  Github, 
  RefreshCw,
  Info
} from "lucide-react";
import { useAuthProfile } from "@/context/AuthContext";
import { toast } from "sonner";

export default function AlumniProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { profile: myProfile, organization } = useAuthProfile();
  const alumniId = params.alumniId as string;
  const slug = organization?.slug || "default";

  const [alumni, setAlumni] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [alumniId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/profiles/${alumniId}`);
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setAlumni(data.profile);
    } catch (err) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = () => {
    router.push(`/organization/${slug}/dashboard/messages?userId=${alumniId}`);
  };

  if (loading) {
     return (
        <div className="flex h-[70vh] items-center justify-center">
           <RefreshCw className="h-6 w-6 animate-spin text-slate-200" />
        </div>
     );
  }

  if (!alumni) {
     return (
        <div className="container py-24 text-center max-w-sm mx-auto space-y-6">
           <Info className="h-12 w-12 text-slate-200 mx-auto" />
           <h1 className="text-xl font-bold">Profile Not Found</h1>
           <p className="text-sm text-slate-500">The requested profile could not be found.</p>
           <Button className="w-full" onClick={() => router.push(`/organization/${slug}/dashboard/network`)}>
              Back to Network
           </Button>
        </div>
     );
  }

  const skills = alumni.skills ? (Array.isArray(alumni.skills) ? alumni.skills : Object.keys(alumni.skills)) : [];

  return (
    <div className="container py-8 max-w-5xl mx-auto px-4 space-y-8">
      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-slate-500">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      {/* Header Card */}
      <Card className="shadow-sm border overflow-hidden">
          <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                  <Avatar className="h-32 w-32 border shadow-sm">
                      <AvatarImage src={alumni.avatar_url || ""} />
                      <AvatarFallback className="text-2xl font-bold">{alumni.full_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-6 text-center md:text-left">
                      <div>
                          <div className="flex flex-col md:flex-row items-center gap-3">
                              <h1 className="text-3xl font-bold text-slate-900">{alumni.full_name}</h1>
                              {alumni.graduation_year && (
                                <Badge variant="secondary">Class of {alumni.graduation_year}</Badge>
                              )}
                          </div>
                          <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mt-3 text-sm text-slate-500">
                              <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {alumni.headline || "Member"}</span>
                              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {alumni.location || "Global"}</span>
                              <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> {alumni.email}</span>
                          </div>
                      </div>
                      <div className="flex justify-center md:justify-start gap-3">
                          <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleMessage}>
                              <MessageCircle className="h-4 w-4 mr-2" /> Message
                          </Button>
                          <Button variant="outline">
                              <Users className="h-4 w-4 mr-2" /> Connect
                          </Button>
                      </div>
                  </div>
              </div>
          </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="space-y-6">
              <Card>
                  <CardHeader>
                      <CardTitle className="text-sm font-bold uppercase text-slate-400">Institutional Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      {alumni.degree && (
                          <div className="flex items-start gap-3 text-sm">
                              <GraduationCap className="h-5 w-5 text-slate-300" />
                              <p className="font-semibold">{alumni.degree}</p>
                          </div>
                      )}
                      <div className="flex items-start gap-3 text-sm">
                          <Globe className="h-5 w-5 text-slate-300" />
                          <p className="text-slate-600">Verified Member</p>
                      </div>
                  </CardContent>
              </Card>

              <Card>
                  <CardHeader>
                      <CardTitle className="text-sm font-bold uppercase text-slate-400">Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="flex flex-wrap gap-2">
                          {skills.length > 0 ? skills.map((skill: string, i: number) => (
                              <Badge key={i} variant="secondary">{skill}</Badge>
                          )) : <p className="text-xs text-slate-400">No skills identified.</p>}
                      </div>
                  </CardContent>
              </Card>
          </div>

          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>About</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {alumni.bio || "No bio information provided."}
                        </p>
                    </CardContent>
                </Card>

                {alumni.headline && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Experience</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 p-4 border rounded-lg">
                                <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center">
                                    <Briefcase className="h-5 w-5 text-slate-500" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">{alumni.headline}</p>
                                    <p className="text-xs text-slate-500">Professional Member</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
          </div>
      </div>
    </div>
  );
}