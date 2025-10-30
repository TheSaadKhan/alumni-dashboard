"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Briefcase, GraduationCap, Users, Filter, UserPlus } from "lucide-react";

export default function NetworkPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  const alumni = [
    {
      id: "1",
      name: "Sarah Chen",
      role: "Engineering Manager",
      company: "TechCorp",
      location: "San Francisco, CA",
      batch: "2015",
      degree: "Computer Science",
      image: "/avatars/sarah-chen.jpg",
      skills: ["React", "Node.js", "Leadership"],
      mutualConnections: 12,
      online: true
    },
    {
      id: "2",
      name: "Mike Rodriguez",
      role: "Product Director",
      company: "StartupXYZ",
      location: "New York, NY",
      batch: "2012",
      degree: "Business Administration",
      image: "/avatars/mike-rodriguez.jpg",
      skills: ["Product Strategy", "UX", "Management"],
      mutualConnections: 8,
      online: false
    },
    {
      id: "3",
      name: "Emily Davis",
      role: "Senior UX Designer",
      company: "DesignStudio",
      location: "Austin, TX",
      batch: "2018",
      degree: "Graphic Design",
      image: "/avatars/emily-davis.jpg",
      skills: ["Figma", "UI/UX", "Research"],
      mutualConnections: 5,
      online: true
    },
    {
      id: "4",
      name: "David Wilson",
      role: "Startup Founder",
      company: "InnovateLabs",
      location: "Boston, MA",
      batch: "2010",
      degree: "Computer Engineering",
      image: "/avatars/david-wilson.jpg",
      skills: ["Entrepreneurship", "AI", "VC"],
      mutualConnections: 3,
      online: false
    }
  ];

  const filteredAlumni = alumni.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Alumni Network</h1>
          <p className="text-gray-600 dark:text-gray-400">Connect with fellow graduates</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <UserPlus className="h-4 w-4 mr-2" />
          Find Alumni
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">1,247</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Alumni</p>
              </div>
              <Users className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">245</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Your Connections</p>
              </div>
              <UserPlus className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">89</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Online Now</p>
              </div>
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">15</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">This Week</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name, role, or company..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Alumni Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAlumni.map((person) => (
          <Card key={person.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start mb-2">
                <div className="relative">
                  <Avatar className="h-16 w-16 border-2 border-white dark:border-gray-800 shadow-lg">
                    <AvatarImage src={person.image} />
                    <AvatarFallback>
                      {person.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {person.online && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                  )}
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  {person.mutualConnections} mutual
                </Badge>
              </div>
              <CardTitle className="text-lg">{person.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {person.role} at {person.company}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {person.location}
                </div>
                <div className="flex items-center">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Batch of {person.batch}
                </div>
                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-2" />
                  {person.degree}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {person.skills.slice(0, 3).map((skill, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {person.skills.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{person.skills.length - 3}
                  </Badge>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Link href={`/dashboard/network/${person.id}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  View Profile
                </Button>
              </Link>
              <Button size="icon" variant="ghost">
                <UserPlus className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredAlumni.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No alumni found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm ? `No alumni matching "${searchTerm}"` : "Try adjusting your search criteria"}
            </p>
            <Button 
              variant="outline"
              onClick={() => setSearchTerm("")}
            >
              Clear Search
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}