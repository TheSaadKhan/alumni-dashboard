"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Calendar, Users, MapPin, MoreVertical, Edit, Trash2 } from "lucide-react";

export default function AdminEventsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const events = [
    {
      id: "1",
      title: "Annual Alumni Reunion 2024",
      type: "reunion",
      status: "published",
      date: "2024-06-15",
      time: "18:00",
      location: "University Main Campus",
      attendees: 250,
      maxAttendees: 300,
      organizer: "Alumni Relations Office",
      created: "2024-01-10"
    },
    {
      id: "2",
      title: "Tech Industry Insights",
      type: "webinar",
      status: "published",
      date: "2024-05-20",
      time: "14:00",
      location: "Virtual Event",
      attendees: 89,
      maxAttendees: 200,
      organizer: "Tech Alumni Chapter",
      created: "2024-01-08"
    },
    {
      id: "3",
      title: "Career Fair 2024",
      type: "career",
      status: "draft",
      date: "2024-04-10",
      time: "10:00",
      location: "University Convention Center",
      attendees: 0,
      maxAttendees: 200,
      organizer: "Career Services",
      created: "2024-01-05"
    },
    {
      id: "4",
      title: "Mentorship Program Kickoff",
      type: "workshop",
      status: "published",
      date: "2024-03-15",
      time: "16:00",
      location: "Alumni Center",
      attendees: 45,
      maxAttendees: 50,
      organizer: "Mentorship Committee",
      created: "2024-01-03"
    },
    {
      id: "5",
      title: "Sports Alumni Tournament",
      type: "sports",
      status: "cancelled",
      date: "2024-02-20",
      time: "09:00",
      location: "University Stadium",
      attendees: 0,
      maxAttendees: 100,
      organizer: "Sports Department",
      created: "2023-12-15"
    }
  ];

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.organizer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
      workshop: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      sports: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    };
    return styles[type as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Event Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage all alumni events and activities</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Calendar className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">18</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Events</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Events</p>
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">1,247</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Registrations</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Draft Events</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
          <CardDescription>Manage and monitor all alumni events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search events by title or organizer..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex space-x-2">
              <select 
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="cancelled">Cancelled</option>
                <option value="archived">Archived</option>
              </select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {/* Events Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Attendees</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {event.title}
                        </div>
                        <div className="text-sm text-gray-500">by {event.organizer}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeBadge(event.type)}>
                        {event.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {new Date(event.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">{event.time}</div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-900 dark:text-white">
                      {event.location}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">
                          {event.attendees}/{event.maxAttendees}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                        <div 
                          className="bg-green-600 h-1 rounded-full" 
                          style={{ width: `${(event.attendees / event.maxAttendees) * 100}%` }}
                        ></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(event.status)}>
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No events found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? `No events matching "${searchTerm}"` : "No events available"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}