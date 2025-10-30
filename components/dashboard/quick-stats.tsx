import { Card, CardContent } from "@/components/ui/card";
import { Users, CalendarDays, MessageCircle } from "lucide-react";

const stats = [
  {
    label: "Connections",
    value: "1,245",
    trend: "+12 this week",
    icon: Users,
    gradient: "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20",
    border: "border-blue-200 dark:border-blue-800",
    iconBg: "bg-blue-100 dark:bg-blue-800",
    iconColor: "text-blue-600 dark:text-blue-400"
  },
  {
    label: "Events Attended",
    value: "18",
    trend: "2 upcoming",
    icon: CalendarDays,
    gradient: "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
    border: "border-green-200 dark:border-green-800",
    iconBg: "bg-green-100 dark:bg-green-800",
    iconColor: "text-green-600 dark:text-green-400"
  },
  {
    label: "Unread Messages",
    value: "7",
    trend: "Priority: 2",
    icon: MessageCircle,
    gradient: "from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20",
    border: "border-purple-200 dark:border-purple-800",
    iconBg: "bg-purple-100 dark:bg-purple-800",
    iconColor: "text-purple-600 dark:text-purple-400"
  }
];

export function QuickStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className={`bg-gradient-to-r ${stat.gradient} ${stat.border}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">{stat.trend}</p>
              </div>
              <div className={`p-3 ${stat.iconBg} rounded-full`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}