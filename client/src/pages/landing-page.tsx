import { useState } from "react";
import { Link } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle } from "lucide-react";

// Form schema for assessment requests
const assessmentRequestSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  companyName: z.string().min(2, "Company name is required"),
  companyWebsite: z.string().min(3, "Company website is required"),
  message: z.string().optional(),
});

type AssessmentRequestFormValues = z.infer<typeof assessmentRequestSchema>;

export default function LandingPage() {
  const { toast } = useToast();
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  // Create form
  const form = useForm<AssessmentRequestFormValues>({
    resolver: zodResolver(assessmentRequestSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      companyName: "",
      companyWebsite: "",
      message: "",
    },
  });

  // Submit assessment request
  const assessmentRequestMutation = useMutation({
    mutationFn: async (data: AssessmentRequestFormValues) => {
      const response = await apiRequest("POST", "/api/assessment-requests", data);
      return response.json();
    },
    onSuccess: () => {
      setRequestSubmitted(true);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error submitting request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: AssessmentRequestFormValues) => {
    assessmentRequestMutation.mutate(values);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="w-full bg-slate-800 text-white p-4 border-b border-slate-700">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-primary"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="text-xl font-bold">Entourage Sentry</span>
          </div>
          <nav>
            <Button variant="ghost" asChild>
              <Link href="/auth">Login</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-primary/90 to-primary/50 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">
              Optimize Your Business Technology
            </h1>
            <p className="text-xl mb-8">
              Get a complete assessment of your IT infrastructure to identify opportunities for cost savings, enhanced security, and performance improvements.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => document.getElementById('request-form')?.scrollIntoView({behavior: 'smooth'})}
            >
              Request Your Free Assessment
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-slate-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">How You'll Benefit</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-4 bg-slate-700 rounded-lg shadow-md">
              <div className="bg-primary/20 p-4 rounded-full mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary h-8 w-8"
                >
                  <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"></path>
                  <path d="M12 2v2"></path>
                  <path d="M12 20v2"></path>
                  <path d="M20 12h2"></path>
                  <path d="M2 12h2"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Cost Optimization</h3>
              <p className="text-slate-300">
                Discover ways to reduce IT expenses by identifying inefficient systems and duplicate services that may be draining your budget.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-slate-700 rounded-lg shadow-md">
              <div className="bg-primary/20 p-4 rounded-full mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary h-8 w-8"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <path d="M12 8v8"></path>
                  <path d="M8 12h8"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Security Enhancement</h3>
              <p className="text-slate-300">
                Protect your business from cyber threats by identifying security vulnerabilities before they can be exploited by attackers.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-slate-700 rounded-lg shadow-md">
              <div className="bg-primary/20 p-4 rounded-full mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary h-8 w-8"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Performance Improvement</h3>
              <p className="text-slate-300">
                Identify bottlenecks in your network and systems that are slowing down your business operations and employee productivity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-slate-700">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">Our Assessment Process</h2>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              <div className="flex items-start p-4 bg-slate-600 rounded-lg shadow">
                <CheckCircle className="h-6 w-6 text-primary mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold mb-1 text-white">Simple Information Gathering</h3>
                  <p className="text-slate-200">Complete a straightforward assessment that collects essential details about your business technology environment.</p>
                </div>
              </div>
              <div className="flex items-start p-4 bg-slate-600 rounded-lg shadow">
                <CheckCircle className="h-6 w-6 text-primary mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold mb-1 text-white">Expert Analysis</h3>
                  <p className="text-slate-200">Our technology specialists review your information to identify opportunities for improvement and potential risks.</p>
                </div>
              </div>
              <div className="flex items-start p-4 bg-slate-600 rounded-lg shadow">
                <CheckCircle className="h-6 w-6 text-primary mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold mb-1 text-white">Personalized Recommendations</h3>
                  <p className="text-slate-200">Receive a customized report with actionable insights tailored to your specific business needs and budget.</p>
                </div>
              </div>
              <div className="flex items-start p-4 bg-slate-600 rounded-lg shadow">
                <CheckCircle className="h-6 w-6 text-primary mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold mb-1 text-white">No-Pressure Consultation</h3>
                  <p className="text-slate-200">Discuss your results with our team who can answer questions and help you plan your next steps—with no obligation.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Request Form Section */}
      <section id="request-form" className="py-16 bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-white">Request an Assessment</h2>
            
            {requestSubmitted ? (
              <Card className="border-green-600 bg-green-900/20 text-white">
                <CardHeader>
                  <div className="flex items-center justify-center mb-4">
                    <CheckCircle className="h-16 w-16 text-green-400" />
                  </div>
                  <CardTitle className="text-center text-2xl">Request Submitted Successfully!</CardTitle>
                  <CardDescription className="text-center text-lg text-slate-300">
                    Thank you for your interest in Entourage Sentry.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-slate-300 mb-4">
                    Our team will review your request within 24 hours and contact you to discuss the next steps.
                  </p>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setRequestSubmitted(false)}
                  >
                    Submit Another Request
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <Card className="bg-slate-800 border-slate-700 text-white">
                <CardHeader>
                  <CardTitle>Assessment Request Form</CardTitle>
                  <CardDescription className="text-slate-300">
                    Fill out the form below to request a comprehensive technology assessment for your business.
                    All requests are reviewed within 24 hours.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-200">First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John" {...field} className="bg-slate-700 border-slate-600" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-200">Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Doe" {...field} className="bg-slate-700 border-slate-600" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-200">Email</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="john.doe@example.com"
                                  {...field}
                                  className="bg-slate-700 border-slate-600"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-200">Phone (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="(555) 123-4567" {...field} className="bg-slate-700 border-slate-600" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator className="bg-slate-600" />

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="companyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-200">Company Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Acme Inc." {...field} className="bg-slate-700 border-slate-600" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="companyWebsite"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-200">Company Website</FormLabel>
                              <FormControl>
                                <Input placeholder="https://example.com" {...field} className="bg-slate-700 border-slate-600" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-200">Additional Information (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell us about your specific needs or concerns"
                                className="resize-none bg-slate-700 border-slate-600"
                                rows={4}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-slate-400">
                              Share any specific areas you'd like the assessment to focus on.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={assessmentRequestMutation.isPending}
                      >
                        {assessmentRequestMutation.isPending
                          ? "Submitting..."
                          : "Submit Request"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span className="text-lg font-bold">Entourage Sentry</span>
              </div>
              <p className="text-slate-300 max-w-md">
                A comprehensive client assessment platform for Managed Service
                Providers, leveraging advanced data enrichment and network
                reconnaissance technologies.
              </p>
            </div>
            <div className="flex flex-col md:items-end">
              <h3 className="text-lg font-semibold mb-2">Contact Us</h3>
              <p className="text-slate-300">Email: support@entourageit.com</p>
              <div className="mt-4">
                <Link href="/auth" className="text-slate-300 hover:text-white">
                  Partner Login
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-4 text-center text-slate-400">
            <p>&copy; {new Date().getFullYear()} Entourage IT. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}