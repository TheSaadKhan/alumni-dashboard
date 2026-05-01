"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin, Briefcase, GraduationCap, MessageCircle,
  ArrowLeft, Globe, Linkedin, Github, Info, Building2,
  Calendar, Star
} from "lucide-react";
import { useAuthProfile } from "@/context/AuthContext";
import { toast } from "sonner";

function ProfileLoadingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
      <Skeleton className="h-9 w-20 rounded-xl" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-6 pb-8 border-b border-slate-100">
        <Skeleton className="h-28 w-28 rounded-3xl shrink-0" />
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-56 rounded-xl" />
            <Skeleton className="h-4 w-40 rounded-lg" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-4 w-24 rounded-lg" />
            <Skeleton className="h-4 w-20 rounded-lg" />
            <Skeleton className="h-4 w-28 rounded-lg" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-5 w-16 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-5/6 rounded-lg" />
            <Skeleton className="h-4 w-4/5 rounded-lg" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-5 w-24 rounded-lg" />
            {Array(2).fill(0).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36 rounded-lg" />
                  <Skeleton className="h-3 w-24 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function AlumniProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { profile: myProfile, organization } = useAuthProfile();
  const alumniId = params.alumniId as string;
  const slug = organization?.slug || "default";

  const [user, setUser] = useState<any>(null);
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
      const p = data.profile;
      const details = p.alumniProfile || p.studentProfile || {};
      setUser({
        ...p,
        ...details,
        skills: details.skills || [],
        workHistory: details.workHistory || [],
        education: p.education || [],
      });
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ProfileLoadingSkeleton />;

  if (!user) {
    return (
      <div className="max-w-sm mx-auto px-4 py-24 text-center space-y-6 animate-in fade-in duration-300">
        <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto border border-slate-100">
          <Info className="h-8 w-8 text-slate-200" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900">Profile Not Found</h1>
          <p className="text-sm text-slate-500">This profile could not be found or may have been removed.</p>
        </div>
        <Button className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white" onClick={() => router.push(`/organization/${slug}/dashboard/network`)}>
          Back to Network
        </Button>
      </div>
    );
  }

  const isAlumni = user.userType === "alumni";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="text-slate-400 hover:text-slate-700 rounded-xl h-9 px-3 font-medium text-sm"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-start gap-6 pb-8 border-b border-slate-100">
        <Avatar className="h-28 w-28 rounded-3xl border-2 border-slate-100 shadow-sm shrink-0">
          <AvatarImage src={user.avatarUrl} className="object-cover" />
          <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-3xl">
            {user.fullName?.[0]}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{user.fullName}</h1>
              {user.isVerified && (
                <Badge className="bg-blue-50 text-blue-600 border-none text-[10px] font-semibold rounded-lg">
                  Verified
                </Badge>
              )}
              <Badge className={`border-none text-[10px] font-semibold rounded-lg ${isAlumni ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"}`}>
                {isAlumni ? "Alumni" : "Student"}
              </Badge>
            </div>
            {user.headline && (
              <p className="text-blue-600 font-semibold text-sm mt-1">{user.headline}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            {(user.city || user.countryCode) && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-300" />
                {[user.city, user.countryCode].filter(Boolean).join(", ")}
              </span>
            )}
            {user.graduationYear && (
              <span className="flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-slate-300" />
                Class of {user.graduationYear}
              </span>
            )}
            {user.currentCompany && (
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-slate-300" />
                {user.currentTitle ? `${user.currentTitle} at ` : ""}{user.currentCompany}
              </span>
            )}
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-2">
            {user.linkedinUrl && (
              <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer"
                className="h-9 w-9 rounded-xl bg-slate-50 hover:bg-blue-50 flex items-center justify-center transition-colors border border-slate-100 hover:border-blue-200">
                <Linkedin className="h-4 w-4 text-slate-400 hover:text-blue-600" />
              </a>
            )}
            {user.githubUrl && (
              <a href={user.githubUrl} target="_blank" rel="noopener noreferrer"
                className="h-9 w-9 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors border border-slate-100">
                <Github className="h-4 w-4 text-slate-400" />
              </a>
            )}
            {user.websiteUrl && (
              <a href={user.websiteUrl} target="_blank" rel="noopener noreferrer"
                className="h-9 w-9 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors border border-slate-100">
                <Globe className="h-4 w-4 text-slate-400" />
              </a>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 shadow-sm text-sm"
              onClick={() => router.push(`/organization/${slug}/dashboard/messages?userId=${alumniId}`)}
            >
              <MessageCircle className="h-4 w-4 mr-2" /> Message
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="md:col-span-2 space-y-8">
          {user.bio && (
            <section>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">About</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{user.bio}</p>
            </section>
          )}

          {user.workHistory?.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Experience</h2>
              <div className="space-y-5">
                {user.workHistory.map((job: any, i: number) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                      <Briefcase className="h-5 w-5 text-slate-300" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{job.title}</p>
                      <p className="text-xs text-slate-500 font-medium">{job.company}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-semibold uppercase tracking-wider">
                        {new Date(job.startedAt).getFullYear()} — {job.isCurrent ? "Present" : new Date(job.endedAt).getFullYear()}
                      </p>
                      {job.description && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{job.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {user.education?.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Education</h2>
              <div className="space-y-4">
                {user.education.map((edu: any, i: number) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                      <GraduationCap className="h-5 w-5 text-slate-300" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{edu.institution}</p>
                      <p className="text-xs text-slate-500 font-medium">
                        {[edu.degreeType, edu.fieldOfStudy].filter(Boolean).join(" in ")}
                      </p>
                      {(edu.startYear || edu.endYear) && (
                        <p className="text-[10px] text-slate-400 mt-0.5 font-semibold uppercase tracking-wider">
                          {edu.startYear} — {edu.isCurrent ? "Present" : edu.endYear}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {user.skills?.length > 0 && (
            <section className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((s: any, i: number) => (
                  <Badge key={i} variant="secondary" className="bg-white border border-slate-200 text-slate-600 font-medium rounded-lg text-xs">
                    {typeof s === "string" ? s : s.name}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {user.industry && (
            <section className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Industry</h2>
              <p className="text-sm text-slate-600 font-medium">{user.industry}</p>
            </section>
          )}

          {user.isMentorAvailable && (
            <section className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-blue-600" />
                <h2 className="text-xs font-bold text-blue-800 uppercase tracking-wider">Open to Mentor</h2>
              </div>
              <p className="text-xs text-blue-600 font-medium">This member is available for mentorship sessions.</p>
              <Button
                className="w-full mt-3 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
                onClick={() => router.push(`/organization/${slug}/dashboard/messages?userId=${alumniId}`)}
              >
                Request Mentorship
              </Button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}