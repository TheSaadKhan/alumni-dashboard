"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, GraduationCap, Target, TrendingUp, Award } from "lucide-react";

export default function ImpactPage() {
  const impactStats = {
    totalDonations: 125000,
    donationGoal: 200000,
    studentsSupported: 45,
    mentorshipHours: 320,
    eventsHosted: 18,
    volunteers: 89
  };

  const initiatives = [
    {
      id: "1",
      title: "Scholarship Program",
      description: "Supporting deserving students with financial aid",
      progress: 75,
      raised: 75000,
      goal: 100000,
      donors: 234
    },
    {
      id: "2",
      title: "Campus Infrastructure",
      description: "Renovating library and study spaces",
      progress: 45,
      raised: 45000,
      goal: 100000,
      donors: 156
    },
    {
      id: "3",
      title: "Mentorship Program",
      description: "Connecting students with alumni mentors",
      progress: 90,
      raised: 9000,
      goal: 10000,
      donors: 89
    }
  ];

  const topContributors = [
    { name: "Sarah Chen", amount: 10000, batch: "2015" },
    { name: "Mike Johnson", amount: 7500, batch: "2012" },
    { name: "Emily Davis", amount: 5000, batch: "2018" },
    { name: "David Wilson", amount: 4500, batch: "2010" },
    { name: "Lisa Brown", amount: 4000, batch: "2016" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Our Impact</h1>
        <p className="text-gray-600 dark:text-gray-400">See how alumni contributions are making a difference</p>
      </div>

      {/* Impact Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <Heart className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${(impactStats.totalDonations / 1000).toFixed(0)}K
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Raised</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round((impactStats.totalDonations / impactStats.donationGoal) * 100)}%
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Goal Progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {impactStats.studentsSupported}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Students Supported</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {impactStats.mentorshipHours}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Mentorship Hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {impactStats.eventsHosted}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Events Hosted</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {impactStats.volunteers}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Volunteers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Initiatives */}
        <Card>
          <CardHeader>
            <CardTitle>Current Initiatives</CardTitle>
            <CardDescription>Ongoing fundraising campaigns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {initiatives.map((initiative) => (
              <div key={initiative.id} className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {initiative.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {initiative.description}
                    </p>
                  </div>
                  <Badge variant="secondary">{initiative.progress}%</Badge>
                </div>
                <Progress value={initiative.progress} className="h-2" />
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>${initiative.raised.toLocaleString()} raised</span>
                  <span>Goal: ${initiative.goal.toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {initiative.donors} donors
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Contributors */}
        <Card>
          <CardHeader>
            <CardTitle>Top Contributors</CardTitle>
            <CardDescription>Our most generous alumni donors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topContributors.map((contributor, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                        {contributor.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {contributor.name}
                      </div>
                      <div className="text-sm text-gray-500">Batch of {contributor.batch}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      ${contributor.amount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Total Donated</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Impact Stories */}
      <Card>
        <CardHeader>
          <CardTitle>Impact Stories</CardTitle>
          <CardDescription>See how your contributions are changing lives</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((story) => (
              <Card key={story} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                    <GraduationCap className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Scholarship Recipient Success
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    "Thanks to the alumni scholarship, I was able to focus on my studies and land my dream job at Google."
                  </p>
                  <div className="text-xs text-gray-500">
                    - Maria Gonzalez, Computer Science '23
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}