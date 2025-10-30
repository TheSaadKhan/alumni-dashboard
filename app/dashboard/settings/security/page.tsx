"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Shield, Key, Smartphone, Lock } from "lucide-react";

export default function SecuritySettingsPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const sessions = [
    {
      id: "1",
      device: "Chrome on Windows",
      location: "San Francisco, CA",
      lastActive: "2 hours ago",
      current: true
    },
    {
      id: "2",
      device: "Safari on iPhone",
      location: "San Francisco, CA",
      lastActive: "1 day ago",
      current: false
    },
    {
      id: "3",
      device: "Firefox on MacOS",
      location: "New York, NY",
      lastActive: "1 week ago",
      current: false
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Security Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your account security and privacy</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="h-5 w-5 mr-2" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" />
            </div>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Update Password
            </Button>
          </CardContent>
        </Card>

        {/* Two-Factor Authentication */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              Add an extra layer of security to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="2fa" className="text-base">
                  Enable 2FA
                </Label>
                <p className="text-sm text-gray-500">
                  Protect your account with two-factor authentication
                </p>
              </div>
              <Switch
                id="2fa"
                checked={twoFactorEnabled}
                onCheckedChange={setTwoFactorEnabled}
              />
            </div>
            {twoFactorEnabled && (
              <div className="space-y-3 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-5 w-5 text-gray-400" />
                  <div>
                    <Label>Authenticator App</Label>
                    <p className="text-sm text-gray-500">
                      Use an app like Google Authenticator
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Set Up Authenticator
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Active Sessions
            </CardTitle>
            <CardDescription>
              Manage your active login sessions across devices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {session.device}
                        {session.current && (
                          <Badge variant="secondary" className="ml-2">
                            Current
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {session.location} • Last active {session.lastActive}
                      </div>
                    </div>
                  </div>
                  {!session.current && (
                    <Button variant="outline" size="sm">
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
          <CardDescription>Control how your information is shared</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="data-collection" className="flex-1">
              Data Collection
              <p className="text-sm text-gray-500 font-normal">
                Allow us to collect anonymous usage data to improve our services
              </p>
            </Label>
            <Switch id="data-collection" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="personalized-ads" className="flex-1">
              Personalized Content
              <p className="text-sm text-gray-500 font-normal">
                Show personalized job recommendations and event suggestions
              </p>
            </Label>
            <Switch id="personalized-ads" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="email-search" className="flex-1">
              Email Searchability
              <p className="text-sm text-gray-500 font-normal">
                Allow other alumni to find you by email address
              </p>
            </Label>
            <Switch id="email-search" defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}