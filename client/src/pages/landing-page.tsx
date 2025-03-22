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
              Comprehensive Client Assessment Platform
            </h1>
            <p className="text-xl mb-8">
              Streamline your technology assessments with our powerful, data-enriched platform designed for Managed Service Providers.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => document.getElementById('request-form')?.scrollIntoView({behavior: 'smooth'})}
            >
              Request an Assessment
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-slate-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">Key Platform Features</h2>
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
                  <path d="M20 7h-9"></path>
                  <path d="M14 17H5"></path>
                  <circle cx="17" cy="17" r="3"></circle>
                  <circle cx="7" cy="7" r="3"></circle>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Data Enrichment</h3>
              <p className="text-slate-300">
                Automatically enrich company data with industry, size, and relevant business details to streamline assessments.
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
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Security Assessment</h3>
              <p className="text-slate-300">
                Identify security vulnerabilities, exposed services, and missing security headers to protect your clients.
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
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Client Collaboration</h3>
              <p className="text-slate-300">
                Share secure, time-limited assessment links with clients for easy collaboration and data collection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-slate-700">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">Benefits for MSPs</h2>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              <div className="flex items-start p-4 bg-slate-600 rounded-lg shadow">
                <CheckCircle className="h-6 w-6 text-primary mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold mb-1 text-white">Streamlined Discovery Process</h3>
                  <p className="text-slate-200">Reduce manual data entry and speed up the client onboarding journey.</p>
                </div>
              </div>
              <div className="flex items-start p-4 bg-slate-600 rounded-lg shadow">
                <CheckCircle className="h-6 w-6 text-primary mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold mb-1 text-white">Enhanced Security Insights</h3>
                  <p className="text-slate-200">Identify and prioritize security vulnerabilities to protect client businesses.</p>
                </div>
              </div>
              <div className="flex items-start p-4 bg-slate-600 rounded-lg shadow">
                <CheckCircle className="h-6 w-6 text-primary mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold mb-1 text-white">Comprehensive Service Tracking</h3>
                  <p className="text-slate-200">Document all client services, contracts, and costs to identify optimization opportunities.</p>
                </div>
              </div>
              <div className="flex items-start p-4 bg-slate-600 rounded-lg shadow">
                <CheckCircle className="h-6 w-6 text-primary mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold mb-1 text-white">Professional Reporting</h3>
                  <p className="text-slate-200">Generate branded assessment reports to showcase your expertise and findings.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Request Form Section */}
      <section id="request-form" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Request an Assessment</h2>
            
            {requestSubmitted ? (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <div className="flex items-center justify-center mb-4">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                  </div>
                  <CardTitle className="text-center text-2xl">Request Submitted Successfully!</CardTitle>
                  <CardDescription className="text-center text-lg">
                    Thank you for your interest in Entourage Sentry.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-gray-600 mb-4">
                    Our team will review your request and contact you shortly to discuss the next steps.
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
              <Card>
                <CardHeader>
                  <CardTitle>Assessment Request Form</CardTitle>
                  <CardDescription>
                    Fill out the form below to request a comprehensive technology assessment for your business.
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
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John" {...field} />
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
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Doe" {...field} />
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
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="john.doe@example.com"
                                  {...field}
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
                              <FormLabel>Phone (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="(555) 123-4567" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="companyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Acme Inc." {...field} />
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
                              <FormLabel>Company Website</FormLabel>
                              <FormControl>
                                <Input placeholder="https://example.com" {...field} />
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
                            <FormLabel>Additional Information (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell us about your specific needs or concerns"
                                className="resize-none"
                                rows={4}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
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
                <Link href="/auth">
                  <a className="text-slate-300 hover:text-white">Partner Login</a>
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