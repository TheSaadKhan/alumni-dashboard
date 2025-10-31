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
  ArrowRight,
  Star,
  CheckCircle,
  Play,
  Shield
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function HomePage() {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle scroll for navbar glass effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle video load
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setIsVideoLoaded(true);
      setVideoError(false);
    };

    const handleError = () => {
      setVideoError(true);
      setIsVideoLoaded(false);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.preload = "metadata";

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
    };
  }, []);

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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  const fadeInUp = {
    initial: { y: 60, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Enhanced Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled
            ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg'
            : 'bg-transparent border-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/" className="flex items-center space-x-2 group">
                <div className="relative">
                  <GraduationCap className={`h-6 w-6 sm:h-8 sm:w-8 transition-colors ${isScrolled ? 'text-indigo-600' : 'text-white'
                    }`} />
                  <div className="absolute -inset-1 bg-indigo-100 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className={`text-lg sm:text-xl font-bold transition-colors ${isScrolled ? 'text-gray-900 dark:text-white' : 'text-white'
                  }`}>
                  AlumniConnect
                </span>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    className={`transition-all duration-300 font-medium relative group text-sm lg:text-base ${isScrolled
                        ? 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                        : 'text-white/90 hover:text-white'
                      }`}
                  >
                    {item.name}
                    <span className={`absolute -bottom-1 left-0 w-0 h-0.5 transition-all group-hover:w-full ${isScrolled ? 'bg-indigo-600' : 'bg-white'
                      }`} />
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Link href="/auth/login">
                <Button
                  variant={"ghost"}
                  size="sm"
                  className={`font-medium text-xs sm:text-sm ${isScrolled
                      ? 'border-white text-gray-700 dark:text-gray-300'
                      : 'border-white text-white hover:bg-white/20  border-2'
                    }`}
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button
                  size="sm"
                  className={`font-medium shadow-lg text-xs sm:text-sm ${isScrolled
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-white text-indigo-600 hover:bg-gray-100'
                    }`}
                >
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <div className={`w-6 h-6 flex flex-col justify-center space-y-1 ${isScrolled ? 'text-gray-900' : 'text-white'
                }`}>
                <span className={`block h-0.5 w-6 transition-all ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''
                  } ${isScrolled ? 'bg-gray-900' : 'bg-white'}`} />
                <span className={`block h-0.5 w-6 transition-all ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
                  } ${isScrolled ? 'bg-gray-900' : 'bg-white'}`} />
                <span className={`block h-0.5 w-6 transition-all ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
                  } ${isScrolled ? 'bg-gray-900' : 'bg-white'}`} />
              </div>
            </motion.button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden border-t border-gray-200 dark:border-gray-700"
              >
                <div className="py-4 space-y-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <div className="pt-4 space-y-3 border-t border-gray-200 dark:border-gray-700">
                    <Link href="/auth/login" className="block w-full">
                      <Button variant="outline" className="w-full justify-center">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/register" className="block w-full">
                      <Button className="w-full justify-center bg-indigo-600 hover:bg-indigo-700">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Hero Section with Video Background */}
      <section id="hero-section" className="relative h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full">
          <div className={`absolute inset-0 bg-gradient-to-br from-indigo-900/60 to-purple-900/40 z-10 transition-opacity duration-1000 ${isVideoLoaded ? 'opacity-100' : 'opacity-0'
            }`} />

          {videoError && (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 z-0" />
          )}

          <motion.video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="w-full h-full object-cover scale-105"
            poster="/images/hero-poster.jpg"
          >
            <source src="https://kjqrtnkgenvqnpugefdx.supabase.co/storage/v1/object/public/Assets/hero-bg.mp4" type="video/mp4" />
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <p className="text-white text-lg">Your browser does not support the video tag.</p>
            </div>
          </motion.video>
        </div>

        {/* Loading State */}
        {!isVideoLoaded && !videoError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 z-20 flex items-center justify-center"
          >
            <div className="text-center text-white">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full mx-auto mb-3"
              />
              <p className="text-base">Loading...</p>
            </div>
          </motion.div>
        )}

        {/* Hero Content */}
        <div className="relative z-20 text-center text-white px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isVideoLoaded ? "visible" : "hidden"}
            className="space-y-6 sm:space-y-8"
          >
            {/* Trust Badge */}
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center space-x-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20"
            >
              <div className="flex items-center space-x-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-xs font-medium">Rated 4.9/5 by 2,000+ Alumni</span>
            </motion.div>

            {/* Main Heading */}
            <motion.div variants={itemVariants}>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
                <span className="bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent">
                  Where Connections
                </span>
                <br />
                <span className="bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                  Become Opportunities
                </span>
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p variants={itemVariants} className="text-base sm:text-lg md:text-xl text-gray-200 max-w-2xl mx-auto leading-relaxed font-light">
              Join thousands of alumni reconnecting, growing careers, mentoring students,
              and creating lasting impact across generations and industries worldwide.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link href="/auth/register">
                <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-5 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl shadow-black/25 transition-all duration-300 hover:scale-105">
                  Start Your Journey Free
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="ghost" className="border-2 border-white  hover:bg-white/20 font-semibold text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-5 rounded-xl sm:rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105">
                  <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Watch Demo
                </Button>
              </Link>
            </motion.div>

            {/* Social Proof */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-6 text-xs sm:text-sm text-gray-300">
              <div className="flex items-center space-x-1.5">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                <span>Free forever for alumni</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                <span>Setup in 2 minutes</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-20"
        >
          <div className="w-5 h-8 sm:w-6 sm:h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-2 sm:h-3 bg-white/70 rounded-full mt-1.5 sm:mt-2" />
          </div>
        </motion.div>
      </section>
      {/* Statistics Section */}
      <section id="statistics" className="py-20 bg-white dark:bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-gray-100 dark:bg-grid-gray-800 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by Alumni Worldwide
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Join a vibrant network of professionals making a difference across the globe
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {statistics.map((stat, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="text-center group p-6"
              >
                <motion.div
                  className="text-5xl font-bold text-indigo-600 dark:text-indigo-400 mb-2"
                >
                  {counters[index]}+
                </motion.div>
                <div className="text-gray-600 dark:text-gray-300 font-medium">
                  {stat.label}
                </div>
                <motion.div
                  className="w-0 group-hover:w-16 h-0.5 bg-indigo-600 mx-auto mt-3"
                  whileHover={{ width: 64 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50 dark:bg-gray-800 relative">
        <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-white dark:from-gray-900 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center space-x-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-full text-sm font-medium mb-4"
            >
              <Star className="h-4 w-4" />
              <span>Everything You Need</span>
            </motion.div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Designed for Lifelong Connections
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Powerful tools and features designed to strengthen your alumni connections
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -5 }}
              >
                <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white dark:bg-gray-900 overflow-hidden h-full">
                  <motion.div
                    className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
                    whileHover={{ scaleX: 1 }}
                  />
                  <CardContent className="p-8 relative h-full flex flex-col">
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                        <ArrowRight className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                    </div>
                    <motion.div
                      className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <feature.icon className="h-7 w-7 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed flex-grow">
                      {feature.description}
                    </p>
                    <ul className="space-y-3">
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <motion.li
                          key={benefitIndex}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: benefitIndex * 0.1 }}
                          className="flex items-center text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors"
                        >
                          <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                          {benefit}
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-white/10 to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative"
        >
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Reconnect?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join thousands of alumni who are already building stronger connections,
            advancing their careers, and making a difference in their communities.
          </p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeInUp}>
              <Link href="/auth/register">
                <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold text-lg px-8 py-6 rounded-2xl shadow-2xl shadow-black/25 transition-all duration-300 hover:scale-105">
                  Create Your Free Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/20 font-semibold text-lg px-8 py-6 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Platform Tour
                </Button>
              </Link>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-indigo-200 text-sm"
          >
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
          </motion.div>
        </motion.div>
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
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8"
        >
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
                  <motion.button
                    key={social}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 bg-gray-800 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-colors duration-300"
                  >
                    <span className="text-sm font-medium">{social[0]}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {footerSections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="font-semibold text-lg mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center group text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          viewport={{ once: true }}
          className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center"
        >
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
        </motion.div>
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
      { name: "Demo", href: "/demo" }
    ]
  },
  {
    title: "Resources",
    links: [
      { name: "Help Center", href: "/help" },
      { name: "Community", href: "/community" },
      { name: "Blog", href: "/blog" },
      { name: "Webinars", href: "/webinars" },
      { name: "Documentation", href: "/docs" }
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