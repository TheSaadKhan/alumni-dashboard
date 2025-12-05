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

type Props = {
  params?: { slug?: string };
};

/* =========================
 ✅ API HELPERS (Next.js 16 – FINAL FIX)
========================= */

async function getOrganization(slug?: string) {
  // ✅ HARD GUARD — PREVENTS ALL CRASHES
  if (!slug || slug === "undefined") {
    console.error("❌ getOrganization called with invalid slug:", slug);
    return null;
  }

  try {
    const res = await fetch(
      `/api/organizations?slug=${encodeURIComponent(slug)}`,
      {
        cache: "no-store",
        next: { revalidate: 0 },
      }
    );

    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("❌ Error fetching organization:", error);
    return null;
  }
}

async function getMembers(orgId?: string) {
  if (!orgId || orgId === "undefined") {
    console.error("❌ getMembers called with invalid orgId:", orgId);
    return [];
  }

  try {
    const res = await fetch(
      `/api/organizations/${encodeURIComponent(orgId)}/members`,
      {
        cache: "no-store",
        next: { revalidate: 0 },
      }
    );

    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("❌ Error fetching members:", error);
    return [];
  }
}

async function getOrganizationStats(orgId?: string) {
  if (!orgId || orgId === "undefined") {
    console.error("❌ getOrganizationStats called with invalid orgId:", orgId);
    return null;
  }

  try {
    const res = await fetch(
      `/api/organizations/${encodeURIComponent(orgId)}/stats`,
      {
        cache: "no-store",
        next: { revalidate: 0 },
      }
    );

    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("❌ Error fetching stats:", error);
    return null;
  }
}

/* =========================
 ✅ PAGE COMPONENT
========================= */

export default async function OrganizationPage({ params }: Props) {
  console.log("✅ slug:", 'sycet');
  
  // Fetch organization data
  const organization = await getOrganization('sycet');
  
  // If organization not found, show 404
  if (!organization) {
    notFound();
  }

  // Fetch additional data in parallel for better performance
  const [members, stats] = await Promise.all([
    getMembers(organization.id),
    getOrganizationStats(organization.id)
  ]);

  // Safely access nested properties with fallbacks
  const metadata = organization.metadata || {};
  const recentDonations = organization.recentDonations || [];
  const recentAnalytics = organization.recentAnalytics || [];
  const upcomingEvents = organization.upcomingEvents || [];
  const activeJobs = organization.activeJobs || [];
  const donationCampaigns = organization.donationCampaigns || [];
  const analyticsMetrics = organization.analytics_metrics || [];

  // Calculate totals with safe defaults
  const totalDonations = recentDonations.reduce(
    (sum: number, d: any) => sum + (Number(d.amount) || 0),
    0
  );

  const recurringDonations = recentDonations.filter((d: any) => d.is_recurring).length;
  const activeCampaigns = donationCampaigns.filter((c: any) => c.is_active).length;

  // Calculate engagement metrics with safe fallbacks
  const memberEngagement = stats?.memberEngagement || 72;
  const eventAttendance = stats?.eventAttendance || 65;
  const growthRate = stats?.growthRate || 12.5;
  const completionRate = stats?.completionRate || 85;

  // Get organization features from settings
  const features = metadata.features || {
    events: true,
    jobs: true,
    donations: true,
    messaging: true,
    analytics: true,
    stories: true,
  };

  // Format dates safely
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F4FB] to-white">
      {/* ================= BANNER ================= */}
      <div className="relative h-80 w-full overflow-hidden">
        <img
          src={metadata.cover_image_url || "/branding/alumniconnect-banner.jpg"}
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
                      src={organization.logo_url || "/branding/alumniconnect-logo.png"} 
                      alt={organization.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/branding/alumniconnect-logo.png";
                      }}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-[#6C5CE7] to-[#A66CFF] text-white text-2xl sm:text-3xl">
                      {organization.name?.charAt(0) || 'O'}
                    </AvatarFallback>
                  </Avatar>
                  {organization.is_verified && (
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-[#6C5CE7]" />
                    </div>
                  )}
                </div>

                <div className="space-y-3 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white break-words">
                      {organization.name || 'Organization'}
                    </h1>
                    {organization.is_verified && (
                      <Badge className="bg-gradient-to-r from-[#6C5CE7] to-[#A66CFF] text-white whitespace-nowrap">
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
                        className="flex items-center gap-2 text-white/90 hover:text-white transition-colors whitespace-nowrap"
                      >
                        <Globe className="h-4 w-4 flex-shrink-0" />
                        <span className="underline truncate max-w-[200px] sm:max-w-none">
                          Official Website
                        </span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    )}

                    {metadata.location && (
                      <div className="flex items-center gap-2 text-white/90 whitespace-nowrap">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate max-w-[150px] sm:max-w-none">
                          {metadata.location}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-white/90 whitespace-nowrap">
                      <Building2 className="h-4 w-4 flex-shrink-0" />
                      <span>{organization.organization_type || 'Organization'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20 whitespace-nowrap"
                      >
                        <Share2 className="h-4 w-4 mr-2" /> Share
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Share this organization</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Button className="bg-gradient-to-r from-[#6C5CE7] to-[#A66CFF] hover:from-[#5A4FD6] hover:to-[#955BFF] text-white shadow-lg shadow-[#6C5CE7]/20 whitespace-nowrap">
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
            <TabsList className="w-full justify-start h-auto bg-transparent p-0 flex-nowrap">
              <TabsTrigger
                value="overview"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#6C5CE7] data-[state=active]:to-[#A66CFF] data-[state=active]:text-white px-4 sm:px-6 py-3 whitespace-nowrap"
              >
                <BarChart3 className="h-4 w-4 mr-2 hidden sm:inline" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="members"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#6C5CE7] data-[state=active]:to-[#A66CFF] data-[state=active]:text-white px-4 sm:px-6 py-3 whitespace-nowrap"
              >
                <Users className="h-4 w-4 mr-2 hidden sm:inline" />
                Members
                <Badge className="ml-2 bg-[#6C5CE7]/20 text-[#6C5CE7]">
                  {organization._count?.organization_members || members.length || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#6C5CE7] data-[state=active]:to-[#A66CFF] data-[state=active]:text-white px-4 sm:px-6 py-3 whitespace-nowrap"
              >
                <Activity className="h-4 w-4 mr-2 hidden sm:inline" />
                Analytics
              </TabsTrigger>
              <TabsTrigger
                value="events"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#6C5CE7] data-[state=active]:to-[#A66CFF] data-[state=active]:text-white px-4 sm:px-6 py-3 whitespace-nowrap"
              >
                <Calendar className="h-4 w-4 mr-2 hidden sm:inline" />
                Events
                <Badge className="ml-2 bg-[#FF7675]/20 text-[#FF7675]">
                  {organization._count?.events || upcomingEvents.length || 0}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ================= OVERVIEW TAB ================= */}
          <TabsContent value="overview" className="space-y-8">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-[#2D3436]">
                        {(organization._count?.organization_members || members.length || 0).toLocaleString()}
                      </p>
                      <p className="text-xs sm:text-sm text-[#636E72]">Total Members</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-[#6C5CE7]/10 to-[#A66CFF]/10 rounded-xl">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-[#6C5CE7]" />
                    </div>
                  </div>
                  <div className="flex items-center mt-3 sm:mt-4">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-[#2ED8B6] mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm font-medium text-[#2ED8B6]">+{growthRate}% growth</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-[#2D3436]">
                        {organization._count?.events || upcomingEvents.length || 0}
                      </p>
                      <p className="text-xs sm:text-sm text-[#636E72]">Total Events</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-[#FF7675]/10 to-[#FF7AA2]/10 rounded-xl">
                      <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-[#FF7675]" />
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-4">
                    <div className="text-xs text-[#636E72] mb-1">Upcoming: {upcomingEvents.length}</div>
                    <Progress value={eventAttendance} className="h-1.5 bg-gray-200">
                      <div className="h-full bg-gradient-to-r from-[#FF7675] to-[#FF7AA2] rounded-full" style={{ width: `${eventAttendance}%` }} />
                    </Progress>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-[#2D3436]">
                        {organization._count?.jobs || activeJobs.length || 0}
                      </p>
                      <p className="text-xs sm:text-sm text-[#636E72]">Active Jobs</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-[#4DA3FF]/10 to-[#6CB2FF]/10 rounded-xl">
                      <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-[#4DA3FF]" />
                    </div>
                  </div>
                  <div className="flex items-center mt-3 sm:mt-4">
                    <Target className="h-3 w-3 sm:h-4 sm:w-4 text-[#4DA3FF] mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm text-[#636E72]">{activeJobs.length} open positions</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-[#2D3436]">
                        ${totalDonations.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs sm:text-sm text-[#636E72]">Total Donations</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-[#2ED8B6]/10 to-[#55EFC4]/10 rounded-xl">
                      <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-[#2ED8B6]" />
                    </div>
                  </div>
                  <div className="flex items-center mt-3 sm:mt-4">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-[#4DA3FF] mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm text-[#636E72]">{recurringDonations} recurring · {activeCampaigns} campaigns</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Left Column - About & Engagement */}
              <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                {/* About Section */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                      <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-[#6C5CE7]" />
                      About {organization.name || 'Organization'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6">
                    <p className="text-[#636E72] leading-relaxed text-sm sm:text-base">
                      {organization.description || "No description available."}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {organization.website && (
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#F6F4FB] to-white rounded-lg border border-gray-200 hover:border-[#6C5CE7]/30 transition-colors">
                          <div className="p-2 bg-gradient-to-br from-[#6C5CE7]/10 to-[#A66CFF]/10 rounded-lg flex-shrink-0">
                            <Globe className="h-4 w-4 text-[#6C5CE7]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-[#2D3436]">Website</p>
                            <a
                              href={organization.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs sm:text-sm text-[#6C5CE7] hover:underline truncate block"
                            >
                              {organization.website.replace(/^https?:\/\//, '')}
                            </a>
                          </div>
                        </div>
                      )}

                      {metadata.location && (
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#F6F4FB] to-white rounded-lg border border-gray-200 hover:border-[#FF7675]/30 transition-colors">
                          <div className="p-2 bg-gradient-to-br from-[#FF7675]/10 to-[#FF7AA2]/10 rounded-lg flex-shrink-0">
                            <MapPin className="h-4 w-4 text-[#FF7675]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-[#2D3436]">Location</p>
                            <p className="text-xs sm:text-sm text-[#636E72] truncate">{metadata.location}</p>
                          </div>
                        </div>
                      )}

                      {organization.contact_email && (
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#F6F4FB] to-white rounded-lg border border-gray-200 hover:border-[#4DA3FF]/30 transition-colors">
                          <div className="p-2 bg-gradient-to-br from-[#4DA3FF]/10 to-[#6CB2FF]/10 rounded-lg flex-shrink-0">
                            <Mail className="h-4 w-4 text-[#4DA3FF]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-[#2D3436]">Contact Email</p>
                            <p className="text-xs sm:text-sm text-[#636E72] truncate">{organization.contact_email}</p>
                          </div>
                        </div>
                      )}

                      {organization.phone_number && (
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#F6F4FB] to-white rounded-lg border border-gray-200 hover:border-[#2ED8B6]/30 transition-colors">
                          <div className="p-2 bg-gradient-to-br from-[#2ED8B6]/10 to-[#55EFC4]/10 rounded-lg flex-shrink-0">
                            <Phone className="h-4 w-4 text-[#2ED8B6]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-[#2D3436]">Contact Phone</p>
                            <p className="text-xs sm:text-sm text-[#636E72] truncate">{organization.phone_number}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Engagement Metrics */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                      <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-[#6C5CE7]" />
                      Engagement Metrics
                    </CardTitle>
                    <Badge className="bg-gradient-to-r from-[#6C5CE7] to-[#A66CFF] text-white self-start sm:self-auto">
                      Last 30 days
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-[#6C5CE7]/10 to-[#A66CFF]/10 rounded-lg">
                              <Users2 className="h-4 w-4 text-[#6C5CE7]" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#2D3436]">Member Engagement</p>
                              <p className="text-xs text-[#636E72]">Active participation rate</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-base sm:text-lg font-bold text-[#2D3436]">{memberEngagement}%</p>
                            <div className="flex items-center text-xs sm:text-sm text-[#2ED8B6]">
                              <ArrowUpRight className="h-3 w-3 mr-1" />
                              +5.2%
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-[#FF7675]/10 to-[#FF7AA2]/10 rounded-lg">
                              <Calendar className="h-4 w-4 text-[#FF7675]" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#2D3436]">Event Attendance</p>
                              <p className="text-xs text-[#636E72]">Average participation</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-base sm:text-lg font-bold text-[#2D3436]">{eventAttendance}%</p>
                            <div className="flex items-center text-xs sm:text-sm text-[#2ED8B6]">
                              <ArrowUpRight className="h-3 w-3 mr-1" />
                              +8.1%
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-[#4DA3FF]/10 to-[#6CB2FF]/10 rounded-lg">
                              <Target className="h-4 w-4 text-[#4DA3FF]" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#2D3436]">Goal Completion</p>
                              <p className="text-xs text-[#636E72]">Campaign success rate</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-base sm:text-lg font-bold text-[#2D3436]">{completionRate}%</p>
                            <div className="flex items-center text-xs sm:text-sm text-[#2ED8B6]">
                              <ArrowUpRight className="h-3 w-3 mr-1" />
                              +12.3%
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-[#2ED8B6]/10 to-[#55EFC4]/10 rounded-lg">
                              <TrendingUp className="h-4 w-4 text-[#2ED8B6]" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#2D3436]">Monthly Growth</p>
                              <p className="text-xs text-[#636E72]">New members & activity</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-base sm:text-lg font-bold text-[#2D3436]">+{growthRate}%</p>
                            <div className="flex items-center text-xs sm:text-sm text-[#2ED8B6]">
                              <ArrowUpRight className="h-3 w-3 mr-1" />
                              Steady
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Quick Stats & Features */}
              <div className="space-y-6 sm:space-y-8">
                {/* Organization Status */}
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <h3 className="font-semibold text-[#2D3436] flex items-center gap-2">
                        <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-[#6C5CE7]" />
                        Organization Status
                      </h3>
                      <Badge className={organization.is_active ? "bg-[#2ED8B6]/10 text-[#2ED8B6]" : "bg-[#FF7675]/10 text-[#FF7675]"}>
                        {organization.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-[#636E72]">Created</span>
                        <span className="text-xs sm:text-sm font-medium text-[#2D3436]">
                          {formatDate(organization.created_at)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-[#636E72]">Organization Type</span>
                        <span className="text-xs sm:text-sm font-medium text-[#2D3436]">
                          {organization.organization_type || 'N/A'}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-[#636E72]">Last Updated</span>
                        <span className="text-xs sm:text-sm font-medium text-[#2D3436]">
                          {formatDate(organization.updated_at)}
                        </span>
                      </div>
                    </div>

                    <Button className="w-full mt-4 sm:mt-6 bg-gradient-to-r from-[#6C5CE7] to-[#A66CFF] text-white">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Manage Settings
                    </Button>
                  </CardContent>
                </Card>

                {/* Active Features */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                      <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-[#FF7675]" />
                      Active Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(features).map(([key, enabled]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {key === 'events' && <Calendar className="h-4 w-4 text-[#FF7675]" />}
                            {key === 'jobs' && <Briefcase className="h-4 w-4 text-[#4DA3FF]" />}
                            {key === 'donations' && <DollarSign className="h-4 w-4 text-[#2ED8B6]" />}
                            {key === 'messaging' && <MessageSquare className="h-4 w-4 text-[#6C5CE7]" />}
                            {key === 'analytics' && <BarChart3 className="h-4 w-4 text-[#A66CFF]" />}
                            {key === 'stories' && <FileText className="h-4 w-4 text-[#FF7AA2]" />}
                            <span className="text-sm font-medium text-[#2D3436] capitalize">{key}</span>
                          </div>
                          {enabled ? (
                            <CheckCircle className="h-4 w-4 text-[#2ED8B6]" />
                          ) : (
                            <XCircle className="h-4 w-4 text-[#FF7675]" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Donations */}
                {recentDonations.length > 0 && (
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                        <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-[#2ED8B6]" />
                        Recent Donations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentDonations.slice(0, 3).map((donation: any) => (
                          <div key={donation.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarFallback className="bg-gradient-to-br from-[#2ED8B6]/20 to-[#55EFC4]/20 text-[#2ED8B6]">
                                  {donation.is_anonymous ? 'A' : donation.donor_name?.charAt(0) || 'D'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-[#2D3436] truncate">
                                  {donation.is_anonymous ? 'Anonymous' : donation.donor_name || 'Donor'}
                                </p>
                                <p className="text-xs text-[#636E72]">
                                  {formatDate(donation.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-semibold text-[#2D3436] text-sm sm:text-base">
                                ${Number(donation.amount || 0).toLocaleString()}
                              </p>
                              {donation.is_recurring && (
                                <Badge className="bg-[#2ED8B6]/10 text-[#2ED8B6] text-xs">
                                  Recurring
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button variant="ghost" className="w-full mt-4 text-[#6C5CE7]">
                        View All Donations
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ================= MEMBERS TAB ================= */}
          <TabsContent value="members" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Organization Members</CardTitle>
                  <CardDescription>
                    {members.length} members in {organization.name}
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search members..."
                      className="pl-10 w-full bg-gray-50 border-gray-200"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-full sm:w-32 border-gray-200">
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Admins</SelectItem>
                        <SelectItem value="member">Members</SelectItem>
                        <SelectItem value="guest">Guests</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" className="border-gray-200 whitespace-nowrap">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {members.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {members.map((member: any) => (
                      <Card key={member.id} className="border border-gray-200 hover:border-[#6C5CE7]/30 transition-colors">
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex items-start gap-3 sm:gap-4">
                            <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                              <AvatarImage src={member.profiles?.avatar_url || ""} alt={member.profiles?.full_name} />
                              <AvatarFallback className="bg-gradient-to-br from-[#6C5CE7]/20 to-[#A66CFF]/20 text-[#6C5CE7] text-sm sm:text-lg">
                                {member.profiles?.full_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="min-w-0">
                                  <h4 className="font-semibold text-[#2D3436] text-sm sm:text-base truncate">
                                    {member.profiles?.full_name || 'Unknown User'}
                                  </h4>
                                  <p className="text-xs sm:text-sm text-[#636E72] truncate">
                                    {member.profiles?.headline || 'No headline'}
                                  </p>
                                </div>
                                <Badge className="bg-[#6C5CE7]/10 text-[#6C5CE7] whitespace-nowrap text-xs">
                                  {member.organization_roles?.display_name || 'Member'}
                                </Badge>
                              </div>

                              <div className="mt-3 sm:mt-4 space-y-1 sm:space-y-2">
                                {member.profiles?.location && (
                                  <div className="flex items-center gap-2 text-xs sm:text-sm text-[#636E72]">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate">{member.profiles.location}</span>
                                  </div>
                                )}

                                {member.profiles?.graduation_year && (
                                  <div className="flex items-center gap-2 text-xs sm:text-sm text-[#636E72]">
                                    <GraduationCap className="h-3 w-3" />
                                    <span>Class of {member.profiles.graduation_year}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-2 mt-4">
                                <Button size="sm" variant="outline" className="flex-1 border-gray-200 text-xs">
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  Message
                                </Button>
                                <Button size="sm" className="flex-1 bg-gradient-to-r from-[#6C5CE7] to-[#A66CFF] text-white text-xs">
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
                    <p className="text-[#636E72] max-w-md mx-auto">
                      This organization doesn't have any members yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================= ANALYTICS TAB ================= */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Performance Metrics</CardTitle>
                  <CardDescription>Key performance indicators over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 sm:space-y-6">
                    {analyticsMetrics.length > 0 ? (
                      analyticsMetrics.map((metric: any) => (
                        <div key={metric.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-[#6C5CE7]/10 to-[#A66CFF]/10">
                                <Activity className="h-4 w-4 text-[#6C5CE7]" />
                              </div>
                              <div>
                                <p className="font-medium text-[#2D3436] text-sm sm:text-base">{metric.metric_name}</p>
                                <p className="text-xs sm:text-sm text-[#636E72]">{metric.description}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl sm:text-2xl font-bold text-[#2D3436]">
                                {metric.metric_type === 'percentage'
                                  ? `${metric.target_value || 0}%`
                                  : metric.target_value?.toLocaleString() || '0'}
                              </p>
                              <Badge className="bg-[#2ED8B6]/10 text-[#2ED8B6] mt-1 text-xs">
                                {metric.metric_category}
                              </Badge>
                            </div>
                          </div>
                          <Progress value={metric.target_value || 0} className="h-2 bg-gray-200">
                            <div className="h-full bg-gradient-to-r from-[#6C5CE7] to-[#A66CFF] rounded-full" style={{ width: `${metric.target_value || 0}%` }} />
                          </Progress>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-[#2D3436] mb-2">No Analytics Data</h3>
                        <p className="text-[#636E72]">
                          Analytics data will appear here once the organization starts generating activity.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-[#2ED8B6]" />
                      Growth Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-[#636E72]">Member Growth</span>
                        <div className="flex items-center text-[#2ED8B6]">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          <span className="font-semibold text-xs sm:text-sm">+{growthRate}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-[#636E72]">Engagement Rate</span>
                        <div className="flex items-center text-[#2ED8B6]">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          <span className="font-semibold text-xs sm:text-sm">+{memberEngagement}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-[#636E72]">Donation Growth</span>
                        <div className="flex items-center text-[#2ED8B6]">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          <span className="font-semibold text-xs sm:text-sm">+24.5%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                      <PieChart className="h-4 w-4 sm:h-5 sm:w-5 text-[#FF7675]" />
                      Activity Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-[#6C5CE7]"></div>
                          <span className="text-xs sm:text-sm text-[#2D3436]">Active Members</span>
                        </div>
                        <span className="font-semibold text-[#2D3436] text-sm sm:text-base">72%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-[#FF7675]"></div>
                          <span className="text-xs sm:text-sm text-[#2D3436]">Event Participants</span>
                        </div>
                        <span className="font-semibold text-[#2D3436] text-sm sm:text-base">65%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-[#4DA3FF]"></div>
                          <span className="text-xs sm:text-sm text-[#2D3436]">Content Creators</span>
                        </div>
                        <span className="font-semibold text-[#2D3436] text-sm sm:text-base">28%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-[#2ED8B6]"></div>
                          <span className="text-xs sm:text-sm text-[#2D3436]">Donors</span>
                        </div>
                        <span className="font-semibold text-[#2D3436] text-sm sm:text-base">42%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ================= EVENTS TAB ================= */}
          <TabsContent value="events" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Organization Events</CardTitle>
                  <CardDescription>
                    Browse and join events organized by {organization.name}
                  </CardDescription>
                </div>
                <Button className="bg-gradient-to-r from-[#FF7675] to-[#FF7AA2] text-white whitespace-nowrap">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {upcomingEvents.map((event: any) => (
                      <Card key={event.id} className="border border-gray-200 hover:border-[#FF7675]/30 transition-colors">
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex items-start justify-between mb-3 sm:mb-4">
                            <div className="min-w-0">
                              <h4 className="font-semibold text-[#2D3436] text-base sm:text-lg truncate">{event.title}</h4>
                              <p className="text-xs sm:text-sm text-[#636E72] mt-1 line-clamp-2">
                                {event.description || 'No description'}
                              </p>
                            </div>
                            <Badge className="bg-[#FF7675]/10 text-[#FF7675] whitespace-nowrap ml-2">
                              {event.event_type || 'Event'}
                            </Badge>
                          </div>

                          <div className="space-y-2 sm:space-y-3">
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#636E72]">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {event.starts_at ? formatDate(event.starts_at) : 'TBD'}
                                {event.ends_at && ` - ${formatDate(event.ends_at)}`}
                              </span>
                            </div>

                            {event.location && (
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-[#636E72]">
                                <MapPin className="h-4 w-4" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            )}

                            {event.capacity && (
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-[#636E72]">
                                <Users className="h-4 w-4" />
                                <span>Capacity: {event.capacity} attendees</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-6">
                            <Button variant="outline" className="flex-1 border-gray-200 text-xs sm:text-sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            <Button className="flex-1 bg-gradient-to-r from-[#FF7675] to-[#FF7AA2] text-white text-xs sm:text-sm">
                              <Calendar className="h-4 w-4 mr-2" />
                              Register Now
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
                    <p className="text-[#636E72] max-w-md mx-auto mb-6">
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
        </Tabs>
      </div>
    </div>
  );
}