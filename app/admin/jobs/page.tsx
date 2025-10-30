"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Briefcase, Building2, MapPin, DollarSign, MoreVertical, Edit, Trash2 } from "lucide-react";

export default function AdminJobsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const jobs = [
    {
      id: "1",
      title: "Senior Software Engineer",
      company: "TechCorp",
      type: "full-time",
      status: "published",
      location: "San Francisco, CA",
      salary: "$120,000 - $150,000",
      applications: 24,
      views: 156,
      posted: "2024-01-15",
      expires: "2024-02-15",
      poster: "Sarah Chen"
    },
    {
      id: "2",
      title: "Product Manager",
      company: "StartupXYZ",
      type: "full-time",
      status: "published",
      location: "New York, NY",
      salary: "$100,000 - $130,000",
      applications: 18,
      views: 89,
      posted: "2024-01-14",
      expires: "2024-02-14",
      poster: "Mike Rodriguez"
    },
    {
      id: "3",
      title: "UX Designer",
      company: "DesignStudio",
      type: "contract",
      status: "published",
      location: "Remote",
      salary: "$50 - $70/hour",
      applications: 12,
      views: 67,
      posted: "2024-01-12",
      expires: "2024-02-12",
      poster: "Emily Davis"
    },
    {
      id: "4",
      title: "Data Scientist",
      company: "AnalyticsPro",
      type: "full-time",
      status: "draft",
      location: "Boston, MA",
      salary: "$110,000 - $140,000",
      applications: 0,
      views: 23,
      posted: "2024-01-10",
      expires: "2024-02-10",
      poster: "David Wilson"
    },
    {
      id: "5",
      title: "Marketing Manager",
      company: "GrowthLabs",
      type: "part-time",
      status: "expired",
      location: "Chicago, IL",
      salary: "$80,000 - $100,000",
      applications: 8,
      views: 45,
      posted: "2023-12-20",
      expires: "2024-01-20",
      poster: "Alex Johnson"
    }
  ];

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Job Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage job postings and applications</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Briefcase className="h-4 w-4 mr-2" />
          Post Job
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">45</p>
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">62</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Applications</p>
              </div>
              <Building2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Expired Jobs</p>
              </div>
              <Briefcase className="h-8 w-8 text-red-600" />
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
                placeholder="Search jobs by title or company..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex space-x-2">
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
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
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
                  <TableHead>Salary</TableHead>
                  <TableHead>Applications</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {job.title}
                      </div>
                      <div className="text-sm text-gray-500">by {job.poster}</div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-900 dark:text-white">
                      {job.company}
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeBadge(job.type)}>
                        {job.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                        {job.location}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <DollarSign className="h-3 w-3 mr-1 text-gray-400" />
                        {job.salary}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {job.applications}
                      </div>
                      <div className="text-xs text-gray-500">{job.views} views</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(job.status)}>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}