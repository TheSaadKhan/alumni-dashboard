"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Search,
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  MoreVertical,
  Edit,
  Trash2,
  Plus,
  Loader2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminJobsPage() {
  const router = useRouter();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        const orgsRes = await fetch("/api/organizations");
        if (!orgsRes.ok) throw new Error("Failed to load organizations");
        const orgsData = await orgsRes.json();

        if (orgsData.organizations && orgsData.organizations.length > 0) {
          const primaryOrg = orgsData.organizations[0];
          setOrganizationId(primaryOrg.id);

          const jobsRes = await fetch(
            `/api/jobs?organizationId=${primaryOrg.id}&status=${statusFilter}&type=${typeFilter}`
          );
          if (!jobsRes.ok) throw new Error("Failed to load jobs");
          const jobsData = await jobsRes.json();
          setJobs(jobsData.jobs || []);
        }
      } catch (err: any) {
        console.error("Failed to load jobs:", err);
        toast.error("Failed to load jobs");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, statusFilter, typeFilter]);

  const handleDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;

    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete job");

      toast.success("Job deleted successfully");
      setJobs(jobs.filter((j) => j.id !== jobId));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete job");
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      expired: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      archived: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      "full-time": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      "part-time": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      contract: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      freelance: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      internship: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
    };
    return styles[type as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const stats = {
    total: jobs.length,
    published: jobs.filter((j) => j.status === "published").length,
    draft: jobs.filter((j) => j.status === "draft").length,
    applications: jobs.reduce((sum, j) => sum + (j.job_applications?.length || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Job Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage job postings and applications</p>
        </div>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
          onClick={() => router.push("/admin/jobs/create")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Post Job
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Jobs</p>
              </div>
              <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.published}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Published</p>
              </div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.draft}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Draft</p>
              </div>
              <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.applications}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Applications</p>
              </div>
              <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Jobs</CardTitle>
          <CardDescription>Manage job postings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search jobs..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="expired">Expired</option>
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
                <option value="freelance">Freelance</option>
                <option value="internship">Internship</option>
              </select>
            </div>
          </div>

          {/* Jobs Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead className="hidden sm:table-cell">Company</TableHead>
                  <TableHead className="hidden md:table-cell">Location</TableHead>
                  <TableHead className="hidden lg:table-cell">Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No jobs found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {searchTerm
                          ? `No jobs matching "${searchTerm}"`
                          : "No jobs available"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {job.title}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500">
                            {job.job_applications?.length || 0} applications
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-gray-900 dark:text-white">
                        {job.company_name || "N/A"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-gray-900 dark:text-white">
                        {job.location || "Remote"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge className={getTypeBadge(job.employment_type || "full-time")}>
                          {job.employment_type || "full-time"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(job.status)}>{job.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/jobs/${job.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/jobs/${job.id}/edit`)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(job.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
