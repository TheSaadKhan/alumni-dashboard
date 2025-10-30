"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Heart, GraduationCap, Users, BookOpen } from "lucide-react";

export default function DonatePage() {
  const [amount, setAmount] = useState("50");
  const [customAmount, setCustomAmount] = useState("");
  const [frequency, setFrequency] = useState("one-time");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle donation submission
    const donationAmount = customAmount || amount;
    console.log({ amount: donationAmount, frequency });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Support Your Alma Mater
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Your contribution helps create opportunities for current students and strengthens our alumni community.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Donation Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Make a Difference
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Amount Selection */}
                  <div>
                    <Label className="text-lg font-semibold mb-4 block">
                      Select Amount
                    </Label>
                    <RadioGroup value={amount} onValueChange={setAmount} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {["25", "50", "100", "250"].map((value) => (
                        <div key={value}>
                          <RadioGroupItem value={value} id={`amount-${value}`} className="sr-only" />
                          <Label
                            htmlFor={`amount-${value}`}
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                          >
                            <span className="text-xl font-bold">${value}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    
                    <div className="mt-4">
                      <Label htmlFor="custom-amount" className="block mb-2">
                        Or enter custom amount
                      </Label>
                      <Input
                        id="custom-amount"
                        type="number"
                        placeholder="Enter amount"
                        value={customAmount}
                        onChange={(e) => {
                          setCustomAmount(e.target.value);
                          setAmount("");
                        }}
                      />
                    </div>
                  </div>

                  {/* Frequency */}
                  <div>
                    <Label className="text-lg font-semibold mb-4 block">
                      Frequency
                    </Label>
                    <RadioGroup value={frequency} onValueChange={setFrequency} className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="one-time" id="one-time" />
                        <Label htmlFor="one-time">One-time</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="monthly" id="monthly" />
                        <Label htmlFor="monthly">Monthly</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yearly" id="yearly" />
                        <Label htmlFor="yearly">Yearly</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white">
                    <Heart className="h-4 w-4 mr-2" />
                    Donate Now
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Impact Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Where Your Donation Goes
                </h3>
                <div className="space-y-4">
                  {impactAreas.map((area, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                        <area.icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {area.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {area.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Donation Impact
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">$50</span>
                    <span className="font-medium">Provides books for a student</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">$100</span>
                    <span className="font-medium">Sponsors a workshop</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">$250</span>
                    <span className="font-medium">Funds a scholarship</span>
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

const impactAreas = [
  {
    icon: GraduationCap,
    title: "Scholarships",
    description: "Support deserving students"
  },
  {
    icon: BookOpen,
    title: "Library Resources",
    description: "Enhance learning materials"
  },
  {
    icon: Users,
    title: "Student Programs",
    description: "Fund extracurricular activities"
  },
  {
    icon: Heart,
    title: "Community Outreach",
    description: "Support local initiatives"
  }
];