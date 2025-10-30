"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Shield, Bell, Mail, Globe, Users, Database } from "lucide-react";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  const [settings, setSettings] = useState({
    // General Settings
    siteName: "AlumniConnect",
    siteDescription: "Bridging Graduates, Building Futures",
    contactEmail: "admin@alumniconnect.edu",
    supportEmail: "support@alumniconnect.edu",
    
    // Security Settings
    requireEmailVerification: true,
    allowRegistrations: true,
    maxLoginAttempts: 5,
    sessionTimeout: 24,
    
    // Notification Settings
    emailNotifications: true,
    adminAlerts: true,
    weeklyReports: true,
    
    // Email Settings
    smtpHost: "smtp.alumniconnect.edu",
    smtpPort: "587",
    smtpUsername: "noreply@alumniconnect.edu",
    
    // Privacy Settings
    showEmailPublic: false,
    allowDataExport: true,
    analyticsTracking: true
  });

  const handleSave = () => {
    // Save settings logic
    console.log("Saving settings:", settings);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage platform configuration and preferences</p>
        </div>
        <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Advanced</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic platform configuration and information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  rows={3}
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure platform security and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="requireEmailVerification" className="flex-1">
                  Require Email Verification
                  <p className="text-sm text-gray-500 font-normal">
                    Users must verify their email address before accessing the platform
                  </p>
                </Label>
                <Switch
                  id="requireEmailVerification"
                  checked={settings.requireEmailVerification}
                  onCheckedChange={(checked) => setSettings({...settings, requireEmailVerification: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="allowRegistrations" className="flex-1">
                  Allow New Registrations
                  <p className="text-sm text-gray-500 font-normal">
                    Allow new users to register for the platform
                  </p>
                </Label>
                <Switch
                  id="allowRegistrations"
                  checked={settings.allowRegistrations}
                  onCheckedChange={(checked) => setSettings({...settings, allowRegistrations: checked})}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => setSettings({...settings, maxLoginAttempts: parseInt(e.target.value) || 5})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value) || 24})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure system notifications and alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="emailNotifications" className="flex-1">
                  Email Notifications
                  <p className="text-sm text-gray-500 font-normal">
                    Send email notifications for important system events
                  </p>
                </Label>
                <Switch
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="adminAlerts" className="flex-1">
                  Admin Alerts
                  <p className="text-sm text-gray-500 font-normal">
                    Receive alerts for critical system events and security issues
                  </p>
                </Label>
                <Switch
                  id="adminAlerts"
                  checked={settings.adminAlerts}
                  onCheckedChange={(checked) => setSettings({...settings, adminAlerts: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="weeklyReports" className="flex-1">
                  Weekly Reports
                  <p className="text-sm text-gray-500 font-normal">
                    Send weekly platform activity and performance reports
                  </p>
                </Label>
                <Switch
                  id="weeklyReports"
                  checked={settings.weeklyReports}
                  onCheckedChange={(checked) => setSettings({...settings, weeklyReports: checked})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>Configure email server and delivery settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={settings.smtpHost}
                    onChange={(e) => setSettings({...settings, smtpHost: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    value={settings.smtpPort}
                    onChange={(e) => setSettings({...settings, smtpPort: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="smtpUsername">SMTP Username</Label>
                <Input
                  id="smtpUsername"
                  value={settings.smtpUsername}
                  onChange={(e) => setSettings({...settings, smtpUsername: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="smtpPassword">SMTP Password</Label>
                <Input
                  id="smtpPassword"
                  type="password"
                  placeholder="Enter SMTP password"
                />
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Email Testing
                </h4>
                <p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
                  Test your email configuration by sending a test email.
                </p>
                <Button variant="outline" size="sm">
                  Send Test Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Configure data privacy and user consent settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="showEmailPublic" className="flex-1">
                  Show Email Publicly
                  <p className="text-sm text-gray-500 font-normal">
                    Allow user email addresses to be visible to other users
                  </p>
                </Label>
                <Switch
                  id="showEmailPublic"
                  checked={settings.showEmailPublic}
                  onCheckedChange={(checked) => setSettings({...settings, showEmailPublic: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="allowDataExport" className="flex-1">
                  Allow Data Export
                  <p className="text-sm text-gray-500 font-normal">
                    Allow users to export their personal data
                  </p>
                </Label>
                <Switch
                  id="allowDataExport"
                  checked={settings.allowDataExport}
                  onCheckedChange={(checked) => setSettings({...settings, allowDataExport: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="analyticsTracking" className="flex-1">
                  Analytics Tracking
                  <p className="text-sm text-gray-500 font-normal">
                    Enable anonymous usage analytics to improve the platform
                  </p>
                </Label>
                <Switch
                  id="analyticsTracking"
                  checked={settings.analyticsTracking}
                  onCheckedChange={(checked) => setSettings({...settings, analyticsTracking: checked})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Advanced platform configuration and maintenance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">Database Maintenance</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start">
                    <Database className="h-4 w-4 mr-2" />
                    Backup Database
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Database className="h-4 w-4 mr-2" />
                    Optimize Database
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">Cache Management</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start">
                    Clear User Cache
                  </Button>
                  <Button variant="outline" className="justify-start">
                    Clear System Cache
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">System Logs</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start">
                    View Error Logs
                  </Button>
                  <Button variant="outline" className="justify-start">
                    View Access Logs
                  </Button>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h4 className="font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h4>
                <div className="space-y-3">
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                    Reset All Settings
                  </Button>
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                    Clear All Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}