"use client";

import { useState } from "react";
import Navbar from "@/components/ui/navbar";
import {
  CalendarDays,
  Briefcase,
  HeartHandshake,
  Users,
  Mail,
  Bell,
  User,
  ChevronRight,
  MessageCircle,
  Star,
  Search,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { GlassPanel, GradientText, Glow } from "@/components/ui/aceternity-wrappers";
import { useTheme } from "next-themes";

const news = [
  {
    title: "Alumni Connect Day 2024 Recap!",
    date: "October 26, 2024",
    image: "/news1.jpg",
    link: "#",
    summary: "A record turnout and inspiring keynotes marked this year’s event.",
  },
  {
    title: "New Alumni Grant Program Launched",
    date: "November 10, 2024",
    image: "/news2.jpg",
    link: "#",
    summary: "Apply now for funding to support your next big idea.",
  },
  {
    title: "Career Development Workshops for Alumni",
    date: "November 15, 2024",
    image: "/news3.jpg",
    link: "#",
    summary: "Sharpen your skills with our new series of expert-led workshops.",
  },
];

const alumniUpdates = [
  {
    user: "Alice N.",
    profile: "#",
    time: "2 hours ago",
    text: "Excited to announce my promotion to Senior Software Engineer at TechCorp! Huge thanks to the alumni network for the support. #careers #alumnisuccess",
    image: "/update1.jpg",
    likes: 12,
    comments: 5,
  },
  {
    user: "Bob M.",
    profile: "#",
    time: "1 day ago",
    text: "Just wrapped up a fantastic project in sustainable architecture. Always grateful for the foundation laid during my university years.",
    image: "/update2.jpg",
    likes: 28,
    comments: 11,
  },
];

const events = [
  {
    title: "Annual Alumni Networking Mixer",
    date: "Dec 5, 2024 • 6:00 PM - 9:00 PM",
    location: "University Grand Hall",
    image: "/event1.jpg",
    cta: "RSVP Now",
    link: "#",
    primary: true,
    description: "Meet, mingle, and grow your network with fellow alumni.",
  },
  {
    title: "Career Insights Webinar: Future-Proofing Your Skills",
    date: "Dec 15, 2024 • 10:00 AM - 11:30 AM",
    location: "Online Event",
    image: "/event2.jpg",
    cta: "Learn More",
    link: "#",
    description: "Join industry leaders for a live Q&A and actionable advice.",
  },
];

const stats = [
  {
    label: "Connections",
    value: "1,245",
    icon: Users,
    change: "+5.2%",
    changeType: "up",
  },
  {
    label: "Events Attended",
    value: "18",
    icon: CalendarDays,
    change: "+2",
    changeType: "up",
  },
  {
    label: "Unread Messages",
    value: "7",
    icon: MessageCircle,
    change: "-1",
    changeType: "down",
  },
];

export default function AlumniDashboard() {
  const [search, setSearch] = useState("");
  const [rsvp, setRsvp] = useState([false, false]);
  const { theme, setTheme } = useTheme();

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 transition-colors duration-500">
        <Navbar
          navigation={[
            { name: "Dashboard", href: "#dashboard", current: true },
            { name: "Events", href: "#events" },
            { name: "Job Board", href: "#jobs" },
            { name: "Mentorship", href: "#mentorship" },
            { name: "Messaging", href: "#messaging" },
            { name: "Directory", href: "#directory" },
            { name: "Profile", href: "#profile" },
          ]}
         
        />

        {/* Main Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto py-8 px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Welcome Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                  <GradientText>Welcome Back,</GradientText>{" "}
                  <span className="text-indigo-600 dark:text-indigo-400">Alumni!</span>
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-md">
                  Stay connected, grow your network, and unlock exclusive opportunities.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {stats.map(({ label, value, icon: Icon, change, changeType }) => (
                  <GlassPanel
                    key={label}
                    className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm shadow-lg border border-white/40 dark:border-gray-800/40 hover:scale-105 transition-transform duration-300"
                  >
                    <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-lg font-bold text-indigo-800 dark:text-indigo-300">{value}</span>
                    <span className={`text-xs font-medium ${changeType === "up" ? "text-green-600" : "text-red-600"}`}>
                      {change}
                    </span>
                  </GlassPanel>
                ))}
              </div>
            </div>

            {/* News & Announcements */}
            <GlassPanel className="p-6 overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-500">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Mail className="h-5 w-5 text-indigo-600" />
                  News & Announcements
                </h2>
                <a
                  href="#"
                  className="text-indigo-600 text-sm font-medium hover:text-indigo-800 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
                >
                  View All <ChevronRight className="h-4 w-4" />
                </a>
              </div>
              <ul className="space-y-4">
                {news.map((item, i) => (
                  <li
                    key={item.title}
                    className="group flex items-start gap-4 p-4 rounded-xl bg-white/50 dark:bg-gray-900/50 hover:bg-white/70 dark:hover:bg-gray-900/70 transition-all duration-300 border border-gray-100 dark:border-gray-800/50"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-16 w-16 rounded-xl object-cover shadow-md group-hover:shadow-lg transition-shadow"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.date}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{item.summary}</p>
                      <a
                        href={item.link}
                        className="inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline gap-1 group-hover:text-indigo-800 dark:group-hover:text-indigo-300 transition-colors"
                      >
                        Read More <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </GlassPanel>

            {/* Alumni Updates (with Flip Effect) */}
            <GlassPanel className="p-6 shadow-xl hover:shadow-2xl transition-shadow duration-500">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Alumni Updates
                </h2>
                <a
                  href="#"
                  className="text-indigo-600 text-sm font-medium hover:text-indigo-800 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
                >
                  View All <ChevronRight className="h-4 w-4" />
                </a>
              </div>
              <div className="space-y-6">
                {alumniUpdates.map((post, i) => (
                  <div
                    key={i}
                    className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border border-gray-100 dark:border-gray-800/40"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={`/avatar${i + 1}.jpg`}
                          alt={post.user}
                          className="h-10 w-10 rounded-full object-cover border-2 border-indigo-100 dark:border-indigo-900/50 shadow-sm"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{post.user}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{post.time}</p>
                        </div>
                      </div>
                      <a
                        href={post.profile}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        View Profile
                      </a>
                    </div>
                    <p className="text-gray-700 dark:text-gray-200 mb-4 leading-relaxed">{post.text}</p>
                    <img
                      src={post.image}
                      alt="Update"
                      className="w-full h-40 object-cover rounded-xl mb-4 shadow-md hover:shadow-lg transition-shadow"
                    />
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span>{post.likes}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        <span>{post.comments}</span>
                      </div>
                      <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                        Share
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>

            {/* Upcoming Events */}
            <GlassPanel className="p-6 shadow-xl hover:shadow-2xl transition-shadow duration-500">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-indigo-600" />
                  Upcoming Events
                </h2>
                <a
                  href="#"
                  className="text-indigo-600 text-sm font-medium hover:text-indigo-800 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
                >
                  View All <ChevronRight className="h-4 w-4" />
                </a>
              </div>
              <div className="space-y-5">
                {events.map((event, i) => (
                  <div
                    key={event.title}
                    className="flex flex-col sm:flex-row gap-4 p-5 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border border-gray-100 dark:border-gray-800/40"
                  >
                    <div className="flex-shrink-0 relative">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="h-32 w-40 rounded-2xl object-cover shadow-md hover:shadow-xl transition-shadow"
                      />
                      {event.primary && (
                        <Badge className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                          Featured
                        </Badge>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1">{event.title}</h3>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{event.date}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.location}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{event.description}</p>
                      <Button
                        size="sm"
                        className={`w-full sm:w-auto transition-all duration-300 ${event.primary
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105"
                            : "bg-gray-100 text-indigo-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-indigo-300 dark:hover:bg-gray-700"
                          }`}
                        onClick={() =>
                          setRsvp((prev) => prev.map((v, idx) => (idx === i ? !v : v)))
                        }
                      >
                        {rsvp[i] ? (
                          <>
                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            RSVP'd
                          </>
                        ) : (
                          event.cta
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Dashboard Stats (Enhanced) */}
            <GlassPanel className="p-6 text-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 shadow-xl border border-indigo-100 dark:border-indigo-900/30">
              <div className="text-xs font-medium text-indigo-600 dark:text-indigo-300 mb-3">Your Dashboard</div>
              <div className="flex flex-col items-center justify-center gap-6">
                <div className="text-4xl font-bold text-indigo-800 dark:text-indigo-300">1,245</div>
                <div className="text-sm text-indigo-600 dark:text-indigo-400">Active Connections</div>
                <div className="h-px w-16 bg-gradient-to-r from-transparent via-indigo-300 to-transparent"></div>
                <div className="text-2xl font-bold text-indigo-800 dark:text-indigo-300">18</div>
                <div className="text-sm text-indigo-600 dark:text-indigo-400">Events Attended</div>
              </div>
              <div className="mt-6 text-xs text-indigo-500 dark:text-indigo-400">
                You're in the top 15% of engaged alumni!
              </div>
            </GlassPanel>

            {/* Alumni Spotlight (Enhanced with Glow) */}
            <GlassPanel className="p-6 text-center bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 shadow-xl border border-pink-100 dark:border-pink-900/30">
              <div className="text-xs font-medium text-pink-600 dark:text-pink-300 mb-3">Featured Alumni Spotlight</div>
              <div className="relative">
                <img
                  src="/avatar3.jpg"
                  alt="Sarah Miller"
                  className="h-20 w-20 rounded-full mx-auto mb-3 object-cover border-4 border-pink-200 dark:border-pink-800 shadow-lg"
                />
                <Glow className="absolute -inset-1 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full blur-xl opacity-30" />
              </div>
              <h3 className="font-bold text-gray-800 dark:text-white">Sarah Miller '08</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Founder & CEO, InnovateTech Solutions</p>
              <Button
                size="sm"
                className="bg-gradient-to-r from-pink-600 to-rose-600 text-white w-full hover:from-pink-700 hover:to-rose-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                View Profile
              </Button>
            </GlassPanel>

            {/* Quick Action Card */}
            <GlassPanel className="p-6 text-center bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 shadow-xl border border-blue-100 dark:border-blue-900/30">
              <div className="text-xs font-medium text-blue-600 dark:text-blue-300 mb-3">Quick Actions</div>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                >
                  <Briefcase className="h-4 w-4" />
                  Browse Job Board
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                >
                  <HeartHandshake className="h-4 w-4" />
                  Find a Mentor
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                >
                  <Mail className="h-4 w-4" />
                  Send a Message
                </Button>
              </div>
            </GlassPanel>

            {/* Newsletter CTA */}
            <GlassPanel className="p-6 text-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-3">Stay Updated</div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                Subscribe to our monthly newsletter for exclusive updates.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
                <Button size="sm" className="px-4 bg-indigo-600 hover:bg-indigo-700">
                  Subscribe
                </Button>
              </div>
            </GlassPanel>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white/80 dark:bg-gray-900/80 border-t border-gray-200 dark:border-gray-800 py-6 px-8 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 dark:text-gray-400 gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Quick Links</a>
            <span>•</span>
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Support</a>
            <span>•</span>
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy</a>
            <span>•</span>
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms</a>
          </div>
          <div className="flex items-center gap-4">
            <span>© 2024 Alumni Network. All rights reserved.</span>
            <div className="flex gap-2">
              <a href="#" aria-label="Twitter" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557a9.93 9.93 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.564-2.005.974-3.127 1.195A4.92 4.92 0 0 0 16.616 3c-2.73 0-4.942 2.21-4.942 4.936 0 .386.045.762.127 1.124C7.728 8.816 4.1 6.884 1.671 3.965c-.423.722-.666 1.561-.666 2.475 0 1.708.87 3.216 2.188 4.099a4.904 4.904 0 0 1-2.237-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 0 1-2.224.084c.627 1.956 2.444 3.377 4.6 3.417A9.867 9.867 0 0 1 0 21.543a13.94 13.94 0 0 0 7.548 2.209c9.057 0 14.009-7.496 14.009-13.986 0-.213-.005-.425-.014-.636A10.012 10.012 0 0 0 24 4.557z" />
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm13.5 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 1.379-1.563 2.841-1.563 3.039 0 3.6 2.001 3.6 4.601v5.595z" />
                </svg>
              </a>
            </div>
          </div>
        </footer>

        {/* Custom Scrollbar (for dark mode) */}
        <style jsx>{`
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.3);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.5);
        }
        .dark ::-webkit-scrollbar-thumb {
          background: rgba(107, 114, 128, 0.4);
        }
        .dark ::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.6);
        }
      `}</style>
      </div></>
  );
}