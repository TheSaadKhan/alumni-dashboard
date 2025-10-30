"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users, ArrowRight, Plus } from "lucide-react";

export default function EventsPage() {
  const [filter, setFilter] = useState("all");

  const events = [
    {
      id: "1",
      title: "Annual Alumni Reunion 2024",
      description: "Join us for the biggest alumni gathering of the year with special guest speakers and networking sessions.",
      date: "2024-06-15",
      time: "18:00",
      location: "University Main Campus",
      type: "reunion",
      attendees: 250,
      maxAttendees: 300,
      image: "/events/reunion.jpg",
      status: "upcoming"
    },
    {
      id: "2",
      title: "Tech Industry Insights",
      description: "Panel discussion with alumni leaders in technology sector sharing career insights and trends.",
      date: "2024-05-20",
      time: "14:00",
      location: "Virtual Event",
      type: "webinar",
      attendees: 89,
      maxAttendees: 200,
      image: "/events/tech-panel.jpg",
      status: "upcoming"
    },
    {
      id: "3",
      title: "Career Fair 2024",
      description: "Connect with top employers and explore job opportunities across various industries.",
      date: "2024-04-10",
      time: "10:00",
      location: "University Convention Center",
      type: "career",
      attendees: 150,
      maxAttendees: 200,
      image: "/events/career-fair.jpg",
      status: "past"
    }
  ];

  const filteredEvents = events.filter(event => 
    filter === "all" || event.status === filter
  );

  const getEventTypeColor = (type: string) => {
    const colors = {
      reunion: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      webinar: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      career: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      workshop: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Events</h1>
          <p className="text-gray-600 dark:text-gray-400">Discover and join alumni events</p>
        </div>
        <Link href="/dashboard/events/create">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {["all", "upcoming", "past"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === tab
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <Card key={event.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start mb-2">
                <Badge className={getEventTypeColor(event.type)}>
                  {event.type}
                </Badge>
                <Badge variant={event.status === "upcoming" ? "default" : "secondary"}>
                  {event.status}
                </Badge>
              </div>
              <CardTitle className="text-lg">{event.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {event.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(event.date).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  {event.time}
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {event.location}
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  {event.attendees} / {event.maxAttendees} attending
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link href={`/dashboard/events/${event.id}`} className="w-full">
                <Button variant="outline" className="w-full">
                  View Details
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No events found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              There are no {filter === "all" ? "" : filter} events at the moment.
            </p>
            <Link href="/dashboard/events/create">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                Create First Event
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}