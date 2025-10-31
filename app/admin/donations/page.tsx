"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Filter, 
  DollarSign, 
  Download, 
  MoreVertical, 
  User, 
  Calendar,
  Eye,
  Edit,
  Trash2,
  Plus
} from "lucide-react";

// Mock data - in real app, this would come from API
const mockDonations = [
  {
    id: "1",
    slug: "sarah-chen-scholarship-2024",
    donor: "Sarah Chen",
    email: "sarah.chen@example.com",
    amount: 10000,
    type: "one-time",
    status: "completed",
    campaign: "Scholarship Program",
    campaignSlug: "scholarship-program-2024",
    date: "2024-01-15",
    method: "Credit Card",
    receipt: "RC-2024-001"
  },
  {
    id: "2",
    slug: "mike-rodriguez-infrastructure",
    donor: "Mike Rodriguez",
    email: "mike.rodriguez@example.com",
    amount: 5000,
    type: "monthly",
    status: "active",
    campaign: "Campus Infrastructure",
    campaignSlug: "campus-infrastructure",
    date: "2024-01-14",
    method: "Bank Transfer",
    receipt: "RC-2024-002"
  },
  {
    id: "3",
    slug: "emily-davis-mentorship",
    donor: "Emily Davis",
    email: "emily.davis@example.com",
    amount: 2500,
    type: "one-time",
    status: "completed",
    campaign: "Mentorship Program",
    campaignSlug: "mentorship-program",
    date: "2024-01-12",
    method: "PayPal",
    receipt: "RC-2024-003"
  },
  {
    id: "4",
    slug: "david-wilson-library",
    donor: "David Wilson",
    email: "david.wilson@example.com",
    amount: 1000,
    type: "one-time",
    status: "pending",
    campaign: "Library Renovation",
    campaignSlug: "library-renovation",
    date: "2024-01-10",
    method: "Credit Card",
    receipt: "RC-2024-004"
  },
  {
    id: "5",
    slug: "alex-johnson-student-support",
    donor: "Alex Johnson",
    email: "alex.johnson@example.com",
    amount: 500,
    type: "yearly",
    status: "active",
    campaign: "Student Support",
    campaignSlug: "student-support",
    date: "2024-01-08",
    method: "Bank Transfer",
    receipt: "RC-2024-005"
  }
];

const mockCampaigns = [
  { slug: "scholarship-program-2024", name: "Scholarship Program", totalRaised: 50000 },
  { slug: "campus-infrastructure", name: "Campus Infrastructure", totalRaised: 25000 },
  { slug: "mentorship-program", name: "Mentorship Program", totalRaised: 15000 },
  { slug: "library-renovation", name: "Library Renovation", totalRaised: 8000 },
  { slug: "student-support", name: "Student Support", totalRaised: 12000 },
];

export default function AdminDonationsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const handleViewDonation = (donationSlug: string) => {
    router.push(`/admin/donations/${donationSlug}`);
  };

  const handleViewCampaign = (campaignSlug: string) => {
    router.push(`/admin/donations/campaigns/${campaignSlug}`);
  };

  const handleEditDonation = (donationSlug: string) => {
    router.push(`/admin/donations/${donationSlug}/edit`);
  };

  const filteredDonations = mockDonations.filter(donation => {
    const matchesSearch = donation.donor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donation.campaign.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || donation.status === statusFilter;
    const matchesCampaign = campaignFilter === "all" || donation.campaignSlug === campaignFilter;
    const matchesType = typeFilter === "all" || donation.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesCampaign && matchesType;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      active: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      "one-time": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      monthly: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      yearly: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    };
    return styles[type as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const stats = {
    totalDonations: 125000,
    monthlyRecurring: 2500,
    donorsCount: 234,
    averageDonation: 534,
    activeCampaigns: 5
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Donation Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage donations and fundraising campaigns</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => router.push('/admin/donations/campaigns/create')}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${(stats.totalDonations / 1000).toFixed(0)}K
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Raised</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${stats.monthlyRecurring}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Recurring</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.donorsCount}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Donors</p>
              </div>
              <User className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">${stats.averageDonation}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Average Donation</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeCampaigns}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Campaigns</p>
              </div>
              <DollarSign className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Fundraising Campaigns</CardTitle>
              <CardDescription>Active fundraising campaigns and their progress</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/admin/donations/campaigns')}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockCampaigns.slice(0, 3).map((campaign) => (
              <Card key={campaign.slug} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4" onClick={() => handleViewCampaign(campaign.slug)}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {campaign.name}
                    </h3>
                    <Badge variant="outline">Active</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Raised:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ${campaign.totalRaised.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, (campaign.totalRaised / 50000) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Donations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Donations</CardTitle>
          <CardDescription>Manage and track all donations</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search donations by donor, email, or campaign..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select 
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              <select 
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                value={campaignFilter}
                onChange={(e) => setCampaignFilter(e.target.value)}
              >
                <option value="all">All Campaigns</option>
                {mockCampaigns.map(campaign => (
                  <option key={campaign.slug} value={campaign.slug}>
                    {campaign.name}
                  </option>
                ))}
              </select>
              <select 
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="one-time">One-time</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>

          {/* Donations Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Donor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDonations.map((donation) => (
                  <TableRow key={donation.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                    <TableCell onClick={() => handleViewDonation(donation.slug)}>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {donation.donor}
                        </div>
                        <div className="text-sm text-gray-500">{donation.email}</div>
                      </div>
                    </TableCell>
                    <TableCell onClick={() => handleViewDonation(donation.slug)}>
                      <div className="font-medium text-gray-900 dark:text-white">
                        ${donation.amount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell onClick={() => handleViewDonation(donation.slug)}>
                      <Badge className={getTypeBadge(donation.type)}>
                        {donation.type}
                      </Badge>
                    </TableCell>
                    <TableCell 
                      className="text-sm text-gray-900 dark:text-white hover:text-indigo-600 transition-colors"
                      onClick={() => handleViewCampaign(donation.campaignSlug)}
                    >
                      {donation.campaign}
                    </TableCell>
                    <TableCell onClick={() => handleViewDonation(donation.slug)}>
                      {new Date(donation.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell onClick={() => handleViewDonation(donation.slug)}>
                      {donation.method}
                    </TableCell>
                    <TableCell onClick={() => handleViewDonation(donation.slug)}>
                      <Badge className={getStatusBadge(donation.status)}>
                        {donation.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleViewDonation(donation.slug)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditDonation(donation.slug)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredDonations.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No donations found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? `No donations matching "${searchTerm}"` : "No donations available"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}