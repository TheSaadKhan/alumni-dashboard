import { ChevronRight, CalendarDays } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const news = [
  {
    title: "Alumni Connect Day 2024 Recap",
    date: "October 26, 2024",
    summary: "A record turnout and inspiring keynotes marked this year's event.",
    category: "Event",
  },
  {
    title: "New Alumni Grant Program",
    date: "November 10, 2024",
    summary: "Apply now for funding to support your next big idea.",
    category: "Opportunity",
  },
  {
    title: "Campus Infrastructure Updates",
    date: "November 15, 2024",
    summary: "New science building and renovated library now open for visits.",
    category: "Campus News",
  },
];

export function NewsAnnouncements() {
  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-gray-900 dark:text-white">News & Announcements</CardTitle>
          <CardDescription>Latest from the alumni association</CardDescription>
        </div>
        <Tabs defaultValue="all" className="w-auto">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="campus">Campus</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {news.map((item, index) => (
            <div 
              key={index} 
              className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 hover:shadow-sm group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <CalendarDays className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                    {item.category}
                  </Badge>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.date}</p>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {item.title}
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">{item.summary}</p>
              </div>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                Read More
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}