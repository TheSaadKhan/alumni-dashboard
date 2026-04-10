import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  ShieldCheck, Shield, Globe, ExternalLink, MapPin, Building2, Share2, 
  PlusCircle, BarChart3, Users, Calendar, TrendingUp, Briefcase, Target, 
  DollarSign, Mail, Phone, Users2, ArrowUpRight, Settings, Edit3, Zap, 
  MessageSquare, FileText, CheckCircle, XCircle, ChevronRight, Search, 
  Filter, GraduationCap, UserPlus, PieChart, Eye, Activity 
} from "lucide-react";

import { prisma } from "@/lib/prisma";

type Props = {
  params: { slug: string };
};

// Types based on Prisma schema
type OrganizationWithRelations = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  website: string | null;
  countryCode: string | null;
  isActive: boolean;
  isVerified: boolean;
  planTier: string;
  createdAt: Date;
  updatedAt: Date;
  settings: any;
  metadata: any;
  _count?: {
    users: number;
    events: number;
    jobPostings: number;
    groups: number;
  };
};

type MemberWithProfile = {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  avatarUrl: string | null;
  userType: string;
  status: string;
  alumniProfile?: {
    headline: string | null;
    currentCompany: string | null;
    currentTitle: string | null;
    graduationYear: number | null;
    city: string | null;
    countryCode: string | null;
  } | null;
  studentProfile?: {
    headline: string | null;
    major: string | null;
    expectedGraduation: number | null;
    city: string | null;
    countryCode: string | null;
  } | null;
  userRoles: Array<{
    role: {
      name: string;
      slug: string;
    };
  }>;
};

/* =========================
   SERVER-SIDE DATA FETCHING
========================= */

async function getOrganizationBySlug(slug: string) {
  try {
    const organization = await prisma.organization.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            users: {
              where: { status: "active", deletedAt: null }
            },
            events: {
              where: { deletedAt: null, cancelledAt: null }
            },
            jobPostings: {
              where: { status: "active", deletedAt: null }
            },
            groups: {
              where: { isArchived: false }
            }
          }
        },
        country: true,
      }
    });

    if (!organization) return null;

    return {
      ...organization,
      settings: organization.settings as any || {},
      metadata: organization.metadata as any || {},
    };
  } catch (error) {
    console.error("Error fetching organization:", error);
    return null;
  }
}

async function getOrganizationMembers(organizationId: string) {
  try {
    const members = await prisma.user.findMany({
      where: {
        organizationId,
        status: "active",
        deletedAt: null
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        firstName: true,
        avatarUrl: true,
        userType: true,
        status: true,
        alumniProfile: {
          select: {
            headline: true,
            currentCompany: true,
            currentTitle: true,
            graduationYear: true,
            city: true,
            countryCode: true,
          }
        },
        studentProfile: {
          select: {
            headline: true,
            major: true,
            expectedGraduation: true,
            city: true,
            countryCode: true,
          }
        },
        userRoles: {
          where: {
            organizationId,
            revokedAt: null,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          },
          select: {
            role: {
              select: {
                name: true,
                slug: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return members;
  } catch (error) {
    console.error("Error fetching members:", error);
    return [];
  }
}

async function getOrganizationEvents(organizationId: string) {
  try {
    const events = await prisma.event.findMany({
      where: {
        organizationId,
        deletedAt: null,
        cancelledAt: null,
        isPublished: true,
        endsAt: { gt: new Date() }
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        eventType: true,
        mode: true,
        locationName: true,
        locationCity: true,
        locationCountry: true,
        startsAt: true,
        endsAt: true,
        maxCapacity: true,
        registeredCount: true,
        isPaid: true,
        price: true,
        bannerUrl: true,
        organizer: {
          select: {
            fullName: true,
            avatarUrl: true,
          }
        }
      },
      orderBy: {
        startsAt: 'asc'
      },
      take: 10
    });

    return events;
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

async function getOrganizationJobs(organizationId: string) {
  try {
    const jobs = await prisma.jobPosting.findMany({
      where: {
        organizationId,
        status: "active",
        deletedAt: null,
        expiresAt: { gt: new Date() }
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        jobType: true,
        locationCity: true,
        locationCountry: true,
        isRemote: true,
        salaryMin: true,
        salaryMax: true,
        salaryCurrency: true,
        companyName: true,
        companyLogoUrl: true,
        isUrgent: true,
        isFeatured: true,
        createdAt: true,
        expiresAt: true,
        applicationCount: true,
      },
      orderBy: [
        { isFeatured: 'desc' },
        { isUrgent: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 10
    });

    return jobs;
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return [];
  }
}

async function getOrganizationStats(organizationId: string) {
  try {
    // Get last 30 days stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalUsers, newUsersLast30Days, totalEvents, totalJobs, activeMembers] = await Promise.all([
      prisma.user.count({
        where: { organizationId, status: "active", deletedAt: null }
      }),
      prisma.user.count({
        where: {
          organizationId,
          createdAt: { gte: thirtyDaysAgo },
          deletedAt: null
        }
      }),
      prisma.event.count({
        where: { organizationId, deletedAt: null }
      }),
      prisma.jobPosting.count({
        where: { organizationId, deletedAt: null, status: "active" }
      }),
      prisma.user.count({
        where: {
          organizationId,
          lastSeenAt: { gte: thirtyDaysAgo },
          status: "active"
        }
      })
    ]);

    const growthRate = totalUsers > 0 ? (newUsersLast30Days / totalUsers) * 100 : 0;
    const memberEngagement = totalUsers > 0 ? (activeMembers / totalUsers) * 100 : 0;

    return {
      totalUsers,
      newUsersLast30Days,
      totalEvents,
      totalJobs,
      activeMembers,
      growthRate: Math.round(growthRate * 10) / 10,
      memberEngagement: Math.round(memberEngagement),
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return null;
  }
}

/* =========================
   PAGE COMPONENT
========================= */

export default async function OrganizationPage({ params }: Props) {
  const { slug } = params;

  if (!slug || slug === "undefined") {
    notFound();
  }

  // Fetch all data in parallel
  const [organization, members, events, jobs, stats] = await Promise.all([
    getOrganizationBySlug(slug),
    getOrganizationMembers(slug), // This needs org ID, adjust accordingly
    getOrganizationEvents(slug),
    getOrganizationJobs(slug),
    getOrganizationStats(slug),
  ]);

  if (!organization) {
    notFound();
  }

  // Get actual members with proper org ID
  const organizationMembers = await getOrganizationMembers(organization.id);
  const organizationEvents = await getOrganizationEvents(organization.id);
  const organizationJobs = await getOrganizationJobs(organization.id);
  const organizationStats = await getOrganizationStats(organization.id);

  const settings = organization.settings || {};
  const metadata = organization.metadata || {};

  // Format date helper
  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get member role display name
  const getMemberRole = (member: MemberWithProfile) => {
    if (member.userRoles && member.userRoles.length > 0) {
      const adminRole = member.userRoles.find(ur => ur.role.slug === 'admin' || ur.role.slug === 'super-admin');
      if (adminRole) return 'Admin';
      return member.userRoles[0].role.name;
    }
    return member.userType === 'alumni' ? 'Alumni' : 'Student';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F4FB] to-white">
      {/* ================= BANNER ================= */}
      <div className="relative h-80 w-full overflow-hidden">
        <img
          src={metadata.coverImageUrl || "/branding/alumniconnect-banner.jpg"}
          alt={organization.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/branding/alumniconnect-banner.jpg";
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <div className="container mx-auto px-4 sm:px-6 h-full flex flex-col justify-end pb-8">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-white shadow-2xl">
                    <AvatarImage 
                      src={organization.logoUrl || "/branding/alumniconnect-logo.png"} 
                      alt={organization.name}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-[#6C5CE7] to-[#A66CFF] text-white text-2xl sm:text-3xl">
                      {organization.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {organization.isVerified && (
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-[#6C5CE7]" />
                    </div>
                  )}
                </div>

                <div className="space-y-3 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white break-words">
                      {organization.name}
                    </h1>
                    {organization.isVerified && (
                      <Badge className="bg-gradient-to-r from-[#6C5CE7] to-[#A66CFF] text-white">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  <p className="text-base sm:text-lg text-white/90">
                    {organization.description || 'No description available.'}
                  </p>

                  <div className="flex flex-wrap gap-4">
                    {organization.website && (
                      <a
                        href={organization.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
                      >
                        <Globe className="h-4 w-4" />
                        <span className="underline truncate max-w-[200px]">
                          Official Website
                        </span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}

                    {organization.country && (
                      <div className="flex items-center gap-2 text-white/90">
                        <MapPin className="h-4 w-4" />
                        <span>{organization.country.name}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-white/90">
                      <Building2 className="h-4 w-4" />
                      <span className="capitalize">{organization.planTier} Plan</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20"
                      >
                        <Share2 className="h-4 w-4 mr-2" /> Share
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Share this organization</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Button className="bg-gradient-to-r from-[#6C5CE7] to-[#A66CFF] hover:from-[#5A4FD6] hover:to-[#955BFF] text-white shadow-lg shadow-[#6C5CE7]/20">
                  <PlusCircle className="h-4 w-4 mr-2" /> Join Organization
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          {/* Tabs Navigation */}
          <div className="bg-white rounded-xl border border-gray-200 p-1 overflow-x-auto">
            <TabsList className="w-full justify-start h-auto bg-transparent p-0">
              <TabsTrigger
                value="overview"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#6C5CE7] data-[state=active]:to-[#A66CFF] data-[state=active]:text-white px-4 sm:px-6 py-3"
              >
                <BarChart3 className="h-4 w-4 mr-2 hidden sm:inline" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="members"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#6C5CE7] data-[state=active]:to-[#A66CFF] data-[state=active]:text-white px-4 sm:px-6 py-3"
              >
                <Users className="h-4 w-4 mr-2 hidden sm:inline" />
                Members
                <Badge className="ml-2 bg-[#6C5CE7]/20 text-[#6C5CE7]">
                  {organization._count?.users || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="events"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#6C5CE7] data-[state=active]:to-[#A66CFF] data-[state=active]:text-white px-4 sm:px-6 py-3"
              >
                <Calendar className="h-4 w-4 mr-2 hidden sm:inline" />
                Events
                <Badge className="ml-2 bg-[#FF7675]/20 text-[#FF7675]">
                  {organization._count?.events || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="jobs"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#6C5CE7] data-[state=active]:to-[#A66CFF] data-[state=active]:text-white px-4 sm:px-6 py-3"
              >
                <Briefcase className="h-4 w-4 mr-2 hidden sm:inline" />
                Jobs
                <Badge className="ml-2 bg-[#4DA3FF]/20 text-[#4DA3FF]">
                  {organization._count?.jobPostings || 0}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ================= OVERVIEW TAB ================= */}
          <TabsContent value="overview" className="space-y-8">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-[#2D3436]">
                        {organization._count?.users?.toLocaleString() || 0}
                      </p>
                      <p className="text-sm text-[#636E72]">Total Members</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-[#6C5CE7]/10 to-[#A66CFF]/10 rounded-xl">
                      <Users className="h-6 w-6 text-[#6C5CE7]" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4">
                    <TrendingUp className="h-4 w-4 text-[#2ED8B6] mr-2" />
                    <span className="text-sm font-medium text-[#2ED8B6]">+{organizationStats?.growthRate || 0}% growth</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-[#2D3436]">
                        {organization._count?.events || 0}
                      </p>
                      <p className="text-sm text-[#636E72]">Total Events</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-[#FF7675]/10 to-[#FF7AA2]/10 rounded-xl">
                      <Calendar className="h-6 w-6 text-[#FF7675]" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm text-[#636E72] mb-1">Upcoming: {organizationEvents.length}</div>
                    <Progress value={65} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-[#2D3436]">
                        {organization._count?.jobPostings || 0}
                      </p>
                      <p className="text-sm text-[#636E72]">Active Jobs</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-[#4DA3FF]/10 to-[#6CB2FF]/10 rounded-xl">
                      <Briefcase className="h-6 w-6 text-[#4DA3FF]" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4">
                    <Target className="h-4 w-4 text-[#4DA3FF] mr-2" />
                    <span className="text-sm text-[#636E72]">{organizationJobs.length} open positions</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-[#2D3436]">
                        {organizationStats?.memberEngagement || 0}%
                      </p>
                      <p className="text-sm text-[#636E72]">Engagement Rate</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-[#2ED8B6]/10 to-[#55EFC4]/10 rounded-xl">
                      <Activity className="h-6 w-6 text-[#2ED8B6]" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4">
                    <Users2 className="h-4 w-4 text-[#4DA3FF] mr-2" />
                    <span className="text-sm text-[#636E72]">{organizationStats?.activeMembers || 0} active this month</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - About */}
              <div className="lg:col-span-2 space-y-8">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-[#6C5CE7]" />
                      About {organization.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-[#636E72] leading-relaxed">
                      {organization.description || "No description available."}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {organization.website && (
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#F6F4FB] to-white rounded-lg border border-gray-200">
                          <div className="p-2 bg-gradient-to-br from-[#6C5CE7]/10 to-[#A66CFF]/10 rounded-lg">
                            <Globe className="h-4 w-4 text-[#6C5CE7]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#2D3436]">Website</p>
                            <a
                              href={organization.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-[#6C5CE7] hover:underline truncate block"
                            >
                              {organization.website.replace(/^https?:\/\//, '')}
                            </a>
                          </div>
                        </div>
                      )}

                      {organization.country && (
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#F6F4FB] to-white rounded-lg border border-gray-200">
                          <div className="p-2 bg-gradient-to-br from-[#FF7675]/10 to-[#FF7AA2]/10 rounded-lg">
                            <MapPin className="h-4 w-4 text-[#FF7675]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#2D3436]">Country</p>
                            <p className="text-sm text-[#636E72]">{organization.country.name}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Organization Status */}
              <div className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-semibold text-[#2D3436] flex items-center gap-2">
                        <Settings className="h-5 w-5 text-[#6C5CE7]" />
                        Organization Status
                      </h3>
                      <Badge className={organization.isActive ? "bg-[#2ED8B6]/10 text-[#2ED8B6]" : "bg-[#FF7675]/10 text-[#FF7675]"}>
                        {organization.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#636E72]">Created</span>
                        <span className="text-sm font-medium text-[#2D3436]">
                          {formatDate(organization.createdAt)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#636E72]">Plan Tier</span>
                        <span className="text-sm font-medium text-[#2D3436] capitalize">
                          {organization.planTier}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#636E72]">Verified</span>
                        <Badge className={organization.isVerified ? "bg-[#2ED8B6]/10 text-[#2ED8B6]" : "bg-[#FF7675]/10 text-[#FF7675]"}>
                          {organization.isVerified ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </div>

                    <Button className="w-full mt-6 bg-gradient-to-r from-[#6C5CE7] to-[#A66CFF] text-white">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Manage Settings
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ================= MEMBERS TAB ================= */}
          <TabsContent value="members" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">Organization Members</CardTitle>
                  <CardDescription>
                    {organizationMembers.length} members in {organization.name}
                  </CardDescription>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search members..."
                      className="pl-10 bg-gray-50 border-gray-200"
                    />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-32 border-gray-200">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                      <SelectItem value="alumni">Alumni</SelectItem>
                      <SelectItem value="student">Students</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {organizationMembers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {organizationMembers.map((member) => (
                      <Card key={member.id} className="border border-gray-200 hover:border-[#6C5CE7]/30 transition-colors">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={member.avatarUrl || ""} alt={member.fullName} />
                              <AvatarFallback className="bg-gradient-to-br from-[#6C5CE7]/20 to-[#A66CFF]/20 text-[#6C5CE7] text-lg">
                                {member.fullName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="min-w-0">
                                  <h4 className="font-semibold text-[#2D3436] truncate">
                                    {member.fullName}
                                  </h4>
                                  <p className="text-sm text-[#636E72] truncate">
                                    {member.alumniProfile?.headline || member.studentProfile?.headline || 'Member'}
                                  </p>
                                </div>
                                <Badge className="bg-[#6C5CE7]/10 text-[#6C5CE7]">
                                  {getMemberRole(member)}
                                </Badge>
                              </div>

                              <div className="mt-4 space-y-2">
                                {member.alumniProfile?.currentCompany && (
                                  <div className="flex items-center gap-2 text-sm text-[#636E72]">
                                    <Briefcase className="h-3 w-3" />
                                    <span className="truncate">{member.alumniProfile.currentCompany}</span>
                                  </div>
                                )}

                                {(member.alumniProfile?.graduationYear || member.studentProfile?.expectedGraduation) && (
                                  <div className="flex items-center gap-2 text-sm text-[#636E72]">
                                    <GraduationCap className="h-3 w-3" />
                                    <span>
                                      Class of {member.alumniProfile?.graduationYear || member.studentProfile?.expectedGraduation}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-2 mt-4">
                                <Button size="sm" variant="outline" className="flex-1">
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  Message
                                </Button>
                                <Button size="sm" className="flex-1 bg-gradient-to-r from-[#6C5CE7] to-[#A66CFF] text-white">
                                  <UserPlus className="h-3 w-3 mr-1" />
                                  Connect
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-[#2D3436] mb-2">No Members Found</h3>
                    <p className="text-[#636E72]">
                      This organization doesn't have any members yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================= EVENTS TAB ================= */}
          <TabsContent value="events" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">Organization Events</CardTitle>
                  <CardDescription>
                    Browse and join events organized by {organization.name}
                  </CardDescription>
                </div>
                <Button className="bg-gradient-to-r from-[#FF7675] to-[#FF7AA2] text-white">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </CardHeader>
              <CardContent>
                {organizationEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {organizationEvents.map((event) => (
                      <Card key={event.id} className="border border-gray-200 hover:border-[#FF7675]/30 transition-colors">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="min-w-0">
                              <h4 className="font-semibold text-[#2D3436] text-lg truncate">{event.title}</h4>
                              <p className="text-sm text-[#636E72] mt-1 line-clamp-2">
                                {event.description || 'No description'}
                              </p>
                            </div>
                            <Badge className="bg-[#FF7675]/10 text-[#FF7675] ml-2">
                              {event.eventType}
                            </Badge>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-[#636E72]">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {formatDate(event.startsAt)}
                                {event.endsAt && ` - ${formatDate(event.endsAt)}`}
                              </span>
                            </div>

                            {event.locationName && (
                              <div className="flex items-center gap-2 text-sm text-[#636E72]">
                                <MapPin className="h-4 w-4" />
                                <span className="truncate">{event.locationName}</span>
                              </div>
                            )}

                            {event.maxCapacity && (
                              <div className="flex items-center gap-2 text-sm text-[#636E72]">
                                <Users className="h-4 w-4" />
                                <span>Capacity: {event.maxCapacity} attendees</span>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 mt-6">
                            <Button variant="outline" className="flex-1">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            <Button className="flex-1 bg-gradient-to-r from-[#FF7675] to-[#FF7AA2] text-white">
                              <Calendar className="h-4 w-4 mr-2" />
                              Register
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-[#2D3436] mb-2">No Upcoming Events</h3>
                    <p className="text-[#636E72] mb-6">
                      There are no upcoming events scheduled for this organization.
                    </p>
                    <Button className="bg-gradient-to-r from-[#FF7675] to-[#FF7AA2] text-white">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Schedule First Event
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================= JOBS TAB ================= */}
          <TabsContent value="jobs" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">Job Opportunities</CardTitle>
                  <CardDescription>
                    Explore career opportunities from {organization.name}
                  </CardDescription>
                </div>
                <Button className="bg-gradient-to-r from-[#4DA3FF] to-[#6CB2FF] text-white">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Post a Job
                </Button>
              </CardHeader>
              <CardContent>
                {organizationJobs.length > 0 ? (
                  <div className="space-y-4">
                    {organizationJobs.map((job) => (
                      <Card key={job.id} className="border border-gray-200 hover:border-[#4DA3FF]/30 transition-colors">
                        <CardContent className="p-6">
                          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-[#2D3436] text-lg">{job.title}</h4>
                                {job.isFeatured && (
                                  <Badge className="bg-[#4DA3FF]/10 text-[#4DA3FF]">Featured</Badge>
                                )}
                                {job.isUrgent && (
                                  <Badge className="bg-[#FF7675]/10 text-[#FF7675]">Urgent</Badge>
                                )}
                              </div>
                              <p className="text-sm text-[#636E72] mt-1 line-clamp-2">
                                {job.description?.substring(0, 200) || 'No description'}
                              </p>
                              
                              <div className="flex flex-wrap gap-3 mt-3">
                                <Badge variant="outline" className="text-xs">
                                  {job.jobType?.replace('_', ' ').toUpperCase() || 'Full Time'}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {job.isRemote ? 'Remote' : (job.locationCity || 'On-site')}
                                </Badge>
                                {job.salaryMin && (
                                  <Badge variant="outline" className="text-xs">
                                    ${job.salaryMin.toLocaleString()} - ${job.salaryMax?.toLocaleString()}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <Button className="bg-gradient-to-r from-[#4DA3FF] to-[#6CB2FF] text-white whitespace-nowrap">
                              Apply Now
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-[#2D3436] mb-2">No Active Jobs</h3>
                    <p className="text-[#636E72] mb-6">
                      There are no active job postings at this time.
                    </p>
                    <Button className="bg-gradient-to-r from-[#4DA3FF] to-[#6CB2FF] text-white">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Post First Job
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}