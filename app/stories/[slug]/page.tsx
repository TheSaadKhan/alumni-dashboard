import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, MapPin, GraduationCap } from "lucide-react";

// This would typically come from a database
const stories = {
  "john-doe-tech-entrepreneur": {
    title: "From Campus to CEO: Building a Tech Empire",
    excerpt: "How my university experience shaped my entrepreneurial journey",
    content: `
      <p>Walking through the university gates as a freshman, I never imagined where this journey would take me. The late nights in the computer lab, the passionate discussions with professors, and the friendships forged in the library - each moment contributed to the entrepreneur I am today.</p>
      
      <p>It was during my final year project that the idea for TechSolutions first sparked. My professor noticed my passion for solving real-world problems and encouraged me to think bigger. That encouragement, combined with the technical skills I gained, gave me the confidence to pursue my startup.</p>
      
      <p>The alumni network played a crucial role too. When I hit roadblocks in the early days, it was alumni mentors who provided guidance and connections. They helped me navigate the challenges of fundraising, hiring, and scaling.</p>
      
      <p>Today, TechSolutions employs over 200 people and serves clients worldwide. But more importantly, we've created a culture of innovation and giving back. We regularly host student interns and collaborate with university research projects.</p>
      
      <p>My advice to current students? Embrace every learning opportunity, build meaningful relationships, and don't be afraid to dream big. The foundation you build here will support you through your entire career.</p>
    `,
    author: {
      name: "John Doe",
      role: "CEO at TechSolutions",
      batch: "2015",
      degree: "Computer Science",
      image: "/avatars/john-doe.jpg"
    },
    publishedAt: "2024-01-15",
    readTime: "5 min read"
  }
};

interface StoryPageProps {
  params: {
    slug: string;
  };
}

export default function StoryPage({ params }: StoryPageProps) {
  const story = stories[params.slug as keyof typeof stories];

  if (!story) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Story Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {story.title}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            {story.excerpt}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-8">
                <div 
                  className="prose prose-lg dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: story.content }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Author Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Avatar className="h-16 w-16 mx-auto mb-4">
                    <AvatarImage src={story.author.image} />
                    <AvatarFallback>
                      {story.author.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {story.author.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {story.author.role}
                  </p>
                  <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center justify-center">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Batch of {story.author.batch}
                    </div>
                    <div className="flex items-center justify-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      {story.author.degree}
                    </div>
                    <div className="flex items-center justify-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {story.readTime}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}