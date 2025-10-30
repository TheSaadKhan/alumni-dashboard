"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Target, Users, Calendar, MessageCircle, Star, BookOpen, GraduationCap } from "lucide-react";

export default function MentorshipPage() {
  const [activeTab, setActiveTab] = useState("mentors");

  const mentors = [
    {
      id: "1",
      name: "Sarah Chen",
      role: "Engineering Manager",
      company: "TechCorp",
      experience: "8 years",
      expertise: ["Career Growth", "Technical Leadership", "Interview Prep"],
      availability: "2 spots left",
      rating: 4.9,
      reviews: 47,
      image: "/avatars/sarah-chen.jpg"
    },
    {
      id: "2",
      name: "Mike Rodriguez",
      role: "Product Director",
      company: "StartupXYZ",
      experience: "10 years",
      expertise: ["Product Management", "Startups", "Strategy"],
      availability: "1 spot left",
      rating: 4.8,
      reviews: 32,
      image: "/avatars/mike-rodriguez.jpg"
    },
    {
      id: "3",
      name: "Emily Davis",
      role: "Senior UX Designer",
      company: "DesignStudio",
      experience: "6 years",
      expertise: ["UX Research", "Design Systems", "Portfolio Review"],
      availability: "3 spots left",
      rating: 4.7,
      reviews: 28,
      image: "/avatars/emily-davis.jpg"
    }
  ];

  const mentees = [
    {
      id: "1",
      name: "Alex Johnson",
      goal: "Transition to Product Management",
      progress: 65,
      nextSession: "Tomorrow, 3:00 PM",
      sessionsCompleted: 4,
      image: "/avatars/alex-johnson.jpg"
    },
    {
      id: "2",
      name: "Maria Garcia",
      goal: "Improve Technical Leadership Skills",
      progress: 40,
      nextSession: "Jan 25, 2:00 PM",
      sessionsCompleted: 2,
      image: "/avatars/maria-garcia.jpg"
    }
  ];

  const stats = {
    totalMentors: 45,
    activeMentorships: 2,
    sessionsCompleted: 12,
    hoursMentored: 18
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mentorship</h1>
        <p className="text-gray-600 dark:text-gray-400">Connect with mentors and guide the next generation</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalMentors}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Available Mentors</p>
              </div>
              <Users className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeMentorships}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Mentorships</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.sessionsCompleted}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sessions Completed</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.hoursMentored}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Hours Mentored</p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {["mentors", "my-mentorships", "become-mentor"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </button>
        ))}
      </div>

      {/* Mentors Tab */}
      {activeTab === "mentors" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Available Mentors</h2>
            <Button variant="outline">
              <GraduationCap className="h-4 w-4 mr-2" />
              Request Mentor
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor) => (
              <Card key={mentor.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <Avatar className="h-16 w-16 border-2 border-white dark:border-gray-800 shadow-lg">
                      <AvatarImage src={mentor.image} />
                      <AvatarFallback>
                        {mentor.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      {mentor.availability}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{mentor.name}</CardTitle>
                  <CardDescription>
                    {mentor.role} at {mentor.company}
                  </CardDescription>
                  <div className="flex items-center space-x-1 mt-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {mentor.rating}
                    </span>
                    <span className="text-sm text-gray-500">({mentor.reviews} reviews)</span>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Expertise</p>
                      <div className="flex flex-wrap gap-1">
                        {mentor.expertise.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Experience</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{mentor.experience}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 flex-1">
                    Request Session
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* My Mentorships Tab */}
      {activeTab === "my-mentorships" && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Active Mentorships</h2>
          
          {mentees.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mentees.map((mentee) => (
                <Card key={mentee.id}>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={mentee.image} />
                        <AvatarFallback>
                          {mentee.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{mentee.name}</CardTitle>
                        <CardDescription>{mentee.goal}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="font-medium">{mentee.progress}%</span>
                      </div>
                      <Progress value={mentee.progress} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Next Session</p>
                        <p className="font-medium text-gray-900 dark:text-white">{mentee.nextSession}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Sessions Completed</p>
                        <p className="font-medium text-gray-900 dark:text-white">{mentee.sessionsCompleted}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      Reschedule
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 flex-1">
                      Prepare Session
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No active mentorships
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You don't have any active mentorship relationships yet.
                </p>
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => setActiveTab("mentors")}
                >
                  Find a Mentor
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Become Mentor Tab */}
      {activeTab === "become-mentor" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Become a Mentor</CardTitle>
              <CardDescription>
                Share your knowledge and experience with fellow alumni
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Benefits of Mentoring</h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Give back to the alumni community
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Enhance your leadership skills
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Expand your professional network
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Gain fresh perspectives
                    </li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Requirements</h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      Minimum 3 years professional experience
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      Commitment to monthly sessions
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      Willingness to share knowledge
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      Active alumni association member
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                      Ready to make an impact?
                    </h4>
                    <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                      Join our mentorship program and help shape the next generation of professionals from our alumni community.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-indigo-600 hover:bg-indigo-700 w-full">
                Apply to Become a Mentor
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}