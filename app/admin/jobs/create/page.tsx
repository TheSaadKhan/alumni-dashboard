"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CreateJobPage() {
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    company_name: "",
    location: "",
    employment_type: "full-time",
    salary_range: "",
    requirements: [] as string[],
    status: "draft",
  });
  const [requirementInput, setRequirementInput] = useState("");

  useEffect(() => {
    async function loadOrg() {
      if (!user) return;
      try {
        const orgsRes = await fetch("/api/organizations");
        if (orgsRes.ok) {
          const orgsData = await orgsRes.json();
          if (orgsData.organizations && orgsData.organizations.length > 0) {
            setOrganizationId(orgsData.organizations[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load organization:", err);
      }
    }
    loadOrg();
  }, [user]);

  const addRequirement = () => {
    if (requirementInput.trim()) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, requirementInput.trim()],
      });
      setRequirementInput("");
    }
  };

  const removeRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) {
      toast.error("Organization not found");
      return;
    }

    if (!formData.title || !formData.description) {
      toast.error("Title and description are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          ...formData,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create job");
      }

      toast.success("Job posted successfully!");
      router.push("/admin/jobs");
    } catch (err: any) {
      toast.error(err.message || "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Post Job</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create a new job posting</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>Fill in the information for the job posting</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Senior Software Engineer"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Job description..."
                  rows={6}
                  required
                />
              </div>

              <div>
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Company Inc."
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="San Francisco, CA or Remote"
                />
              </div>

              <div>
                <Label htmlFor="employment_type">Employment Type</Label>
                <Select
                  value={formData.employment_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, employment_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="salary_range">Salary Range</Label>
                <Input
                  id="salary_range"
                  value={formData.salary_range}
                  onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                  placeholder="$100,000 - $150,000"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label>Requirements</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={requirementInput}
                    onChange={(e) => setRequirementInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addRequirement();
                      }
                    }}
                    placeholder="Add requirement..."
                  />
                  <Button type="button" onClick={addRequirement} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="mt-2 space-y-2">
                  {formData.requirements.map((req, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                    >
                      <span className="text-sm">{req}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRequirement(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post Job"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

