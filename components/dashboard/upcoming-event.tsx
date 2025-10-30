"use client";

import { useState } from "react";
import { ChevronRight, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const events = [
  {
    id: 1,
    title: "Alumni Networking Mixer",
    date: "Dec 5, 2024 • 6:00 PM",
    location: "University Grand Hall",
    attendees: 124,
    capacity: 200,
    type: "Networking",
    registered: true,
  },
  {
    id: 2,
    title: "Career Insights Webinar",
    date: "Dec 15, 2024 • 10:00 AM",
    location: "Online Event",
    attendees: 89,
    capacity: 500,
    type: "Webinar",
    registered: false,
  },
  {
    id: 3,
    title: "Industry Leaders Panel",
    date: "Jan 12, 2025 • 3:00 PM",
    location: "Business School Auditorium",
    attendees: 67,
    capacity: 300,
    type: "Panel",
    registered: false,
  },
];

export function UpcomingEvents() {
  const [activeEvents, setActiveEvents] = useState(events);

  const handleEventRSVP = (id: number) => {
    setActiveEvents(events =>
      events.map(event =>
        event.id === id
          ? { ...event, registered: !event.registered }
          : event
      )
    );
    const event = events.find(e => e.id === id);
    if (event) {
      alert(`Thank you for ${event.registered ? "cancelling your" : "registering for"} ${event.title}!`);
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-gray-900 dark:text-white">Upcoming Events</CardTitle>
          <CardDescription>Don't miss these opportunities</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            View All
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeEvents.map((event) => (
          <div 
            key={event.id} 
            className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 hover:shadow-sm"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={
                  event.type === "Networking" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300" :
                  event.type === "Webinar" ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300" :
                  "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
                }>
                  {event.type}
                </Badge>
                {event.registered && (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                    Registered
                  </Badge>
                )}
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{event.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{event.date}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">{event.location}</p>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>{event.attendees} attending</span>
                  <span>Capacity: {event.capacity}</span>
                </div>
                <Progress 
                  value={(event.attendees / event.capacity) * 100} 
                  className="h-2 bg-gray-200 dark:bg-gray-600"
                />
              </div>
            </div>
            <Button 
              size="sm" 
              variant={event.registered ? "outline" : "default"}
              onClick={() => handleEventRSVP(event.id)}
            >
              {event.registered ? "Cancel" : "RSVP"}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}