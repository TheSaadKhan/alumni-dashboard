"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Filter, Calendar, User, ArrowRight, BookOpen } from "lucide-react";

export default function StoriesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const stories = [
    {
      id: "john-doe-tech-entrepreneur",
      title: "From Campus to CEO: Building a Tech Empire",
      excerpt: "How my university experience shaped my entrepreneurial journey from student to successful tech founder.",
      author: {
        name: "John Doe",
        role: "CEO at TechSolutions",
        batch: "2015",
        image: "/avatars/john-doe.jpg"
      },
      category: "entrepreneurship",
      readTime: "5 min read",
      publishedDate: "2024-01-15",
      featured: true
    },
    {
      id: "sarah-chen-leadership",
      title: "Breaking Barriers: Women in Tech Leadership",
      excerpt: "Navigating the tech industry as a female leader and creating opportunities for the next generation.",
      author: {
        name: "Sarah Chen",
        role: "Engineering Manager at TechCorp",
        batch: "2015",
        image: "/avatars/sarah-chen.jpg"
      },
      category: "leadership",
      readTime: "4 min read",
      publishedDate: "2024-01-10",
      featured: false
    },
    {
      id: "mike-rodriguez-career-change",
      title: "From Engineering to Product Management",
      excerpt: "My journey transitioning from a technical role to product leadership and the lessons learned along the way.",
      author: {
        name: "Mike Rodriguez",
        role: "Product Director at StartupXYZ",
        batch: "2012",
        image: "/avatars/mike-rodriguez.jpg"
      },
      category: "career",
      readTime: "6 min read",
      publishedDate: "2024-01-08",
      featured: true
    },
    {
      id: "emily-davis-design-education",
      title: "The Power of Design Thinking in Education",
      excerpt: "How applying design principles transformed educational experiences and student outcomes.",
      author: {
        name: "Emily Davis",
        role: "Senior UX Designer at DesignStudio",
        batch: "2018",
        image: "/avatars/emily-davis.jpg"
      },
      category: "education",
      readTime: "3 min read",
      publishedDate: "2024-01-05",
      featured: false
    },
    {
      id: "david-wilson-startup-journey",
      title: "From Zero to Unicorn: My Startup Story",
      excerpt: "The rollercoaster journey of building a startup from scratch and achieving unicorn status.",
      author: {
        name: "David Wilson",
        role: "Founder at InnovateLabs",
        batch: "2010",
        image: "/avatars/david-wilson.jpg"
      },
      category: "entrepreneurship",
      readTime: "8 min read",
      publishedDate: "2024-01-02",
      featured: true
    },
    {
      id: "alex-johnson-mentorship",
      title: "The Ripple Effect of Mentorship",
      excerpt: "How mentorship transformed my career and inspired me to pay it forward to the next generation.",
      author: {
        name: "Alex Johnson",
        role: "Senior Software Engineer",
        batch: "2018",
        image: "/avatars/alex-johnson.jpg"
      },
      category: "mentorship",
      readTime: "4 min read",
      publishedDate: "2023-12-28",
      featured: false
    }
  ];

  const categories = [
    { id: "all", name: "All Stories" },
    { id: "entrepreneurship", name: "Entrepreneurship" },
    { id: "leadership", name: "Leadership" },
    { id: "career", name: "Career Growth" },
    { id: "education", name: "Education" },
    { id: "mentorship", name: "Mentorship" }
  ];

  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.author.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || story.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const featuredStories = filteredStories.filter(story => story.featured);
  const regularStories = filteredStories.filter(story => !story.featured);

  const getCategoryColor = (category: string) => {
    const colors = {
      entrepreneurship: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      leadership: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      career: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      education: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      mentorship: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300"
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Alumni Success Stories
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Discover inspiring journeys, career transformations, and success stories from our alumni community.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search stories by title, content, or author..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setCategoryFilter(category.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                    categoryFilter === category.id
                      ? "bg-indigo-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Stories */}
        {featuredStories.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Featured Stories</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredStories.map((story) => (
                <Card key={story.id} className="hover:shadow-lg transition-shadow border-2 border-indigo-100 dark:border-indigo-900">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-3">
                      <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                        Featured
                      </Badge>
                      <Badge className={getCategoryColor(story.category)}>
                        {story.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{story.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {story.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={story.author.image} />
                        <AvatarFallback>
                          {story.author.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {story.author.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {story.author.role} • Batch of {story.author.batch}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(story.publishedDate).toLocaleDateString()}
                      </div>
                      <div>{story.readTime}</div>
                    </div>
                    <Link href={`/stories/${story.id}`}>
                      <Button variant="ghost" size="sm">
                        Read Story
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Stories */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {categoryFilter === "all" ? "All Stories" : categories.find(c => c.id === categoryFilter)?.name}
          </h2>
          
          {filteredStories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularStories.map((story) => (
                <Card key={story.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-3">
                      <Badge className={getCategoryColor(story.category)}>
                        {story.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{story.title}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {story.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={story.author.image} />
                        <AvatarFallback>
                          {story.author.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {story.author.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Batch of {story.author.batch}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {story.readTime}
                    </div>
                    <Link href={`/stories/${story.id}`}>
                      <Button variant="ghost" size="sm">
                        Read
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No stories found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchTerm ? `No stories matching "${searchTerm}"` : "No stories available in this category"}
                </p>
                {searchTerm && (
                  <Button 
                    variant="outline"
                    onClick={() => setSearchTerm("")}
                  >
                    Clear Search
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Call to Action */}
        <Card className="mt-12 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Share Your Story</h3>
            <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
              Have an inspiring journey or valuable experience to share? Contribute to our alumni success stories and inspire the next generation.
            </p>
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100">
              <User className="h-4 w-4 mr-2" />
              Share Your Story
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}