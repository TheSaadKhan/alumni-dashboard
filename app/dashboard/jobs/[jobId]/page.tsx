"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, DollarSign, Building2, Users, Share2, Bookmark, ArrowLeft, Calendar } from "lucide-react";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();

  // Mock job data - in real app, fetch based on jobId
  const job = {
    id: params.jobId,
    title: "Senior Software Engineer",
    company: "TechCorp",
    location: "San Francisco, CA",
    type: "full-time",
    salary: "$120,000 - $150,000",
    posted: "2024-01-15",
    description: "We are looking for an experienced Software Engineer to join our core platform team. You will be responsible for designing, developing, and maintaining scalable software solutions that power our platform serving millions of users.",
    responsibilities: [
      "Design, develop, and maintain high-performance, scalable software systems",
      "Collaborate with cross-functional teams to define, design, and ship new features",
      "Write clean, maintainable, and efficient code following best practices",
      "Participate in code reviews and provide constructive feedback",
      "Troubleshoot and debug applications to optimize performance",
      "Mentor junior developers and participate in knowledge sharing"
    ],
    requirements: [
      "5+ years of professional software development experience",
      "Strong proficiency in JavaScript/TypeScript, Node.js, and React",
      "Experience with cloud platforms (AWS, GCP, or Azure)",
      "Knowledge of database systems (SQL and NoSQL)",
      "Experience with microservices architecture and REST APIs",
      "Familiarity with DevOps practices and CI/CD pipelines",
      "Excellent problem-solving and communication skills"
    ],
    benefits: [
      "Competitive salary and equity package",
      "Comprehensive health, dental, and vision insurance",
      "Flexible work hours and remote work options",
      "Professional development budget",
      "401(k) with company matching",
      "Unlimited paid time off",
      "Stocked kitchen and catered meals"
    ],
    remote: true,
    featured: true,
    poster: {
      name: "Sarah Chen",
      role: "Engineering Manager",
      batch: "2015",
      image: "/posters/sarah-chen.jpg",
      email: "sarah.chen@techcorp.com"
    },
    applicationDeadline: "2024-02-15"
  };

  const handleApply = () => {
    // Handle application logic
    console.log("Applying for job:", job.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{job.title}</h1>
            <p className="text-gray-600 dark:text-gray-400">{job.company}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon">
            <Bookmark className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Job Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center text-sm">
                  <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                  {job.company}
                </div>
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  {job.location}
                </div>
                <div className="flex items-center text-sm">
                  <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                  {job.salary}
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  {job.type}
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">{job.description}</p>
            </CardContent>
          </Card>

          {/* Responsibilities */}
          <Card>
            <CardHeader>
              <CardTitle>Key Responsibilities</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {job.responsibilities.map((responsibility, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-600 dark:text-gray-300">{responsibility}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {job.requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-600 dark:text-gray-300">{requirement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card>
            <CardHeader>
              <CardTitle>Benefits & Perks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {job.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-gray-600 dark:text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Apply Card */}
          <Card>
            <CardHeader>
              <CardTitle>Apply for this Job</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Posted</span>
                <span>{new Date(job.posted).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Deadline</span>
                <span>{new Date(job.applicationDeadline).toLocaleDateString()}</span>
              </div>
              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                onClick={handleApply}
              >
                Apply Now
              </Button>
              <Button variant="outline" className="w-full">
                Save for Later
              </Button>
            </CardContent>
          </Card>

          {/* Poster Info */}
          <Card>
            <CardHeader>
              <CardTitle>Job Poster</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={job.poster.image} />
                  <AvatarFallback>{job.poster.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{job.poster.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{job.poster.role}</p>
                  <p className="text-xs text-gray-500">Batch of {job.poster.batch}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                Contact Poster
              </Button>
            </CardContent>
          </Card>

          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle>About {job.company}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Industry</span>
                <span>Technology</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Company Size</span>
                <span>501-1000 employees</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Alumni Working</span>
                <span>25+</span>
              </div>
              <Button variant="outline" className="w-full">
                View Company Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}