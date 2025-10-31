"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Clock, MapPin, Users, Edit, Mail, Download, BarChart3, Settings } from "lucide-react";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();

  // Mock event data - in real app, fetch based on eventId
  const event = {
    id: params.eventId,
    title: "Annual Alumni Reunion 2024",
    description: "Join us for the biggest alumni gathering of the year with special guest speakers and networking sessions.",
    type: "reunion",
    status: "published",
    date: "2024-06-15",
    time: "18:00",
    endTime: "22:00",
    location: "University Main Campus, Grand Ballroom",
    address: "123 University Avenue, City, State 12345",
    maxAttendees: 300,
    currentAttendees: 250,
    organizer: "Alumni Relations Office",
    organizerEmail: "alumni@university.edu",
    created: "2024-01-10",
    updated: "2024-01-18"
  };

  const attendees = [
    { id: 1, name: "Sarah Chen", email: "sarah.chen@example.com", registered: "2024-01-15", status: "confirmed" },
    { id: 2, name: "Mike Rodriguez", email: "mike.rodriguez@example.com", registered: "2024-01-14", status: "confirmed" },
    { id: 3, name: "Emily Davis", email: "emily.davis@example.com", registered: "2024-01-13", status: "confirmed" },
    { id: 4, name: "David Wilson", email: "david.wilson@example.com", registered: "2024-01-12", status: "waiting" },
    { id: 5, name: "Alex Johnson", email: "alex.johnson@example.com", registered: "2024-01-11", status: "confirmed" }
  ];

  const statistics = {
    registrationRate: 83,
    attendanceRate: 92,
    maleAttendees: 55,
    femaleAttendees: 45,
    topBatches: ["2015", "2012", "2018", "2010", "2020"]
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      archived: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      reunion: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      webinar: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      career: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      workshop: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
    };
    return styles[type as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const getAttendeeStatusBadge = (status: string) => {
    const styles = {
      confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      waiting: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/events")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Event Details</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage event and view analytics</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Event
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Settings className="h-4 w-4 mr-2" />
            Manage Event
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="attendees">Attendees</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Event Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Event Information</CardTitle>
                  <CardDescription>Basic event details and description</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className={getTypeBadge(event.type)}>
                      {event.type}
                    </Badge>
                    <Badge className={getStatusBadge(event.status)}>
                      {event.status}
                    </Badge>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{event.title}</h2>
                  <p className="text-gray-600 dark:text-gray-300">{event.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {new Date(event.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        {event.time} - {event.endTime}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        {event.location}
                      </div>
                      <div className="flex items-center text-sm">
                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                        {event.currentAttendees} / {event.maxAttendees} registered
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Registration Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Registration Progress</CardTitle>
                  <CardDescription>Current registration status and capacity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Registrations</span>
                    <span className="font-medium">
                      {event.currentAttendees} / {event.maxAttendees} ({Math.round((event.currentAttendees / event.maxAttendees) * 100)}%)
                    </span>
                  </div>
                  <Progress value={(event.currentAttendees / event.maxAttendees) * 100} className="h-2" />
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{event.currentAttendees}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Registered</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{event.maxAttendees - event.currentAttendees}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Available</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{event.maxAttendees}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Capacity</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Attendees Tab */}
            <TabsContent value="attendees">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Event Attendees</CardTitle>
                      <CardDescription>Registered participants and their status</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export List
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Attendee</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Registered</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendees.map((attendee) => (
                          <TableRow key={attendee.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={`/avatars/${attendee.name.toLowerCase().replace(' ', '-')}.jpg`} />
                                  <AvatarFallback>
                                    {attendee.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {attendee.name}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                              {attendee.email}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(attendee.registered).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge className={getAttendeeStatusBadge(attendee.status)}>
                                {attendee.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                <Mail className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Event Analytics</CardTitle>
                  <CardDescription>Registration and engagement metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card>
                      <CardContent className="p-6 text-center">
                        <BarChart3 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {statistics.registrationRate}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Registration Rate</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Users className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {statistics.attendanceRate}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Expected Attendance</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6 text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {statistics.maleAttendees}% / {statistics.femaleAttendees}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Gender Distribution</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Top Graduation Batches</h4>
                    <div className="space-y-2">
                      {statistics.topBatches.map((batch, index) => (
                        <div key={batch} className="flex items-center justify-between">
                          <span className="text-sm">Batch of {batch}</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {Math.round((1 - index * 0.2) * 20)} attendees
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Event Settings</CardTitle>
                  <CardDescription>Manage event configuration and permissions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Event Details</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>Organizer</span>
                          <span className="font-medium">{event.organizer}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Contact Email</span>
                          <span className="font-medium">{event.organizerEmail}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Created</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {new Date(event.created).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Updated</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {new Date(event.updated).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h4>
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full justify-start">
                          Send Reminder Email
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          Generate Check-in QR
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          Duplicate Event
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h4>
                    <div className="space-y-3">
                      <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                        Cancel Event
                      </Button>
                      <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                        Delete Event
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Event Status */}
          <Card>
            <CardHeader>
              <CardTitle>Event Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status</span>
                <Badge className={getStatusBadge(event.status)}>
                  {event.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Type</span>
                <Badge className={getTypeBadge(event.type)}>
                  {event.type}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Capacity</span>
                <span className="text-sm font-medium">
                  {event.currentAttendees}/{event.maxAttendees}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Days Until Event</span>
                <span className="text-sm font-medium">
                  {Math.ceil((new Date(event.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Organizer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Organizer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>AR</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{event.organizer}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{event.organizerEmail}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Contact Organizer
              </Button>
            </CardContent>
          </Card>

          {/* Admin Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Edit className="h-4 w-4 mr-2" />
                Edit Details
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Email Attendees
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Reports
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}