import { Briefcase, HeartHandshake, CalendarDays, Mail, Users, Bookmark } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const quickActions = [
  {
    title: "Job Board",
    icon: Briefcase,
    color: "text-blue-600",
    description: "Browse career opportunities",
  },
  {
    title: "Mentorship",
    icon: HeartHandshake,
    color: "text-green-600",
    description: "Find or become a mentor",
  },
  {
    title: "Events",
    icon: CalendarDays,
    color: "text-purple-600",
    description: "Discover upcoming events",
  },
  {
    title: "Messages",
    icon: Mail,
    color: "text-orange-600",
    description: "Check your inbox",
  },
  {
    title: "Network",
    icon: Users,
    color: "text-indigo-600",
    description: "Connect with alumni",
  },
  {
    title: "Resources",
    icon: Bookmark,
    color: "text-pink-600",
    description: "Access alumni resources",
  },
];

export function QuickActions() {
  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">Quick Actions</CardTitle>
        <CardDescription>Access frequently used features</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, index) => (
            <Tooltip key={action.title}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 border-gray-200 dark:border-gray-600"
                >
                  <action.icon className={`h-6 w-6 ${action.color}`} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{action.title}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{action.description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}