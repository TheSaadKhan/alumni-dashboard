"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Shield, User, Mail, Globe } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your account preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-2">
                {[
                  { id: "profile", label: "Profile", icon: User, active: true },
                  { id: "notifications", label: "Notifications", icon: Bell },
                  { id: "privacy", label: "Privacy & Security", icon: Shield },
                  { id: "communication", label: "Communication", icon: Mail },
                  { id: "preferences", label: "Preferences", icon: Globe }
                ].map((item) => (
                  <Button
                    key={item.id}
                    variant={item.active ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Update your personal information and visibility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="visibility">Profile Visibility</Label>
                  <Select defaultValue="alumni">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="alumni">Alumni Only</SelectItem>
                      <SelectItem value="connections">Connections Only</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="searchable">Searchable in Directory</Label>
                  <Select defaultValue="yes">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-email" className="flex-1">
                  Show Email to Other Alumni
                  <p className="text-sm text-gray-500 font-normal">
                    Allow other alumni to see your email address
                  </p>
                </Label>
                <Switch id="show-email" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-phone" className="flex-1">
                  Show Phone Number
                  <p className="text-sm text-gray-500 font-normal">
                    Allow connections to see your phone number
                  </p>
                </Label>
                <Switch id="show-phone" />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications" className="flex-1">
                  Email Notifications
                  <p className="text-sm text-gray-500 font-normal">
                    Receive updates via email
                  </p>
                </Label>
                <Switch id="email-notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications" className="flex-1">
                  Push Notifications
                  <p className="text-sm text-gray-500 font-normal">
                    Receive browser notifications
                  </p>
                </Label>
                <Switch id="push-notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="event-reminders" className="flex-1">
                  Event Reminders
                  <p className="text-sm text-gray-500 font-normal">
                    Get reminders for upcoming events
                  </p>
                </Label>
                <Switch id="event-reminders" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="job-alerts" className="flex-1">
                  Job Alerts
                  <p className="text-sm text-gray-500 font-normal">
                    Notify me about new job postings
                  </p>
                </Label>
                <Switch id="job-alerts" defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Communication Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Communication Preferences</CardTitle>
              <CardDescription>Manage how we communicate with you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="newsletter" className="flex-1">
                  Alumni Newsletter
                  <p className="text-sm text-gray-500 font-normal">
                    Monthly updates from the alumni association
                  </p>
                </Label>
                <Switch id="newsletter" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="event-invites" className="flex-1">
                  Event Invitations
                  <p className="text-sm text-gray-500 font-normal">
                    Invitations to alumni events and webinars
                  </p>
                </Label>
                <Switch id="event-invites" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="fundraising" className="flex-1">
                  Fundraising Updates
                  <p className="text-sm text-gray-500 font-normal">
                    Updates on fundraising campaigns and impact
                  </p>
                </Label>
                <Switch id="fundraising" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="surveys" className="flex-1">
                  Surveys & Feedback
                  <p className="text-sm text-gray-500 font-normal">
                    Participate in alumni surveys and research
                  </p>
                </Label>
                <Switch id="surveys" />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-3">
            <Button variant="outline">Cancel</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700">Save Changes</Button>
          </div>
        </div>
      </div>
    </div>
  );
}