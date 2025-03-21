import { useEffect } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Mail } from "lucide-react";

// Login form schema - using the same schema from useAuth
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user, loginMutation } = useAuth();
  
  // Redirect to home page if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);
  
  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Handle login submission
  const onLoginSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="flex flex-col md:flex-row max-w-6xl w-full rounded-xl overflow-hidden shadow-xl">
        {/* Left column: Auth form */}
        <div className="w-full md:w-1/2 bg-slate-800 p-6">
          <div className="flex items-center mb-8">
            <Shield className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-2xl font-bold text-white">Entourage Sentry</h1>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                            <Input
                              type="email"
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
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                            <Input
                              type="password"
                              placeholder="Enter your password"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        {/* Right column: Hero section */}
        <div className="hidden md:flex md:w-1/2 bg-primary-900/50 items-center justify-center p-12">
          <div className="max-w-md">
            <div className="mb-6 p-3 inline-block rounded-full bg-primary/20">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-white">
              Comprehensive Client Assessment Platform
            </h2>
            <p className="text-lg text-slate-300 mb-6">
              Streamline your domain reconnaissance, inventory services, track costs, and identify
              pain points with our advanced platform designed specifically for MSPs.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">Domain Intelligence</h3>
                <p className="text-sm text-slate-300">
                  Automated domain analysis with insights into email security, hosting, and technology stack.
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">Service Inventory</h3>
                <p className="text-sm text-slate-300">
                  Track client services and manage costs in a centralized dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}