// app/page.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  GraduationCap, 
  Users, 
  Calendar, 
  Briefcase, 
  HeartHandshake, 
  ArrowRight, 
  MapPin, 
  Trophy,
  BookOpen,
  Shield,
  Globe,
  Mail,
  Phone,
  ExternalLink,
  Star,
  CheckCircle,
  Play,
  Pause,
  Volume2,
  VolumeX
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function HomePage() {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Stats animation
  const [counters, setCounters] = useState(statistics.map(() => 0));
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const step = duration / steps;
    
    statistics.forEach((stat, index) => {
      let start = 0;
      const end = parseInt(stat.value.replace(/[^0-9]/g, ''));
      const increment = Math.ceil(end / steps);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          start = end;
          clearInterval(timer);
        }
        setCounters(prev => {
          const newCounters = [...prev];
          newCounters[index] = start;
          return newCounters;
        });
      }, step);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <GraduationCap className="h-8 w-8 text-indigo-600 transition-transform group-hover:scale-110" />
                <div className="absolute -inset-1 bg-indigo-100 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">AlumniConnect</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 font-medium relative group"
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full" />
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-3">
              <Link href="/auth/login">
                <Button variant="ghost" className="font-medium">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-indigo-600 hover:bg-indigo-700 font-medium shadow-lg shadow-indigo-500/25">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Video Background */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full">
          <div className={`absolute inset-0 bg-gradient-to-br from-indigo-900/60 to-purple-900/40 z-10 transition-opacity duration-1000 ${isVideoLoaded ? 'opacity-100' : 'opacity-0'}`} />
          <video
            ref={videoRef}
            autoPlay
            muted={isMuted}
            loop
            playsInline
            preload="metadata"
            onLoadedData={() => setIsVideoLoaded(true)}
            className="w-full h-full object-cover scale-105"
            poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiM0ZjU2NmQiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5BbHVtbmlDb25uZWN0IEhlcm8gVmlkZW88L3RleHQ+PC9zdmc+"
          >
            <source src="/videos/alumni-hero.mp4" type="video/mp4" />
            <source src="/videos/alumni-hero.webm" type="video/webm" />
          </video>
        </div>

        {/* Video Controls */}
        <div className="absolute bottom-8 right-8 z-30 flex items-center space-x-3 bg-black/50 rounded-full px-4 py-2 backdrop-blur-sm">
          <button
            onClick={togglePlay}
            className="text-white hover:text-indigo-200 transition-colors"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <button
            onClick={toggleMute}
            className="text-white hover:text-indigo-200 transition-colors"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        </div>

        {/* Hero Content */}
        <div className="relative z-20 text-center text-white px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className={`transition-all duration-1000 delay-300 ${isVideoLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Trust Badge */}
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8 border border-white/20">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm font-medium">Rated 4.9/5 by 2,000+ Alumni</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent">
                Where Connections
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Become Opportunities
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-4xl mx-auto leading-relaxed font-light">
              Join thousands of alumni reconnecting, growing careers, mentoring students, 
              and creating lasting impact across generations and industries worldwide.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/auth/register">
                <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold text-lg px-8 py-6 rounded-2xl shadow-2xl shadow-black/25 transition-all duration-300 hover:scale-105">
                  Start Your Journey Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/20 font-semibold text-lg px-8 py-6 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </Link>
            </div>

            {/* Social Proof */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Free forever for alumni</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Setup in 2 minutes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <div className="animate-bounce">
            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/70 rounded-full mt-2" />
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section id="statistics" className="py-20 bg-white dark:bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-gray-100 dark:bg-grid-gray-800 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by Alumni Worldwide
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Join a vibrant network of professionals making a difference across the globe
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {statistics.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="text-3xl md:text-5xl font-bold text-indigo-600 dark:text-indigo-400 mb-2 transition-all duration-500 group-hover:scale-110">
                  {counters[index]}+
                </div>
                <div className="text-gray-600 dark:text-gray-300 font-medium">
                  {stat.label}
                </div>
                <div className="w-0 group-hover:w-16 h-0.5 bg-indigo-600 mx-auto mt-3 transition-all duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50 dark:bg-gray-800 relative">
        <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-white dark:from-gray-900 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Star className="h-4 w-4" />
              <span>Everything You Need</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Designed for Lifelong Connections
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Powerful tools and features designed to strengthen your alumni connections
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white dark:bg-gray-900 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                <CardContent className="p-8 relative">
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-center text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-white/10 to-transparent" />
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Reconnect?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join thousands of alumni who are already building stronger connections, 
            advancing their careers, and making a difference in their communities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold text-lg px-8 py-6 rounded-2xl shadow-2xl shadow-black/25 transition-all duration-300 hover:scale-105">
                Create Your Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/20 font-semibold text-lg px-8 py-6 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105">
                <Play className="mr-2 h-5 w-5" />
                Watch Platform Tour
              </Button>
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-indigo-200 text-sm">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Enterprise-grade security</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>50,000+ alumni network</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Free forever</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

// Footer Component
function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <GraduationCap className="h-8 w-8 text-indigo-400" />
              <span className="text-2xl font-bold">AlumniConnect</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
              Connecting graduates, building futures since 2020. Empowering alumni communities worldwide with cutting-edge technology and meaningful connections.
            </p>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                {['Twitter', 'LinkedIn', 'Facebook', 'Instagram'].map((social) => (
                  <button
                    key={social}
                    className="w-10 h-10 bg-gray-800 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-colors duration-300"
                  >
                    <span className="text-sm font-medium">{social[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-lg mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href} 
                      className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center group"
                    >
                      {link.name}
                      {link.external && <ExternalLink className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            &copy; 2024 AlumniConnect. All rights reserved. Built with ❤️ for alumni communities worldwide.
          </p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
              Terms of Service
            </Link>
            <Link href="/cookies" className="text-gray-400 hover:text-white text-sm transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Data
const navItems = [
  { name: 'Features', href: '#features' },
  { name: 'Success Stories', href: '#success-stories' },
  { name: 'Events', href: '#events' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'About', href: '/about' },
];

const statistics = [
  { value: "50K+", label: "Active Members" },
  { value: "120+", label: "Countries" },
  { value: "15K+", label: "Mentorship Matches" },
  { value: "2K+", label: "Success Stories" }
];

const features = [
  {
    icon: Users,
    title: "Global Networking",
    description: "Connect with alumni across different batches, industries, and locations worldwide.",
    benefits: [
      "Advanced search filters",
      "Industry-specific groups",
      "Direct messaging",
      "Professional profiles"
    ]
  },
  {
    icon: Briefcase,
    title: "Career Growth",
    description: "Access exclusive job opportunities, internships, and career development resources.",
    benefits: [
      "Curated job board",
      "Resume review services",
      "Interview preparation",
      "Career counseling"
    ]
  },
  {
    icon: Calendar,
    title: "Events & Reunions",
    description: "Stay updated with alumni events, webinars, workshops, and batch reunions.",
    benefits: [
      "Virtual and in-person events",
      "Automated reminders",
      "Event recordings",
      "Networking sessions"
    ]
  }
];

const footerSections = [
  {
    title: "Platform",
    links: [
      { name: "Features", href: "#features" },
      { name: "Success Stories", href: "#success-stories" },
      { name: "Events", href: "#events" },
      { name: "Pricing", href: "/pricing" },
      { name: "Demo", href: "/demo", external: true }
    ]
  },
  {
    title: "Resources",
    links: [
      { name: "Help Center", href: "/help" },
      { name: "Community", href: "/community" },
      { name: "Blog", href: "/blog" },
      { name: "Webinars", href: "/webinars" },
      { name: "Documentation", href: "/docs", external: true }
    ]
  },
  {
    title: "Company",
    links: [
      { name: "About Us", href: "/about" },
      { name: "Careers", href: "/careers" },
      { name: "Contact", href: "/contact" },
      { name: "Partners", href: "/partners" },
      { name: "Press Kit", href: "/press" }
    ]
  }
];