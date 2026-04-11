"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail, MessageCircle, Calendar, Briefcase, Users } from "lucide-react";

export default function NotificationSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notification Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage how you receive notifications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Control which emails you receive from AlumniConnect
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-newsletter" className="flex-1">
                Newsletter & Updates
                <p className="text-sm text-gray-500 font-normal">
                  Monthly newsletter and platform updates
                </p>
              </Label>
              <Switch id="email-newsletter" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-events" className="flex-1">
                Event Invitations
                <p className="text-sm text-gray-500 font-normal">
                  Invitations to alumni events and webinars
                </p>
              </Label>
              <Switch id="email-events" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-jobs" className="flex-1">
                Job Opportunities
                <p className="text-sm text-gray-500 font-normal">
                  New job postings matching your profile
                </p>
              </Label>
              <Switch id="email-jobs" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-messages" className="flex-1">
                Message Notifications
                <p className="text-sm text-gray-500 font-normal">
                  When you receive new messages
                </p>
              </Label>
              <Switch id="email-messages" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Push Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Push Notifications
            </CardTitle>
            <CardDescription>
              Browser and mobile push notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="push-messages" className="flex-1">
                New Messages
                <p className="text-sm text-gray-500 font-normal">
                  When you receive new messages
                </p>
              </Label>
              <Switch id="push-messages" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-connections" className="flex-1">
                Connection Requests
                <p className="text-sm text-gray-500 font-normal">
                  When someone wants to connect
                </p>
              </Label>
              <Switch id="push-connections" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-events" className="flex-1">
                Event Reminders
                <p className="text-sm text-gray-500 font-normal">
                  Reminders for upcoming events
                </p>
              </Label>
              <Switch id="push-events" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-announcements" className="flex-1">
                Important Announcements
                <p className="text-sm text-gray-500 font-normal">
                  Platform announcements and updates
                </p>
              </Label>
              <Switch id="push-announcements" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Activity Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Activity Notifications
            </CardTitle>
            <CardDescription>
              Notifications about network activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="activity-connections" className="flex-1">
                New Connections
                <p className="text-sm text-gray-500 font-normal">
                  When alumni join your network
                </p>
              </Label>
              <Switch id="activity-connections" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="activity-profile" className="flex-1">
                Profile Views
                <p className="text-sm text-gray-500 font-normal">
                  When someone views your profile
                </p>
              </Label>
              <Switch id="activity-profile" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="activity-updates" className="flex-1">
                Network Updates
                <p className="text-sm text-gray-500 font-normal">
                  Updates from your connections
                </p>
              </Label>
              <Switch id="activity-updates" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="activity-achievements" className="flex-1">
                Achievements & Milestones
                <p className="text-sm text-gray-500 font-normal">
                  When connections reach milestones
                </p>
              </Label>
              <Switch id="activity-achievements" />
            </div>
          </CardContent>
        </Card>

        {/* Category-specific Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Category Preferences</CardTitle>
            <CardDescription>
              Notifications by content category
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="category-events" className="flex-1">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                  Events & Meetups
                </div>
              </Label>
              <Switch id="category-events" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="category-jobs" className="flex-1">
                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-2 text-green-500" />
                  Jobs & Career
                </div>
              </Label>
              <Switch id="category-jobs" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="category-mentorship" className="flex-1">
                <div className="flex items-center">
                  <MessageCircle className="h-4 w-4 mr-2 text-purple-500" />
                  Mentorship
                </div>
              </Label>
              <Switch id="category-mentorship" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="category-fundraising" className="flex-1">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-orange-500" />
                  Fundraising & Impact
                </div>
              </Label>
              <Switch id="category-fundraising" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end space-x-3">
        <Button variant="outline">Reset to Defaults</Button>
        <Button className="bg-indigo-600 hover:bg-indigo-700">Save Changes</Button>
      </div>

      {/* Notification Frequency */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Frequency</CardTitle>
          <CardDescription>
            How often you receive notification digests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className={`border-2 cursor-pointer ${
              true ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" : "border-gray-200 dark:border-gray-700"
            }`}>
              <CardContent className="p-4 text-center">
                <h4 className="font-semibold text-gray-900 dark:text-white">Real-time</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Receive notifications immediately
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-gray-200 dark:border-gray-700 cursor-pointer">
              <CardContent className="p-4 text-center">
                <h4 className="font-semibold text-gray-900 dark:text-white">Daily Digest</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Once per day summary
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-gray-200 dark:border-gray-700 cursor-pointer">
              <CardContent className="p-4 text-center">
                <h4 className="font-semibold text-gray-900 dark:text-white">Weekly Digest</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Weekly summary email
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}