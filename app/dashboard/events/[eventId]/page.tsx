"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, MapPin, Users, Share2, Bookmark, ArrowLeft } from "lucide-react";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isRegistered, setIsRegistered] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Mock event data - in real app, fetch based on eventId
  const event = {
    id: params.eventId,
    title: "Annual Alumni Reunion 2024",
    description: "Join us for the biggest alumni gathering of the year! This event brings together graduates from all batches for an evening of networking, reminiscing, and building new connections.",
    longDescription: `
      <p>The Annual Alumni Reunion is our flagship event that celebrates the spirit of our alumni community. This year, we're excited to host the event at the newly renovated University Main Campus.</p>
      
      <p><strong>Highlights include:</strong></p>
      <ul>
        <li>Keynote speech by Dr. Sarah Chen, Class of '95, renowned industry leader</li>
        <li>Batch-wise networking sessions</li>
        <li>Campus tour showcasing new developments</li>
        <li>Gala dinner with live music</li>
        <li>Awards ceremony for outstanding alumni</li>
      </ul>
      
      <p>This is a perfect opportunity to reconnect with old friends, meet new alumni, and strengthen your professional network while supporting your alma mater.</p>
    `,
    date: "2024-06-15",
    time: "18:00",
    endTime: "22:00",
    location: "University Main Campus, Grand Ballroom",
    address: "123 University Avenue, City, State 12345",
    type: "reunion",
    category: "social",
    attendees: 250,
    maxAttendees: 300,
    image: "/events/reunion.jpg",
    status: "upcoming",
    organizer: {
      name: "Alumni Relations Office",
      email: "alumni@university.edu",
      phone: "+1 (555) 123-4567"
    },
    speakers: [
      {
        id: "1",
        name: "Dr. Sarah Chen",
        role: "CEO at TechInnovate",
        batch: "1995",
        image: "/speakers/sarah-chen.jpg"
      },
      {
        id: "2",
        name: "Michael Rodriguez",
        role: "Partner at Global Ventures",
        batch: "2005",
        image: "/speakers/michael-rodriguez.jpg"
      }
    ],
    agenda: [
      { time: "18:00 - 18:30", activity: "Registration & Welcome Reception" },
      { time: "18:30 - 19:15", activity: "Keynote Speech: Future of Technology" },
      { time: "19:15 - 20:30", activity: "Networking Session & Campus Tour" },
      { time: "20:30 - 22:00", activity: "Gala Dinner & Awards Ceremony" }
    ]
  };

  const handleRegister = () => {
    setIsRegistered(true);
    // In real app, make API call to register
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{event.title}</h1>
            <p className="text-gray-600 dark:text-gray-400">Event details and registration</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={handleBookmark}>
            <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
          </Button>
          <Button variant="outline" size="icon">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Image & Basic Info */}
          <Card>
            <CardContent className="p-0">
              <div className="h-64 bg-gradient-to-r from-purple-400 to-indigo-600 rounded-t-lg"></div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="default">{event.type}</Badge>
                  <Badge variant="secondary">{event.category}</Badge>
                  <Badge variant={event.status === "upcoming" ? "default" : "secondary"}>
                    {event.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    {event.location}
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-300">{event.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Description */}
          <Card>
            <CardHeader>
              <CardTitle>About This Event</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose prose-gray dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: event.longDescription }}
              />
            </CardContent>
          </Card>

          {/* Agenda */}
          <Card>
            <CardHeader>
              <CardTitle>Event Agenda</CardTitle>
              <CardDescription>Schedule of activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {event.agenda.map((item, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-24 flex-shrink-0 text-sm font-medium text-gray-900 dark:text-white">
                      {item.time}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white">{item.activity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Speakers */}
          <Card>
            <CardHeader>
              <CardTitle>Featured Speakers</CardTitle>
              <CardDescription>Meet our distinguished alumni speakers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {event.speakers.map((speaker) => (
                  <div key={speaker.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={speaker.image} />
                      <AvatarFallback>{speaker.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{speaker.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{speaker.role}</p>
                      <p className="text-xs text-gray-500">Batch of {speaker.batch}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Registration Card */}
          <Card>
            <CardHeader>
              <CardTitle>Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Attendees</span>
                <span className="font-semibold">
                  {event.attendees} / {event.maxAttendees}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${(event.attendees / event.maxAttendees) * 100}%` }}
                ></div>
              </div>
              
              {isRegistered ? (
                <div className="text-center space-y-3">
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    Registered
                  </Badge>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You're registered for this event. We'll send you a confirmation email with details.
                  </p>
                  <Button variant="outline" className="w-full">
                    Add to Calendar
                  </Button>
                </div>
              ) : (
                <Button 
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  onClick={handleRegister}
                  disabled={event.attendees >= event.maxAttendees}
                >
                  {event.attendees >= event.maxAttendees ? "Event Full" : "Register Now"}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Organizer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Organizer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">{event.organizer.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{event.organizer.email}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{event.organizer.phone}</p>
              </div>
              <Button variant="outline" className="w-full">
                Contact Organizer
              </Button>
            </CardContent>
          </Card>

          {/* Location Map */}
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{event.address}</p>
              <Button variant="outline" className="w-full mt-3">
                Get Directions
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}