import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Target, Users, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              About AlumniConnect
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Building bridges between past, present, and future generations of our institution.
            </p>
          </div>
        </div>
      </div>

      {/* Mission & Vision */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card>
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-6">
                  <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Our Mission
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  To create a vibrant, engaged alumni community that supports lifelong learning, 
                  professional growth, and meaningful connections between graduates and their alma mater.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-6">
                  <Heart className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Our Vision
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  To be the most connected and supportive alumni network, empowering members to 
                  achieve personal and professional excellence while giving back to the community.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const stats = [
  { value: "10K+", label: "Alumni Members" },
  { value: "50+", label: "Countries" },
  { value: "200+", label: "Events Yearly" },
  { value: "1K+", label: "Success Stories" }
];