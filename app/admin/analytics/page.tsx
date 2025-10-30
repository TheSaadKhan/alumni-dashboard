"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Download, Users, Calendar, Briefcase, DollarSign, TrendingUp, Eye, UserPlus } from "lucide-react";

export default function AdminAnalyticsPage() {
    const userGrowthData = [
        { month: 'Jan', users: 1000, newUsers: 45 },
        { month: 'Feb', users: 1120, newUsers: 52 },
        { month: 'Mar', users: 1250, newUsers: 65 },
        { month: 'Apr', users: 1320, newUsers: 48 },
        { month: 'May', users: 1400, newUsers: 55 },
        { month: 'Jun', users: 1520, newUsers: 62 },
        { month: 'Jul', users: 1640, newUsers: 58 },
        { month: 'Aug', users: 1720, newUsers: 51 },
        { month: 'Sep', users: 1850, newUsers: 67 },
        { month: 'Oct', users: 1950, newUsers: 49 },
        { month: 'Nov', users: 2100, newUsers: 73 },
        { month: 'Dec', users: 2247, newUsers: 68 }
    ];

    const engagementData = [
        { name: 'Events', value: 35 },
        { name: 'Jobs', value: 25 },
        { name: 'Messages', value: 20 },
        { name: 'Network', value: 15 },
        { name: 'Mentorship', value: 5 }
    ];

    const eventAttendanceData = [
        { event: 'Alumni Reunion', registered: 300, attended: 250 },
        { event: 'Tech Panel', registered: 200, attended: 180 },
        { event: 'Career Fair', registered: 150, attended: 120 },
        { event: 'Workshop', registered: 80, attended: 65 },
        { event: 'Networking', registered: 120, attended: 95 }
    ];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    const metrics = {
        totalUsers: 2247,
        activeUsers: 1890,
        newUsers: 68,
        growthRate: 12.5,
        totalEvents: 18,
        upcomingEvents: 6,
        jobPostings: 45,
        applications: 234,
        totalDonations: 125000,
        avgDonation: 534
    };


    type PieLabelProps = {
        name: string;
        value: number;
        percent: number;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400">Platform insights and performance metrics</p>
                </div>
                <div className="flex space-x-2">
                    <Select defaultValue="30days">
                        <SelectTrigger className="w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7days">Last 7 days</SelectItem>
                            <SelectItem value="30days">Last 30 days</SelectItem>
                            <SelectItem value="90days">Last 90 days</SelectItem>
                            <SelectItem value="1year">Last year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalUsers}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <div className="flex items-center mt-2">
                            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-sm text-green-600">{metrics.growthRate}% growth</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalEvents}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Events</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {metrics.upcomingEvents} upcoming
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.jobPostings}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Job Postings</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                                <Briefcase className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {metrics.applications} applications
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    ${(metrics.totalDonations / 1000).toFixed(0)}K
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Donations</p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                                <DollarSign className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            Avg: ${metrics.avgDonation}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Growth Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>User Growth</CardTitle>
                        <CardDescription>Monthly user acquisition and growth</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={userGrowthData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
                                <Line type="monotone" dataKey="newUsers" stroke="#10b981" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center space-x-4 mt-4">
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                <span className="text-sm text-gray-600">Total Users</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                <span className="text-sm text-gray-600">New Users</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Engagement Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>User Engagement</CardTitle>
                        <CardDescription>Platform feature usage distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={engagementData}
                                    dataKey="value"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    fill="#8884d8"
                                    labelLine={false}
                                    label={(props) => {
                                        const { name, percent } = props as unknown as { name: string; percent: number };
                                        return `${name} ${(percent * 100).toFixed(0)}%`;
                                    }}
                                >
                                    {engagementData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>

                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Event Attendance */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Event Performance</CardTitle>
                        <CardDescription>Registration vs attendance for recent events</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={eventAttendanceData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="event" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="registered" fill="#3b82f6" name="Registered" />
                                <Bar dataKey="attended" fill="#10b981" name="Attended" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">78%</div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Profile Completion</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                            <UserPlus className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">245</div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Avg Connections</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">68%</div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Event Attendance Rate</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Briefcase className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">5.2</div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Avg Applications per Job</p>
                    </CardContent>
                </Card>
            </div>
        </div >
    );
}