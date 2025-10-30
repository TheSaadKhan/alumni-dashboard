"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Briefcase, GraduationCap, Calendar, Mail, MessageCircle, Users, Award } from "lucide-react";

export default function AlumniProfilePage() {
  const params = useParams();
  const router = useRouter();

  // Mock alumni data
  const alumni = {
    id: params.alumniId,
    name: "Sarah Chen",
    role: "Engineering Manager",
    company: "TechCorp",
    location: "San Francisco, CA",
    batch: "2015",
    degree: "Computer Science",
    bio: "Experienced engineering leader passionate about building scalable products and mentoring the next generation of developers. Currently leading the platform team at TechCorp.",
    skills: ["React", "Node.js", "TypeScript", "AWS", "System Design", "Team Leadership"],
    experience: [
      {
        id: "1",
        role: "Engineering Manager",
        company: "TechCorp",
        period: "2022 - Present",
        description: "Leading a team of 15 engineers building the core platform."
      },
      {
        id: "2",
        role: "Senior Software Engineer",
        company: "StartupXYZ",
        period: "2019 - 2022",
        description: "Full-stack development and technical leadership."
      },
      {
        id: "3",
        role: "Software Engineer",
        company: "DevSolutions",
        period: "2017 - 2019",
        description: "Frontend development and API design."
      }
    ],
    education: [
      {
        id: "1",
        degree: "Bachelor of Science in Computer Science",
        institution: "University of Technology",
        period: "2011 - 2015",
        achievements: ["Summa Cum Laude", "President of Coding Club"]
      }
    ],
    achievements: [
      "Featured in Tech Magazine's 30 Under 30",
      "Open Source Contributor of the Year 2022",
      "University Distinguished Alumni Award 2023"
    ],
    connections: 245,
    mutualConnections: 12
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/network")}>
            <Users className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{alumni.name}</h1>
            <p className="text-gray-600 dark:text-gray-400">Alumni Profile</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <MessageCircle className="h-4 w-4 mr-2" />
            Message
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Users className="h-4 w-4 mr-2" />
            Connect
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">{alumni.bio}</p>
            </CardContent>
          </Card>

          {/* Experience */}
          <Card>
            <CardHeader>
              <CardTitle>Work Experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {alumni.experience.map((exp) => (
                <div key={exp.id} className="flex space-x-4">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Briefcase className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{exp.role}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{exp.company}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">{exp.period}</p>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">{exp.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Education */}
          <Card>
            <CardHeader>
              <CardTitle>Education</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {alumni.education.map((edu) => (
                <div key={edu.id} className="flex space-x-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{edu.degree}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{edu.institution}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">{edu.period}</p>
                    <div className="mt-2">
                      {edu.achievements.map((achievement, index) => (
                        <Badge key={index} variant="secondary" className="mr-2 mb-2">
                          {achievement}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-white dark:border-gray-800 shadow-lg">
                  <AvatarImage src="/avatars/sarah-chen.jpg" />
                  <AvatarFallback className="text-xl">
                    {alumni.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{alumni.name}</h2>
                <p className="text-gray-600 dark:text-gray-400">{alumni.role} at {alumni.company}</p>
                
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    {alumni.location}
                  </div>
                  <div className="flex items-center justify-center">
                    <GraduationCap className="h-4 w-4 mr-2 text-gray-400" />
                    Batch of {alumni.batch} • {alumni.degree}
                  </div>
                  <div className="flex items-center justify-center">
                    <Users className="h-4 w-4 mr-2 text-gray-400" />
                    {alumni.connections} connections • {alumni.mutualConnections} mutual
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {alumni.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Achievements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alumni.achievements.map((achievement, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Award className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">{achievement}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}