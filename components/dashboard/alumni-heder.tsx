"use client";

import { useState } from "react";
import {
  Search,
  Bell,
  UserPlus,
  Moon,
  Sun,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/hooks/use-theme";
import { Badge } from "@/components/ui/badge";

interface AlumniHeaderProps {
  onMenuToggle?: () => void;
}

export function AlumniHeader({ onMenuToggle }: AlumniHeaderProps) {
  const [search, setSearch] = useState("");
  const { theme, toggleTheme } = useTheme();
  const notifications = 3;
  const connectionRequests = 2;

  return (
    <header className="w-full">
      <div className="px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section - Mobile Menu & Search */}
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={onMenuToggle}
              aria-label="Toggle sidebar"
            >
              <Menu className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </Button>

            {/* Search Bar */}
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search alumni, events, jobs..."
                className="pl-10 pr-4 w-full bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 focus-visible:ring-2 focus-visible:ring-indigo-500/50 backdrop-blur-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-2 sm:gap-3 ml-4">
            {/* Connection Requests */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label="Connection requests">
                  <UserPlus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  {connectionRequests > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 bg-green-500 text-white text-xs p-0 flex items-center justify-center">
                      {connectionRequests}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Connection requests</p>
              </TooltipContent>
            </Tooltip>

            {/* Notifications */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label="Notifications">
                  <Bell className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  {notifications > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs p-0 flex items-center justify-center">
                      {notifications}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Notifications</p>
              </TooltipContent>
            </Tooltip>

            {/* Theme Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4 text-yellow-400" />
                  ) : (
                    <Moon className="h-4 w-4 text-gray-600" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle theme</p>
              </TooltipContent>
            </Tooltip>

            {/* User Avatar */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8 border-2 border-indigo-200 dark:border-indigo-800 cursor-pointer">
                  <AvatarImage src="/avatar.jpg" alt="Alex Johnson" />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 dark:from-indigo-900 dark:to-purple-900 dark:text-indigo-300 text-sm font-medium">
                    AJ
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>Alex Johnson</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </header>
  );
}