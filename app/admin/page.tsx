"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Calendar, 
  Briefcase, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  MessageCircle,
  UserPlus 
} from "lucide-react";

export default function AdminDashboardPage() {
  const stats = {
    totalUsers: 1247,
    newUsers: 23,
    activeEvents: 8,
    pendingJobs: 12,
    totalDonations: 125000,
    growthRate: 12.5
  };

  const recentActivity = [
    {
      id: 1,
      user: "Sarah Chen",
      action: "created new event",
      target: "Tech Industry Panel",
      time: "2 hours ago",
      type: "event"
    },
    {
      id: 2,
      user: "Mike Rodriguez",
      action: "posted job",
      target: "Senior Product Manager",
      time: "4 hours ago",
      type: "job"
    },
    {
      id: 3,
      user: "Emily Davis",
      action: "made donation",
      target: "$1,000",
      time: "1 day ago",
      type: "donation"
    },
    {
      id: 4,
      user: "Alex Johnson",
      action: "updated profile",
      target: "",
      time: "1 day ago",
      type: "user"
    }
  ];

  const pendingApprovals = [
    { id: 1, type: "event", title: "Alumni Golf Tournament", submittedBy: "David Wilson", days: 2 },
    { id: 2, type: "job", title: "Frontend Developer", submittedBy: "TechStart Inc", days: 1 },
    { id: 3, type: "user", title: "Profile Verification", submittedBy: "Maria Garcia", days: 3 }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "event": return <Calendar className="h-4 w-4 text-blue-500" />;
      case "job": return <Briefcase className="h-4 w-4 text-green-500" />;
      case "donation": return <DollarSign className="h-4 w-4 text-green-500" />;
      case "user": return <UserPlus className="h-4 w-4 text-purple-500" />;
      default: return <MessageCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getApprovalBadge = (type: string) => {
    const styles = {
      event: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      job: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      user: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
    };
    return styles[type as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome to the AlumniConnect admin panel</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          Generate Report
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">{stats.growthRate}% growth</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.newUsers}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">New This Week</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeEvents}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Events</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">${(stats.totalDonations / 1000).toFixed(0)}K</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Donations</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions from users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">{activity.user}</span> {activity.action}
                      {activity.target && (
                        <span className="font-medium"> {activity.target}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
              Pending Approvals
            </CardTitle>
            <CardDescription>Items waiting for review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingApprovals.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge className={getApprovalBadge(item.type)}>
                        {item.type}
                      </Badge>
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Submitted by {item.submittedBy}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">{item.days}d ago</span>
                    <Button size="sm">Review</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-16 flex-col">
              <Users className="h-5 w-5 mb-1" />
              <span>Manage Users</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <Calendar className="h-5 w-5 mb-1" />
              <span>Create Event</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <Briefcase className="h-5 w-5 mb-1" />
              <span>Post Job</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <DollarSign className="h-5 w-5 mb-1" />
              <span>View Donations</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}