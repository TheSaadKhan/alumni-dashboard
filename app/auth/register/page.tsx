"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/db/client/supabase-browser";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    graduationYear: new Date().getFullYear().toString(),
    degree: "bsc"
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const currentYear = new Date().getFullYear();
  const graduationYears = Array.from({ length: 50 }, (_, i) => currentYear - i);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match", {
        description: "Please make sure your passwords match.",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password too short", {
        description: "Password must be at least 6 characters long.",
      });
      return;
    }

    if (!formData.firstName || !formData.lastName) {
      toast.error("Missing information", {
        description: "Please provide your first and last name.",
      });
      return;
    }

    setLoading(true);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (authError) {
        toast.error("Registration Failed", {
          description: authError.message,
        });
        return;
      }

      if (authData.user) {
        // Create profile in database
        const fullName = `${formData.firstName} ${formData.lastName}`;
        const degreeMap: { [key: string]: string } = {
          'bsc': "Bachelor's",
          'msc': "Master's", 
          'phd': "PhD",
          'other': "Other"
        };

        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            auth_user_id: authData.user.id,
            email: formData.email,
            first_name: formData.firstName,
            last_name: formData.lastName,
            full_name: fullName,
            graduation_year: parseInt(formData.graduationYear),
            degree: degreeMap[formData.degree],
            is_active: true,
            is_verified: false,
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          toast.error("Profile Creation Failed", {
            description: "Account created but profile setup failed. Please contact support.",
          });
        }

        toast.success("Account Created Successfully!", {
          description: authData.session 
            ? "You have been automatically signed in." 
            : "Please check your email to verify your account.",
          action: authData.session ? {
            label: "Go to Dashboard",
            onClick: () => router.push('/dashboard')
          } : undefined,
        });

        if (authData.session) {
          // User is automatically signed in (email confirmation might be disabled)
          router.push('/auth/complete-profile');
        } else {
          // Email confirmation required
          router.push('/auth/verify-email');
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error("Registration Failed", {
        description: error.message || "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoRegister = async () => {
    setLoading(true);
    
    try {
      const demoEmail = `demo-${Date.now()}@alumniconnect.com`;
      const demoPassword = "demo123456";

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPassword,
        options: {
          data: {
            first_name: "Demo",
            last_name: "User",
          }
        }
      });

      if (authError) {
        toast.error("Demo Registration Failed", {
          description: authError.message,
        });
        return;
      }

      if (authData.user) {
        // Create demo profile
        await supabase
          .from('profiles')
          .insert({
            auth_user_id: authData.user.id,
            email: demoEmail,
            first_name: "Demo",
            last_name: "User",
            full_name: "Demo User",
            graduation_year: currentYear - 2,
            degree: "Bachelor's",
            current_position: "Software Engineer",
            company: "Tech Company",
            industry: "Technology",
            location: "San Francisco, CA",
            bio: "This is a demo account to explore AlumniConnect features.",
            is_active: true,
            is_verified: true,
          });

        // Sign in with demo account
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: demoEmail,
          password: demoPassword,
        });

        if (signInError) {
          toast.error("Demo Login Failed", {
            description: "Please try signing in manually with the demo credentials.",
          });
          return;
        }

        toast.success("Demo Account Created!", {
          description: "You're now signed in with a demo account.",
        });

        router.push('/dashboard');
      }
    } catch (error: any) {
      toast.error("Demo Registration Failed", {
        description: error.message || "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Join AlumniConnect</CardTitle>
          <CardDescription>
            Create your account to connect with fellow alumni
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="graduationYear">Graduation Year</Label>
                <Select 
                  value={formData.graduationYear} 
                  onValueChange={(value) => setFormData({...formData, graduationYear: value})}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {graduationYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="degree">Degree</Label>
                <Select 
                  value={formData.degree} 
                  onValueChange={(value) => setFormData({...formData, degree: value})}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select degree" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bsc">Bachelor's</SelectItem>
                    <SelectItem value="msc">Master's</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password (min. 6 characters)"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  disabled={loading}
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleDemoRegister}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Try Demo Account
          </Button>
          
          <div className="mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link 
              href="/auth/login" 
              className="text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
            >
              Sign in
            </Link>
          </div>

          <div className="mt-4 text-xs text-muted-foreground text-center">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-primary">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-primary">
              Privacy Policy
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}