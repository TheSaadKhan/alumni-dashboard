import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
          </div>
          
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
          
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Page Not Found
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or you entered the wrong URL.
          </p>

          <div className="space-y-3">
            <Link href="/" className="block">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                <Home className="h-4 w-4 mr-2" />
                Back to Homepage
              </Button>
            </Link>
            
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Need help?{" "}
              <Link href="/contact" className="text-indigo-600 hover:text-indigo-500 font-medium">
                Contact support
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}