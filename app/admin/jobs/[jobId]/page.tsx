"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Briefcase, Building2, MapPin, DollarSign, Calendar, Users, Mail, Download, BarChart3, Edit } from "lucide-react";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();

  // Mock job data - in real app, fetch based on jobId
  const job = {
    id: params.jobId,
    title: "Senior Software Engineer",
    company: "TechCorp",
    type: "full-time",
    status: "published",
    location: "San Francisco, CA",
    salary: "$120,000 - $150,000",
    description: "We are looking for an experienced Software Engineer to join our core platform team. You will be responsible for designing, developing, and maintaining scalable software solutions.",
    requirements: ["5+ years experience", "React/Node.js", "AWS", "TypeScript"],
    posted: "2024-01-15",
    expires: "2024-02-15",
    applications: 24,
    views: 156,
    poster: {
      name: "Sarah Chen",
      email: "sarah.chen@techcorp.com",
      role: "Engineering Manager",
      batch: "2015"
    }
  };

  const applications = [
    { id: 1, name: "Mike Rodriguez", email: "mike@example.com", applied: "2024-01-20", status: "review", match: 85 },
    { id: 2, name: "Emily Davis", email: "emily@example.com", applied: "2024-01-19", status: "interview", match: 92 },
    { id: 3, name: "David Wilson", email: "david@example.com", applied: "2024-01-18", status: "rejected", match: 45 },
    { id: 4, name: "Alex Johnson", email: "alex@example.com", applied: "2024-01-17", status: "review", match: 78 },
    { id: 5, name: "Maria Garcia", email: "maria@example.com", applied: "2024-01-16", status: "accepted", match: 95 }
  ];

  const statistics = {
    applicationRate: 15.4,
    viewToApply: 3.2,
    avgMatchScore: 79,
    topSkills: ["React", "Node.js", "TypeScript", "AWS"]
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      expired: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      archived: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      "full-time": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      "part-time": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      contract: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      internship: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
    };
    return styles[type as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const getApplicationStatusBadge = (status: string) => {
    const styles = {
      review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      interview: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      accepted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/jobs")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Job Details</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage job posting and applications</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Job
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Briefcase className="h-4 w-4 mr-2" />
            Manage Posting
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Job Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Information</CardTitle>
                  <CardDescription>Job posting details and requirements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className={getTypeBadge(job.type)}>
                      {job.type}
                    </Badge>
                    <Badge className={getStatusBadge(job.status)}>
                      {job.status}
                    </Badge>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{job.title}</h2>
                  <div className="flex items-center text-lg text-gray-600 dark:text-gray-300">
                    <Building2 className="h-5 w-5 mr-2" />
                    {job.company}
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300">{job.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        {job.location}
                      </div>
                      <div className="flex items-center text-sm">
                        <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                        {job.salary}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        Posted {new Date(job.posted).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm">
                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                        {job.applications} applications
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Requirements</h4>
                    <div className="flex flex-wrap gap-2">
                      {job.requirements.map((requirement, index) => (
                        <Badge key={index} variant="secondary">
                          {requirement}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Application Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Application Statistics</CardTitle>
                  <CardDescription>Current application metrics and trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{job.applications}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Applications</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{job.views}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Views</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.applicationRate}%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Apply Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.avgMatchScore}%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Avg Match</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Applications Tab */}
            <TabsContent value="applications">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Job Applications</CardTitle>
                      <CardDescription>Candidates who applied for this position</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Applications
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Candidate</TableHead>
                          <TableHead>Match Score</TableHead>
                          <TableHead>Applied</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {applications.map((application) => (
                          <TableRow key={application.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={`/avatars/${application.name.toLowerCase().replace(' ', '-')}.jpg`} />
                                  <AvatarFallback>
                                    {application.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {application.name}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {application.email}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Progress value={application.match} className="h-2 w-16" />
                                <span className="text-sm font-medium">{application.match}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(application.applied).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge className={getApplicationStatusBadge(application.status)}>
                                {application.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                <Mail className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Job Analytics</CardTitle>
                  <CardDescription>Performance metrics and insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card>
                      <CardContent className="p-6 text-center">
                        <BarChart3 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {statistics.applicationRate}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Application Rate</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Users className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {statistics.viewToApply}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Views per Application</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6 text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {statistics.avgMatchScore}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Average Match Score</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Top Required Skills</h4>
                    <div className="space-y-2">
                      {statistics.topSkills.map((skill, index) => (
                        <div key={skill} className="flex items-center justify-between">
                          <span className="text-sm">{skill}</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {Math.round((1 - index * 0.2) * 100)}% match
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Job Settings</CardTitle>
                  <CardDescription>Manage job posting configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Posting Details</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>Posted By</span>
                          <span className="font-medium">{job.poster.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Contact Email</span>
                          <span className="font-medium">{job.poster.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Posted Date</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {new Date(job.posted).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Expires</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {new Date(job.expires).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h4>
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full justify-start">
                          Extend Deadline
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          Duplicate Job
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          Pause Applications
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h4>
                    <div className="space-y-3">
                      <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                        Close Job Posting
                      </Button>
                      <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                        Delete Job Posting
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Job Status */}
          <Card>
            <CardHeader>
              <CardTitle>Job Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status</span>
                <Badge className={getStatusBadge(job.status)}>
                  {job.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Type</span>
                <Badge className={getTypeBadge(job.type)}>
                  {job.type}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Applications</span>
                <span className="text-sm font-medium">{job.applications}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Days Remaining</span>
                <span className="text-sm font-medium">
                  {Math.ceil((new Date(job.expires).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Poster Info */}
          <Card>
            <CardHeader>
              <CardTitle>Job Poster</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`/avatars/${job.poster.name.toLowerCase().replace(' ', '-')}.jpg`} />
                  <AvatarFallback>
                    {job.poster.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{job.poster.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{job.poster.role}</p>
                  <p className="text-xs text-gray-500">Batch of {job.poster.batch}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Contact Poster
              </Button>
            </CardContent>
          </Card>

          {/* Admin Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Edit className="h-4 w-4 mr-2" />
                Edit Details
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Contact Applicants
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Reports
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}