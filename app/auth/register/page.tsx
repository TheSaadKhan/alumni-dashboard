"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Eye, EyeOff, Building2, Users, MapPin, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/db/client/supabase-browser";
import Image from "next/image";

export default function OrganizationRegisterPage() {
  const [formData, setFormData] = useState({
    // Organization details
    organizationName: "",
    organizationType: "educational",
    email: "",
    password: "",
    confirmPassword: "",
    
    // Contact person (will become super admin)
    contactPerson: "",
    phoneNumber: "",
    jobTitle: "Principal",
    
    // Organization info
    website: "",
    employeeCount: "",
    address: "",
    city: "",
    country: "",
    description: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const organizationTypes = [
    { value: "educational", label: "Educational Institute" },
    { value: "corporate", label: "Corporate Organization" },
    { value: "non_profit", label: "Non-Profit Organization" },
    { value: "government", label: "Government Agency" },
    { value: "other", label: "Other" }
  ];

  const employeeRanges = [
    { value: "1-10", label: "1-10 employees" },
    { value: "11-50", label: "11-50 employees" },
    { value: "51-200", label: "51-200 employees" },
    { value: "201-500", label: "201-500 employees" },
    { value: "501-1000", label: "501-1000 employees" },
    { value: "1000+", label: "1000+ employees" }
  ];

  const jobTitles = [
    { value: "Principal", label: "Principal" },
    { value: "CEO", label: "CEO" },
    { value: "Director", label: "Director" },
    { value: "President", label: "President" },
    { value: "Head", label: "Head of Organization" },
    { value: "Founder", label: "Founder" },
    { value: "Other", label: "Other" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match", {
        description: "Please make sure your passwords match.",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password too short", {
        description: "Password must be at least 8 characters long.",
      });
      return;
    }

    if (!formData.organizationName || !formData.contactPerson) {
      toast.error("Missing information", {
        description: "Please provide organization name and contact person.",
      });
      return;
    }

    setLoading(true);

    try {
      // Create auth user for the super admin
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            organization_name: formData.organizationName,
            contact_person: formData.contactPerson,
            user_type: "organization_admin"
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`,
        }
      });

      if (authError) {
        toast.error("Registration Failed", {
          description: authError.message,
        });
        return;
      }

      if (authData.user) {
        // First, create the organization
        const slug = formData.organizationName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: formData.organizationName,
            slug: slug,
            website: formData.website || null,
            contact_email: formData.email,
            phone_number: formData.phoneNumber || null,
            organization_type: formData.organizationType,
            employee_count_range: formData.employeeCount || null,
            address: formData.address ? {
              street: formData.address,
              city: formData.city,
              country: formData.country
            } : null,
            description: formData.description || null,
            is_active: true,
            is_verified: false,
            created_by: authData.user.id,
            metadata: {
              registration_source: "web",
              registration_date: new Date().toISOString(),
              employee_range: formData.employeeCount
            }
          })
          .select()
          .single();

        if (orgError) {
          console.error('Organization creation error:', orgError);
          toast.error("Organization Creation Failed", {
            description: "Account created but organization setup failed. Please contact support.",
          });
          return;
        }

        // Create organization settings
        await supabase
          .from('organization_settings')
          .insert({
            organization_id: orgData.id,
            settings: {
              allow_member_invites: true,
              require_approval: false,
              max_members: null,
              allowed_domains: [],
              theme: "default",
              features: {
                alumni_network: true,
                events: true,
                job_postings: true,
                donations: true
              }
            }
          });

        // Create default roles for the organization
        await supabase.rpc('create_default_organization_roles', { org_id: orgData.id });

        // Get the super admin role
        const { data: superAdminRole } = await supabase
          .from('organization_roles')
          .select('id')
          .eq('organization_id', orgData.id)
          .eq('name', 'super_admin')
          .single();

        // Create user profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            auth_user_id: authData.user.id,
            email: formData.email,
            full_name: formData.contactPerson,
            primary_organization_id: orgData.id,
            user_type: 'admin',
            headline: formData.jobTitle,
            is_active: true,
            is_verified: false,
            metadata: {
              registration_source: "web",
              registration_date: new Date().toISOString(),
              organization_role: "super_admin"
            }
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          toast.error("Profile Creation Failed", {
            description: "Organization created but profile setup failed.",
          });
        }

        // Create organization member record for super admin
        const { error: memberError } = await supabase
          .from('organization_members')
          .insert({
            organization_id: orgData.id,
            user_id: authData.user.id,
            role_id: superAdminRole.id,
            title: formData.jobTitle,
            is_active: true,
            is_verified: true,
            membership_status: 'active',
            metadata: {
              is_creator: true,
              registration_date: new Date().toISOString()
            }
          });

        if (memberError) {
          console.error('Member creation error:', memberError);
        }

        toast.success("Organization Registered Successfully!", {
          description: authData.session
            ? "You have been automatically signed in as Super Admin."
            : "Please check your email to verify your account.",
          action: authData.session ? {
            label: "Go to Dashboard",
            onClick: () => router.push('/organization/dashboard')
          } : undefined,
        });

        if (authData.session) {
          router.push('/organization/dashboard');
        } else {
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative w-24 h-24 flex items-center justify-center group">
              <Image
                src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/public/Assets/logo.png`}
                alt="Alumni Connect Logo"
                fill
                priority
                className="object-contain transition-transform duration-300 group-hover:scale-105"
                unoptimized
                sizes="96px"
              />
            </div>
          </div>
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Building2 className="h-6 w-6" />
            Register Your Organization
          </CardTitle>
          <CardDescription>
            Create your organization account and set up your hierarchical member system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organization Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organization Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="organizationName">Organization Name *</Label>
                  <Input
                    id="organizationName"
                    placeholder="University of Example"
                    value={formData.organizationName}
                    onChange={(e) => handleInputChange('organizationName', e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="organizationType">Organization Type *</Label>
                  <Select
                    value={formData.organizationType}
                    onValueChange={(value) => handleInputChange('organizationType', value)}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizationTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Official Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@organization.edu"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="employeeCount">Organization Size</Label>
                  <Select
                    value={formData.employeeCount}
                    onValueChange={(value) => handleInputChange('employeeCount', value)}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {employeeRanges.map(range => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contact Person (Super Admin) */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Super Administrator Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    placeholder="John Smith"
                    value={formData.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Your Position *</Label>
                  <Select
                    value={formData.jobTitle}
                    onValueChange={(value) => handleInputChange('jobTitle', value)}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobTitles.map(title => (
                        <SelectItem key={title.value} value={title.value}>
                          {title.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Additional Information
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://www.organization.edu"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="123 Organization Street"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="New York"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    placeholder="United States"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Organization Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of your organization, mission, and values..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  disabled={loading}
                  rows={3}
                />
              </div>
            </div>

            {/* Security */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Security
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password (min. 8 characters)"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                      disabled={loading}
                      minLength={8}
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
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
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
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Organization Account...
                </>
              ) : (
                <>
                  <Building2 className="mr-2 h-4 w-4" />
                  Register Organization
                </>
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Already Registered?
              </span>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/auth/organization-login"
              className="text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
            >
              <Button variant="outline" className="w-full">
                <Users className="mr-2 h-4 w-4" />
                Sign in to Organization Account
              </Button>
            </Link>
          </div>

          <div className="mt-6 text-center text-sm">
            Looking for individual account?{" "}
            <Link
              href="/auth/register"
              className="text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
            >
              Register as Individual
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