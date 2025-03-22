import { useState } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle2, 
  Shield, 
  BarChart,
  Lock, 
  Search,
  Clock,
  FileText,
  Mail
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Form schema for prospect assessment request
const assessmentRequestSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  companyName: z.string().min(2, "Company name is required"),
  companyWebsite: z.string().url("Please enter a valid URL").optional(),
  message: z.string().optional(),
});

type AssessmentRequestFormValues = z.infer<typeof assessmentRequestSchema>;

export default function LandingPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  
  // Form setup
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
  
  // Request mutation
  const requestMutation = useMutation({
    mutationFn: async (data: AssessmentRequestFormValues) => {
      const res = await apiRequest("POST", "/api/assessment-requests", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to submit request");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Request submitted",
        description: "Thank you for your interest. We'll get back to you shortly.",
      });
      setSubmitted(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: AssessmentRequestFormValues) => {
    requestMutation.mutate(values);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary/90 text-white">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center">
            <Shield className="h-8 w-8 mr-2" />
            <h1 className="text-xl font-bold">Entourage Sentry</h1>
          </div>
          <div className="space-x-4">
            <Button 
              variant="outline" 
              onClick={() => navigate("/auth")}
              className="text-white border-white hover:bg-white hover:text-primary"
            >
              Login
            </Button>
          </div>
        </div>
      </header>
      
      {/* Hero section */}
      <section className="bg-primary text-white py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Comprehensive Client Assessment Platform
              </h1>
              <p className="text-xl mb-8">
                Gain valuable insights into your organization's technology infrastructure, 
                security posture, and optimization opportunities.
              </p>
              <Button 
                size="lg"
                className="bg-white text-primary hover:bg-white/90"
                onClick={() => {
                  const requestFormElement = document.getElementById('request-form');
                  requestFormElement?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Request an Assessment
              </Button>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="bg-white/10 p-8 rounded-lg max-w-md">
                <Shield className="h-20 w-20 mb-6 mx-auto" />
                <h3 className="text-2xl font-bold text-center mb-4">
                  Client Sentry Assessment
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-6 w-6 mr-2 flex-shrink-0" />
                    <span>Comprehensive security and infrastructure analysis</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-6 w-6 mr-2 flex-shrink-0" />
                    <span>Domain intelligence and technology stack insights</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-6 w-6 mr-2 flex-shrink-0" />
                    <span>Cost optimization recommendations</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-6 w-6 mr-2 flex-shrink-0" />
                    <span>Tailored service recommendations</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="rounded-full bg-primary/10 p-3 w-fit mb-4">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Security Assessment</h3>
                <p className="text-slate-600">
                  Identify vulnerabilities, security gaps, and compliance issues in your
                  digital infrastructure.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="rounded-full bg-primary/10 p-3 w-fit mb-4">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Domain Intelligence</h3>
                <p className="text-slate-600">
                  Gather insights about your online presence, tech stack, and digital footprint.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="rounded-full bg-primary/10 p-3 w-fit mb-4">
                  <BarChart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Cost Analysis</h3>
                <p className="text-slate-600">
                  Discover optimization opportunities and track technology spending across your organization.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="rounded-full bg-primary/10 p-3 w-fit mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Time-Limited Access</h3>
                <p className="text-slate-600">
                  Secure, time-limited assessment links ensure your data remains protected.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="rounded-full bg-primary/10 p-3 w-fit mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Comprehensive Reports</h3>
                <p className="text-slate-600">
                  Detailed reports with actionable recommendations and visual data presentation.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="rounded-full bg-primary/10 p-3 w-fit mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">MSP-Ready Insights</h3>
                <p className="text-slate-600">
                  Tailored insights for Managed Service Providers to better serve their clients.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* How it works section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="rounded-full bg-primary/10 p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Request Assessment</h3>
              <p className="text-slate-600">
                Fill out the form to request your personalized assessment.
              </p>
            </div>
            
            <div className="text-center">
              <div className="rounded-full bg-primary/10 p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Receive Access Link</h3>
              <p className="text-slate-600">
                Get a secure, time-limited link to complete your assessment.
              </p>
            </div>
            
            <div className="text-center">
              <div className="rounded-full bg-primary/10 p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Complete Assessment</h3>
              <p className="text-slate-600">
                Answer questions about your organization and infrastructure.
              </p>
            </div>
            
            <div className="text-center">
              <div className="rounded-full bg-primary/10 p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold text-xl">4</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Review Insights</h3>
              <p className="text-slate-600">
                Get detailed analysis and recommendations for improvement.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Request form section */}
      <section id="request-form" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">Request an Assessment</h2>
            <p className="text-center text-slate-600 mb-12">
              Fill out the form below to request your personalized Entourage Sentry assessment.
            </p>
            
            {submitted ? (
              <div className="text-center p-8 bg-white rounded-lg shadow-sm border">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Thank You!</h3>
                <p className="text-slate-600 mb-6">
                  Your assessment request has been submitted successfully. Our team will review 
                  your information and contact you shortly.
                </p>
                <Button
                  onClick={() => setSubmitted(false)}
                  variant="outline"
                >
                  Submit Another Request
                </Button>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your first name" {...field} />
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
                                <Input placeholder="Enter your last name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                  <Input
                                    placeholder="Enter your email"
                                    className="pl-10"
                                    {...field}
                                  />
                                </div>
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
                                <Input placeholder="Enter your phone number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="companyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your company name" {...field} />
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
                              <FormLabel>Company Website (Optional)</FormLabel>
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
                                placeholder="Tell us about any specific areas of interest or concerns"
                                className="min-h-[120px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        size="lg"
                        disabled={requestMutation.isPending}
                      >
                        {requestMutation.isPending ? "Submitting..." : "Submit Request"}
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
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <Shield className="h-8 w-8 mr-2" />
              <span className="text-xl font-bold">Entourage Sentry</span>
            </div>
            <div className="text-center md:text-right">
              <p>© {new Date().getFullYear()} Entourage IT. All rights reserved.</p>
              <p className="text-slate-400 mt-2">
                Contact: <a href="mailto:support@entourageit.com" className="underline">support@entourageit.com</a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}