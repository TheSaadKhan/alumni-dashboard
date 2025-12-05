"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, DollarSign, Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function AdminDonationsPage() {
  const router = useRouter();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalDonations: 0,
    completed: 0,
    pending: 0,
  });

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        const orgsRes = await fetch("/api/organizations");
        if (!orgsRes.ok) throw new Error("Failed to load organizations");
        const orgsData = await orgsRes.json();

        if (orgsData.organizations && orgsData.organizations.length > 0) {
          const primaryOrg = orgsData.organizations[0];
          setOrganizationId(primaryOrg.id);

          const donationsRes = await fetch(
            `/api/donations?organizationId=${primaryOrg.id}&status=${statusFilter}`
          );
          if (!donationsRes.ok) throw new Error("Failed to load donations");
          const donationsData = await donationsRes.json();
          setDonations(donationsData.donations || []);
          setStats({
            totalAmount: donationsData.totalAmount || 0,
            totalDonations: donationsData.donations?.length || 0,
            completed: donationsData.donations?.filter((d: any) => d.status === "completed").length || 0,
            pending: donationsData.donations?.filter((d: any) => d.status === "pending").length || 0,
          });
        }
      } catch (err: any) {
        console.error("Failed to load donations:", err);
        toast.error("Failed to load donations");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, statusFilter]);

  const filteredDonations = donations.filter((donation) => {
    const matchesSearch =
      donation.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      refunded: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Donations</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and track all donations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  ${stats.totalAmount.toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Raised</p>
              </div>
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalDonations}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Donations</p>
              </div>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.completed}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Completed</p>
              </div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.pending}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Pending</p>
              </div>
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Donations</CardTitle>
          <CardDescription>View and manage donation records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by donor name or email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Donations Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Donor</TableHead>
                  <TableHead className="hidden sm:table-cell">Amount</TableHead>
                  <TableHead className="hidden md:table-cell">Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDonations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No donations found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {searchTerm
                          ? `No donations matching "${searchTerm}"`
                          : "No donations available"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDonations.map((donation) => (
                    <TableRow key={donation.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={donation.profiles?.avatar_url} />
                            <AvatarFallback>
                              {donation.profiles?.full_name
                                ?.split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .toUpperCase() || "D"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {donation.anonymous
                                ? "Anonymous"
                                : donation.profiles?.full_name || "Unknown"}
                            </div>
                            {!donation.anonymous && (
                              <div className="text-xs sm:text-sm text-gray-500">
                                {donation.profiles?.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          ${donation.amount?.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-gray-900 dark:text-white">
                        {donation.payment_method || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(donation.status)}>
                          {donation.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-gray-500">
                        {donation.created_at
                          ? new Date(donation.created_at).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
