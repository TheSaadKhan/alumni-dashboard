"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle2, Clock, MessageCircle, Building2, Globe } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";

export default function ContactPage() {
  const { user, isLoaded } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  // Pre-fill form with user data if logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.fullName || `${user.firstName} ${user.lastName}`.trim() || "",
        email: user.primaryEmailAddress?.emailAddress || "",
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      // Send contact form to API
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setIsSuccess(true);
      toast.success("Message sent successfully!", {
        description: "We'll get back to you within 24-48 hours.",
      });
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSuccess(false);
        setFormData({
          name: user?.fullName || "",
          email: user?.primaryEmailAddress?.emailAddress || "",
          subject: "",
          message: "",
        });
      }, 3000);
    } catch (error: any) {
      console.error("Contact form error:", error);
      toast.error("Failed to send message", {
        description: error.message || "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-900 dark:to-purple-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-white/10 blur-[120px] rounded-full" />
          <div className="absolute -bottom-[20%] -left-[10%] w-[40%] h-[40%] bg-white/10 blur-[100px] rounded-full" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="text-center">
            <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight">
              Contact Us
            </h1>
            <p className="text-xl text-indigo-100 max-w-3xl mx-auto">
              Get in touch with our alumni relations team. We're here to help you connect, grow, and succeed.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-3xl rounded-2xl overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <MessageCircle className="h-6 w-6 text-indigo-600" />
                  Send us a Message
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isSuccess ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Message Sent!</h3>
                    <p className="text-muted-foreground">
                      Thank you for reaching out. Our team will respond to your inquiry within 24-48 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Full Name *
                        </label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="Enter your full name"
                          required
                          className="h-12 rounded-xl"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Email Address *
                        </label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="Enter your email"
                          required
                          className="h-12 rounded-xl"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Subject
                      </label>
                      <Input
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        placeholder="What is this regarding?"
                        className="h-12 rounded-xl"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Message *
                      </label>
                      <Textarea
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        placeholder="Tell us how we can help you..."
                        rows={6}
                        required
                        className="rounded-xl resize-none"
                        disabled={isSubmitting}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-12 rounded-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02]"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-3xl rounded-2xl overflow-hidden">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-indigo-600" />
                    Alumni Relations Office
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Mail className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Email</p>
                        <a href="mailto:alumni@alumniconnect.com" className="text-sm text-muted-foreground hover:text-indigo-600 transition-colors">
                          alumni@alumniconnect.com
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Phone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Phone</p>
                        <a href="tel:+15551234567" className="text-sm text-muted-foreground hover:text-emerald-600 transition-colors">
                          +1 (555) 123-4567
                        </a>
                        <p className="text-xs text-muted-foreground mt-1">Mon-Fri, 9am-5pm EST</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Address</p>
                        <p className="text-sm text-muted-foreground">
                          123 Alumni Plaza<br />
                          New York, NY 10001<br />
                          United States
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Response Time</p>
                      <p className="text-sm text-muted-foreground">Usually within 24-48 hours</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Links Card */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-3xl rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-indigo-600" />
                  Connect With Us
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="w-full rounded-xl" asChild>
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                      LinkedIn
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full rounded-xl" asChild>
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                      Twitter
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full rounded-xl" asChild>
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                      Facebook
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full rounded-xl" asChild>
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                      Instagram
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Link Card */}
            <Card className="border-0 shadow-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl overflow-hidden">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-bold mb-2">Frequently Asked Questions</h3>
                <p className="text-indigo-100 text-sm mb-4">
                  Find quick answers to common questions
                </p>
                <Button variant="secondary" className="rounded-xl font-semibold" asChild>
                  <Link href="/faq">View FAQ</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}