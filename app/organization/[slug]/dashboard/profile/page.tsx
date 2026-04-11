"use client";

import { useAuthProfile } from "@/context/AuthContext";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    MapPin,
    GraduationCap,
    Briefcase,
    Globe,
    Linkedin,
    Github,
    Mail,
    Calendar,
    Edit,
    RefreshCw,
    ShieldCheck,
    ExternalLink
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const { profile, organization, loading } = useAuthProfile();
    const router = useRouter();

    const slug = organization?.slug || "default";

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-slate-200" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="container py-24 text-center max-w-sm mx-auto space-y-6">
                <ShieldCheck className="h-12 w-12 text-slate-200 mx-auto" />
                <h1 className="text-xl font-bold">No Profile Found</h1>
                <p className="text-sm text-slate-500">We couldn't find a profile for your account.</p>
                <Button className="w-full" onClick={() => router.push("/onboarding")}>
                    Complete Onboarding
                </Button>
            </div>
        );
    }

    const professional = profile.professional || profile.metadata?.professional || {};
    const social = profile.social || profile.metadata?.social || {};
    const skills = Array.isArray(profile.skills) ? profile.skills : [];

    return (
        <div className="container py-8 max-w-5xl mx-auto px-4 space-y-8">
            {/* Simple Header */}
            <Card className="border shadow-sm">
                <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                        <Avatar className="h-32 w-32 border">
                            <AvatarImage src={profile.avatarUrl || ""} />
                            <AvatarFallback className="text-2xl font-bold">{profile.fullName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-4 text-center md:text-left">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{profile.fullName}</h1>
                                <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mt-2 text-sm text-slate-500">
                                    <Badge variant="outline" className="capitalize">{profile.userType}</Badge>
                                    <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {profile.location || "Location not set"}</span>
                                    <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> {profile.email}</span>
                                </div>
                            </div>
                            <div className="flex justify-center md:justify-start gap-2">
                                <Button size="sm" onClick={() => router.push(`/organization/${slug}/dashboard/profile/edit`)}>
                                    <Edit className="h-4 w-4 mr-2" /> Edit Profile
                                </Button>
                                {social.linkedin_url && (
                                    <Button variant="outline" size="sm" onClick={() => window.open(social.linkedin_url, '_blank')}>
                                        <Linkedin className="h-4 w-4 mr-2" /> LinkedIn
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Stats & Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase text-slate-400">Education</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <GraduationCap className="h-5 w-5 text-slate-400" />
                                <div>
                                    <p className="font-semibold text-sm">{profile.degree || "Degree not specified"}</p>
                                    <p className="text-xs text-slate-500">{profile.details?.major || "Major not specified"}</p>
                                    <p className="text-xs text-slate-400 mt-1">Class of {profile.graduation_year || "N/A"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase text-slate-400">Skills</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {skills.length > 0 ? skills.map((skill: string) => (
                                    <Badge key={skill} variant="secondary">{skill}</Badge>
                                )) : <p className="text-xs text-slate-400">No skills added yet.</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>About</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                {profile.bio || "No bio provided."}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Experience</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {professional.company ? (
                                <div className="flex items-start gap-4 p-4 border rounded-lg">
                                    <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center">
                                        <Briefcase className="h-5 w-5 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{professional.current_position || "Position"}</p>
                                        <p className="text-xs text-indigo-600 font-medium">{professional.company}</p>
                                        <p className="text-xs text-slate-400 mt-1">{professional.industry || "Industry"}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400 text-center py-4">No professional experience listed.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
