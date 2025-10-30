"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Briefcase, MapPin, Clock, DollarSign, Plus, Building2 } from "lucide-react";

export default function JobsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  const jobs = [
    {
      id: "1",
      title: "Senior Software Engineer",
      company: "TechCorp",
      location: "San Francisco, CA",
      type: "full-time",
      salary: "$120,000 - $150,000",
      posted: "2024-01-15",
      description: "We are looking for an experienced software engineer to join our core platform team.",
      requirements: ["5+ years experience", "React/Node.js", "AWS", "TypeScript"],
      remote: true,
      featured: true
    },
    {
      id: "2",
      title: "Product Manager",
      company: "StartupXYZ",
      location: "New York, NY",
      type: "full-time",
      salary: "$100,000 - $130,000",
      posted: "2024-01-14",
      description: "Lead product development for our new SaaS platform.",
      requirements: ["3+ years PM experience", "Agile methodology", "Data analysis"],
      remote: false,
      featured: false
    },
    {
      id: "3",
      title: "UX Designer",
      company: "DesignStudio",
      location: "Remote",
      type: "contract",
      salary: "$50 - $70/hour",
      posted: "2024-01-12",
      description: "Contract position for mobile app redesign project.",
      requirements: ["UI/UX design", "Figma", "User research", "Prototyping"],
      remote: true,
      featured: true
    }
  ];

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || job.type === filter;
    return matchesSearch && matchesFilter;
  });

  const getJobTypeColor = (type: string) => {
    const colors = {
      "full-time": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      "part-time": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      "contract": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      "internship": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Job Board</h1>
          <p className="text-gray-600 dark:text-gray-400">Find opportunities from alumni companies</p>
        </div>
        <Link href="/dashboard/jobs/post">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Post a Job
          </Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search jobs, companies..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {["all", "full-time", "part-time", "contract", "internship"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === type
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {type === "all" ? "All" : type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.map((job) => (
          <Card key={job.id} className={`hover:shadow-lg transition-shadow ${job.featured ? 'border-indigo-300 dark:border-indigo-700' : ''}`}>
            {job.featured && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                  Featured
                </Badge>
              </div>
            )}
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between mb-2">
                <Badge className={getJobTypeColor(job.type)}>
                  {job.type}
                </Badge>
                {job.remote && (
                  <Badge variant="secondary">Remote</Badge>
                )}
              </div>
              <CardTitle className="text-lg">{job.title}</CardTitle>
              <CardDescription className="flex items-center">
                <Building2 className="h-4 w-4 mr-1" />
                {job.company}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {job.location}
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  {job.salary}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  {new Date(job.posted).toLocaleDateString()}
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {job.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {job.requirements.slice(0, 3).map((req, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {req}
                  </Badge>
                ))}
                {job.requirements.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{job.requirements.length - 3} more
                  </Badge>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Link href={`/dashboard/jobs/${job.id}`} className="w-full">
                <Button variant="outline" className="w-full">
                  View Details
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No jobs found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm ? `No jobs matching "${searchTerm}"` : "No jobs available at the moment."}
            </p>
            <Link href="/dashboard/jobs/post">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                Post First Job
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}