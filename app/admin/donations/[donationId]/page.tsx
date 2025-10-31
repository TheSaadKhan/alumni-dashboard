"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, DollarSign, User, Calendar, Mail, Download, Receipt, Building2, Settings } from "lucide-react";

export default function DonationDetailPage() {
  const params = useParams();
  const router = useRouter();

  // Mock donation data - in real app, fetch based on donationId
  const donation = {
    id: params.donationId,
    donor: {
      name: "Sarah Chen",
      email: "sarah.chen@example.com",
      phone: "+1 (555) 123-4567",
      batch: "2015",
      company: "TechCorp"
    },
    amount: 10000,
    type: "one-time",
    status: "completed",
    campaign: "Scholarship Program",
    date: "2024-01-15",
    method: "Credit Card",
    receipt: "RC-2024-001",
    notes: "Thank you for supporting our scholarship program!",
    frequency: "one-time",
    nextPayment: null
  };

  const transactionHistory = [
    { id: 1, date: "2024-01-15", amount: 10000, status: "completed", method: "Credit Card" },
    { id: 2, date: "2023-12-15", amount: 10000, status: "completed", method: "Credit Card" },
    { id: 3, date: "2023-11-15", amount: 10000, status: "completed", method: "Credit Card" }
  ];

  const donorStats = {
    totalDonated: 30000,
    donationCount: 3,
    firstDonation: "2023-11-15",
    preferredMethod: "Credit Card",
    avgDonation: 10000
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      "one-time": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      monthly: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      yearly: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    };
    return styles[type as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/donations")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Donation Details</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage donation and donor information</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Receipt className="h-4 w-4 mr-2" />
            Generate Receipt
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Settings className="h-4 w-4 mr-2" />
            Manage Donation
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="details" className="space-y-6">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="donor">Donor Info</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6">
              {/* Donation Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Donation Information</CardTitle>
                  <CardDescription>Transaction details and campaign information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className={getTypeBadge(donation.type)}>
                      {donation.type}
                    </Badge>
                    <Badge className={getStatusBadge(donation.status)}>
                      {donation.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Transaction Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Amount</span>
                          <span className="font-medium">${donation.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Date</span>
                          <span>{new Date(donation.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Method</span>
                          <span>{donation.method}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Receipt #</span>
                          <span>{donation.receipt}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Campaign Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Campaign</span>
                          <span className="font-medium">{donation.campaign}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Frequency</span>
                          <span>{donation.frequency}</span>
                        </div>
                        {donation.nextPayment && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Next Payment</span>
                            <span>{new Date(donation.nextPayment).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {donation.notes && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Notes</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        {donation.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Impact Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Impact Summary</CardTitle>
                  <CardDescription>How this donation contributes to our mission</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                        <User className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">2</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Students Supported</div>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">1</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Programs Funded</div>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                        <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">6</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Months of Support</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Transaction History</CardTitle>
                      <CardDescription>Past donations from this donor</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export History
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Receipt</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactionHistory.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">
                              {new Date(transaction.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-gray-900 dark:text-white">
                                ${transaction.amount.toLocaleString()}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                              {transaction.method}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusBadge(transaction.status)}>
                                {transaction.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                <Receipt className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Donor Tab */}
            <TabsContent value="donor">
              <Card>
                <CardHeader>
                  <CardTitle>Donor Information</CardTitle>
                  <CardDescription>Contact details and donor profile</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start space-x-6">
                    <Avatar className="h-20 w-20 border-2 border-white dark:border-gray-800 shadow-lg">
                      <AvatarImage src={`/avatars/${donation.donor.name.toLowerCase().replace(' ', '-')}.jpg`} />
                      <AvatarFallback className="text-xl">
                        {donation.donor.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Contact Information</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{donation.donor.email}</span>
                          </div>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{donation.donor.phone}</span>
                          </div>
                          <div className="flex items-center">
                            <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{donation.donor.company}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Alumni Information</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Batch</span>
                            <span>Class of {donation.donor.batch}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Total Donated</span>
                            <span className="font-medium">${donorStats.totalDonated.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Donation Count</span>
                            <span>{donorStats.donationCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">First Donation</span>
                            <span>{new Date(donorStats.firstDonation).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Donation Settings</CardTitle>
                  <CardDescription>Manage donation configuration and processing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Transaction Details</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>Receipt Number</span>
                          <span className="font-medium">{donation.receipt}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Payment Method</span>
                          <span className="font-medium">{donation.method}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Donation Type</span>
                          <span className="font-medium">{donation.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Campaign</span>
                          <span className="font-medium">{donation.campaign}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h4>
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full justify-start">
                          Send Thank You Email
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          Update Payment Method
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          Change Donation Frequency
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h4>
                    <div className="space-y-3">
                      <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                        Refund Donation
                      </Button>
                      <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                        Cancel Recurring Donation
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Donation Status */}
          <Card>
            <CardHeader>
              <CardTitle>Donation Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status</span>
                <Badge className={getStatusBadge(donation.status)}>
                  {donation.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Type</span>
                <Badge className={getTypeBadge(donation.type)}>
                  {donation.type}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Amount</span>
                <span className="text-sm font-medium">${donation.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Date</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(donation.date).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Donor Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Donor Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`/avatars/${donation.donor.name.toLowerCase().replace(' ', '-')}.jpg`} />
                  <AvatarFallback>
                    {donation.donor.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{donation.donor.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Batch of {donation.donor.batch}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Donated</span>
                  <span className="font-medium">${donorStats.totalDonated.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Donation Count</span>
                  <span>{donorStats.donationCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Donation</span>
                  <span>${donorStats.avgDonation.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Receipt className="h-4 w-4 mr-2" />
                Generate Receipt
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Email Donor
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export Details
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="h-4 w-4 mr-2" />
                Process Refund
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}