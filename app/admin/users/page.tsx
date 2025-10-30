"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, MoreVertical, Mail, Phone, Calendar, Shield, Users } from "lucide-react";

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const users = [
    {
      id: "1",
      name: "Sarah Chen",
      email: "sarah.chen@example.com",
      role: "alumni",
      status: "active",
      batch: "2015",
      degree: "Computer Science",
      joinDate: "2023-01-15",
      lastActive: "2024-01-20",
      connections: 245,
      eventsAttended: 12
    },
    {
      id: "2",
      name: "Mike Rodriguez",
      email: "mike.rodriguez@example.com",
      role: "alumni",
      status: "active",
      batch: "2012",
      degree: "Business Administration",
      joinDate: "2023-02-10",
      lastActive: "2024-01-19",
      connections: 189,
      eventsAttended: 8
    },
    {
      id: "3",
      name: "Emily Davis",
      email: "emily.davis@example.com",
      role: "alumni",
      status: "pending",
      batch: "2018",
      degree: "Graphic Design",
      joinDate: "2024-01-05",
      lastActive: "2024-01-18",
      connections: 45,
      eventsAttended: 2
    },
    {
      id: "4",
      name: "David Wilson",
      email: "david.wilson@example.com",
      role: "admin",
      status: "active",
      batch: "2010",
      degree: "Computer Engineering",
      joinDate: "2022-11-20",
      lastActive: "2024-01-20",
      connections: 312,
      eventsAttended: 15
    },
    {
      id: "5",
      name: "Alex Johnson",
      email: "alex.johnson@example.com",
      role: "alumni",
      status: "suspended",
      batch: "2018",
      degree: "Software Engineering",
      joinDate: "2023-03-15",
      lastActive: "2024-01-10",
      connections: 89,
      eventsAttended: 5
    }
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      alumni: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      student: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    };
    return styles[role as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage all alumni and user accounts</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Shield className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">1,247</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">1,189</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
              </div>
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">23</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">35</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Suspended</p>
              </div>
              <Shield className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Search and manage user accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users by name or email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex space-x-2">
              <select 
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Connections</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`/avatars/${user.name.toLowerCase().replace(' ', '-')}.jpg`} />
                          <AvatarFallback>
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadge(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(user.status)}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-900 dark:text-white">
                      {user.batch}
                    </TableCell>
                    <TableCell className="text-sm text-gray-900 dark:text-white">
                      {user.connections}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(user.lastActive).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="icon">
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No users found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? `No users matching "${searchTerm}"` : "No users available"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}