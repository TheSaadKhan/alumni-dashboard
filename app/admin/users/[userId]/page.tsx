"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Phone, Calendar, MapPin, GraduationCap, Briefcase, Users, Shield, Edit, Activity, Settings } from "lucide-react";

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
    donations: 10000,
    profileCompletion: 95
  };

  const activityLog = [
    {
      id: 1,
      action: "Logged in",
      timestamp: "2024-01-20T10:30:00Z",
      ip: "192.168.1.100",
      device: "Chrome on Windows"
    },
    {
      id: 2,
      action: "Updated profile",
      timestamp: "2024-01-19T14:22:00Z",
      ip: "192.168.1.100",
      device: "Chrome on Windows"
    },
    {
      id: 3,
      action: "Posted job: Senior Frontend Developer",
      timestamp: "2024-01-18T11:15:00Z",
      ip: "192.168.1.100",
      device: "Chrome on Windows"
    },
    {
      id: 4,
      action: "Registered for event: Tech Industry Panel",
      timestamp: "2024-01-17T09:45:00Z",
      ip: "192.168.1.100",
      device: "Safari on iPhone"
    },
    {
      id: 5,
      action: "Made donation: $10,000",
      timestamp: "2024-01-15T16:20:00Z",
      ip: "192.168.1.100",
      device: "Chrome on Windows"
    }
  ];

  const connections = [
    { id: 1, name: "Mike Rodriguez", role: "Product Director", connected: "2023-02-15" },
    { id: 2, name: "Emily Davis", role: "Senior UX Designer", connected: "2023-03-20" },
    { id: 3, name: "David Wilson", role: "Startup Founder", connected: "2023-04-10" },
    { id: 4, name: "Alex Johnson", role: "Software Engineer", connected: "2023-05-05" }
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
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Profile</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Activity</span>
              </TabsTrigger>
              <TabsTrigger value="connections" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Connections</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
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

              {/* Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>User Statistics</CardTitle>
                  <CardDescription>Platform engagement and activity metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{user.connections}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Connections</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{user.eventsAttended}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Events Attended</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{user.jobsPosted}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Jobs Posted</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">${user.donations.toLocaleString()}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Donated</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity">
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
                          <TableHead>Device</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Timestamp</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activityLog.map((activity) => (
                          <TableRow key={activity.id}>
                            <TableCell className="font-medium">{activity.action}</TableCell>
                            <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                              {activity.device}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                              {activity.ip}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(activity.timestamp).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Connections Tab */}
            <TabsContent value="connections">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Connections</CardTitle>
                  <CardDescription>Users recently connected with</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {connections.map((connection) => (
                      <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={`/avatars/${connection.name.toLowerCase().replace(' ', '-')}.jpg`} />
                            <AvatarFallback>
                              {connection.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {connection.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {connection.role}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          Connected {new Date(connection.connected).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Manage user permissions and access</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Account Status</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Status</span>
                          <Badge className={getStatusBadge(user.status)}>
                            {user.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Role</span>
                          <Badge className={getRoleBadge(user.role)}>
                            {user.role}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Profile Completion</span>
                          <span className="text-sm font-medium">{user.profileCompletion}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Dates</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Joined</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(user.joinDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Last Active</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(user.lastActive).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button variant="outline" className="justify-start">
                        <Mail className="h-4 w-4 mr-2" />
                        Send Message
                      </Button>
                      <Button variant="outline" className="justify-start">
                        <Shield className="h-4 w-4 mr-2" />
                        Reset Password
                      </Button>
                      <Button variant="outline" className="justify-start">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                      {user.status === "active" ? (
                        <Button variant="outline" className="justify-start text-red-600 hover:text-red-700">
                          Suspend Account
                        </Button>
                      ) : (
                        <Button variant="outline" className="justify-start text-green-600 hover:text-green-700">
                          Activate Account
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle>Account Overview</CardTitle>
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
              <CardTitle>Engagement Metrics</CardTitle>
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

          {/* Admin Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Change Role
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Edit className="h-4 w-4 mr-2" />
                Edit Permissions
              </Button>
              <div className="border-t pt-3">
                <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                  Export User Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}