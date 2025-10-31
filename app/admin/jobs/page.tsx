"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Filter, 
  Briefcase, 
  Building2, 
  MapPin, 
  DollarSign, 
  MoreVertical, 
  Edit, 
  Trash2,
  Eye,
  Users,
  Calendar,
  Plus,
  Download
} from "lucide-react";

// Mock data - in real app, this would come from API
const mockJobs = [
  {
    id: "1",
    jobId: "job-001",
    title: "Senior Software Engineer",
    company: "TechCorp",
    type: "full-time",
    status: "published",
    location: "San Francisco, CA",
    salary: "$120,000 - $150,000",
    description: "We are looking for an experienced software engineer to join our team...",
    requirements: ["5+ years experience", "React/Node.js", "AWS"],
    applications: 24,
    views: 156,
    posted: "2024-01-15",
    expires: "2024-02-15",
    poster: "Sarah Chen",
    posterId: "user-123",
    category: "Engineering",
    tags: ["JavaScript", "React", "Node.js"],
    remote: false,
    featured: true
  },
  {
    id: "2",
    jobId: "job-002",
    title: "Product Manager",
    company: "StartupXYZ",
    type: "full-time",
    status: "published",
    location: "New York, NY",
    salary: "$100,000 - $130,000",
    description: "Lead product development and strategy for our growing startup...",
    requirements: ["3+ years PM experience", "Agile methodology", "Data analysis"],
    applications: 18,
    views: 89,
    posted: "2024-01-14",
    expires: "2024-02-14",
    poster: "Mike Rodriguez",
    posterId: "user-124",
    category: "Product",
    tags: ["Product Management", "Agile", "UX"],
    remote: true,
    featured: false
  },
  {
    id: "3",
    jobId: "job-003",
    title: "UX Designer",
    company: "DesignStudio",
    type: "contract",
    status: "published",
    location: "Remote",
    salary: "$50 - $70/hour",
    description: "Create beautiful and intuitive user experiences for our clients...",
    requirements: ["Portfolio required", "Figma", "User research"],
    applications: 12,
    views: 67,
    posted: "2024-01-12",
    expires: "2024-02-12",
    poster: "Emily Davis",
    posterId: "user-125",
    category: "Design",
    tags: ["UI/UX", "Figma", "Prototyping"],
    remote: true,
    featured: true
  },
  {
    id: "4",
    jobId: "job-004",
    title: "Data Scientist",
    company: "AnalyticsPro",
    type: "full-time",
    status: "draft",
    location: "Boston, MA",
    salary: "$110,000 - $140,000",
    description: "Analyze complex datasets and build machine learning models...",
    requirements: ["Python", "SQL", "Machine Learning"],
    applications: 0,
    views: 23,
    posted: "2024-01-10",
    expires: "2024-02-10",
    poster: "David Wilson",
    posterId: "user-126",
    category: "Data Science",
    tags: ["Python", "ML", "SQL"],
    remote: false,
    featured: false
  },
  {
    id: "5",
    jobId: "job-005",
    title: "Marketing Manager",
    company: "GrowthLabs",
    type: "part-time",
    status: "expired",
    location: "Chicago, IL",
    salary: "$80,000 - $100,000",
    description: "Develop and execute marketing strategies to drive growth...",
    requirements: ["Digital marketing", "Content strategy", "Analytics"],
    applications: 8,
    views: 45,
    posted: "2023-12-20",
    expires: "2024-01-20",
    poster: "Alex Johnson",
    posterId: "user-127",
    category: "Marketing",
    tags: ["Digital Marketing", "SEO", "Content"],
    remote: true,
    featured: false
  }
];

const mockApplications = [
  { jobId: "job-001", count: 24, new: 5 },
  { jobId: "job-002", count: 18, new: 3 },
  { jobId: "job-003", count: 12, new: 2 },
  { jobId: "job-004", count: 0, new: 0 },
  { jobId: "job-005", count: 8, new: 0 },
];

export default function AdminJobsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const handleViewJob = (jobId: string) => {
    router.push(`/admin/jobs/${jobId}`);
  };

  const handleEditJob = (jobId: string) => {
    router.push(`/admin/jobs/${jobId}/edit`);
  };

  const handleViewApplications = (jobId: string) => {
    router.push(`/admin/jobs/${jobId}/applications`);
  };

  const handleCreateJob = () => {
    router.push("/admin/jobs/create");
  };

  const filteredJobs = mockJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.poster.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    const matchesType = typeFilter === "all" || job.type === typeFilter;
    const matchesCategory = categoryFilter === "all" || job.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesCategory;
  });

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

  const getApplicationCount = (jobId: string) => {
    return mockApplications.find(app => app.jobId === jobId)?.count || 0;
  };

  const getNewApplications = (jobId: string) => {
    return mockApplications.find(app => app.jobId === jobId)?.new || 0;
  };

  const stats = {
    activeJobs: mockJobs.filter(job => job.status === 'published').length,
    totalApplications: mockApplications.reduce((sum, app) => sum + app.count, 0),
    pendingApproval: mockJobs.filter(job => job.status === 'draft').length,
    expiredJobs: mockJobs.filter(job => job.status === 'expired').length,
    featuredJobs: mockJobs.filter(job => job.featured).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Job Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage job postings and applications</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={handleCreateJob}
          >
            <Plus className="h-4 w-4 mr-2" />
            Post Job
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeJobs}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Jobs</p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalApplications}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Applications</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingApproval}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Approval</p>
              </div>
              <Briefcase className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.expiredJobs}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Expired Jobs</p>
              </div>
              <Calendar className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.featuredJobs}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Featured Jobs</p>
              </div>
              <Briefcase className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {mockJobs.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Jobs</p>
              </div>
              <Building2 className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Job Postings</CardTitle>
          <CardDescription>Manage and monitor all job listings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search jobs by title, company, or poster..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select 
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="expired">Expired</option>
                <option value="archived">Archived</option>
              </select>
              <select 
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
              <select 
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Design">Design</option>
                <option value="Data Science">Data Science</option>
                <option value="Marketing">Marketing</option>
              </select>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>

          {/* Jobs Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Applications</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job) => (
                  <TableRow key={job.jobId} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                    <TableCell onClick={() => handleViewJob(job.jobId)}>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white flex items-center">
                          {job.title}
                          {job.featured && (
                            <Badge className="ml-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                              Featured
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">by {job.poster}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {job.category} • {job.remote ? "Remote" : "On-site"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell onClick={() => handleViewJob(job.jobId)}>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {job.company}
                      </div>
                    </TableCell>
                    <TableCell onClick={() => handleViewJob(job.jobId)}>
                      <Badge className={getTypeBadge(job.type)}>
                        {job.type}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={() => handleViewJob(job.jobId)}>
                      <div className="flex items-center text-sm text-gray-900 dark:text-white">
                        <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                        {job.location}
                      </div>
                    </TableCell>
                    <TableCell onClick={() => handleViewApplications(job.jobId)}>
                      <div className="cursor-pointer hover:text-indigo-600 transition-colors">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {getApplicationCount(job.jobId)} applications
                        </div>
                        {getNewApplications(job.jobId) > 0 && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs">
                            {getNewApplications(job.jobId)} new
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell onClick={() => handleViewJob(job.jobId)}>
                      <Badge className={getStatusBadge(job.status)}>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleViewJob(job.jobId)}
                          title="View Job"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditJob(job.jobId)}
                          title="Edit Job"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleViewApplications(job.jobId)}
                          title="View Applications"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="More Options">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredJobs.length === 0 && (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No jobs found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? `No jobs matching "${searchTerm}"` : "No jobs available"}
              </p>
              <Button className="mt-4" onClick={handleCreateJob}>
                <Plus className="h-4 w-4 mr-2" />
                Post First Job
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}