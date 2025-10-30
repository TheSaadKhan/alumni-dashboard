"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Mail, Phone, Calendar, MapPin, GraduationCap, Briefcase, Users, Shield, Edit } from "lucide-react";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();

  // Mock user data - in real app, fetch based on userId
  const user = {
    id: params.userId,
    name: "Sarah Chen",
    email: "sarah.chen@example.com",
    phone: "+1 (555) 123-4567",
    role: "alumni",
    status: "active",
    batch: "2015",
    degree: "Computer Science",
    location: "San Francisco, CA",
    company: "TechCorp",
    position: "Engineering Manager",
    joinDate: "2023-01-15",
    lastActive: "2024-01-20",
    bio: "Experienced engineering leader passionate about building scalable products and mentoring the next generation of developers.",
    skills: ["React", "Node.js", "TypeScript", "AWS", "System Design", "Team Leadership"],
    connections: 245,
    eventsAttended: 12,
    jobsPosted: 3,
    donations: 10000
  };

  const activityLog = [
    {
      id: 1,
      action: "Logged in",
      timestamp: "2024-01-20T10:30:00Z",
      ip: "192.168.1.100"
    },
    {
      id: 2,
      action: "Updated profile",
      timestamp: "2024-01-19T14:22:00Z",
      ip: "192.168.1.100"
    },
    {
      id: 3,
      action: "Posted job",
      timestamp: "2024-01-18T11:15:00Z",
      ip: "192.168.1.100"
    },
    {
      id: 4,
      action: "Registered for event",
      timestamp: "2024-01-17T09:45:00Z",
      ip: "192.168.1.100"
    },
    {
      id: 5,
      action: "Made donation",
      timestamp: "2024-01-15T16:20:00Z",
      ip: "192.168.1.100"
    }
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      alumni: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      student: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    };
    return styles[role as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/users")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Details</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage user account and permissions</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit User
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Shield className="h-4 w-4 mr-2" />
            Manage Access
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Basic user details and contact information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-6">
                <Avatar className="h-20 w-20 border-2 border-white dark:border-gray-800 shadow-lg">
                  <AvatarImage src={`/avatars/${user.name.toLowerCase().replace(' ', '-')}.jpg`} />
                  <AvatarFallback className="text-xl">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Personal Info</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{user.email}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{user.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{user.location}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Education & Work</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <GraduationCap className="h-4 w-4 mr-2 text-gray-400" />
                        <span>Batch of {user.batch} • {user.degree}</span>
                      </div>
                      <div className="flex items-center">
                        <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{user.position} at {user.company}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Bio</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">{user.bio}</p>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>User actions and system interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityLog.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell className="font-medium">{activity.action}</TableCell>
                        <TableCell>
                          {new Date(activity.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>{activity.ip}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status</span>
                <Badge className={getStatusBadge(user.status)}>
                  {user.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Role</span>
                <Badge className={getRoleBadge(user.role)}>
                  {user.role}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Joined</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(user.joinDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Last Active</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(user.lastActive).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="text-sm">Connections</span>
                </div>
                <span className="font-medium">{user.connections}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-green-500" />
                  <span className="text-sm">Events Attended</span>
                </div>
                <span className="font-medium">{user.eventsAttended}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-2 text-purple-500" />
                  <span className="text-sm">Jobs Posted</span>
                </div>
                <span className="font-medium">{user.jobsPosted}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-orange-500" />
                  <span className="text-sm">Total Donations</span>
                </div>
                <span className="font-medium">${user.donations.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Send Message
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Reset Password
              </Button>
              {user.status === "active" ? (
                <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                  Suspend Account
                </Button>
              ) : (
                <Button variant="outline" className="w-full justify-start text-green-600 hover:text-green-700">
                  Activate Account
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}