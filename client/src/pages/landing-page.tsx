import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function LandingPage() {

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
              onClick={() => window.location.href = 'mailto:support@entourageit.com?subject=Technology Assessment Request'}
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

      {/* CTA Section */}
      <section id="request-cta" className="py-16 bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-center mb-6 text-white">Ready to Optimize Your Technology?</h2>
            <p className="text-slate-300 mb-8 text-lg">
              Get in touch with our team to schedule your personalized technology assessment and discover opportunities for improvement.
            </p>
            <Button 
              size="lg" 
              className="bg-primary-600 hover:bg-primary-700"
              onClick={() => window.location.href = 'mailto:support@entourageit.com?subject=Technology Assessment Request'}
            >
              Contact Us Today
            </Button>
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
                A comprehensive technology assessment platform helping businesses
                optimize their IT infrastructure, security, and performance.
              </p>
            </div>
            <div className="flex flex-col md:items-end">
              <h3 className="text-lg font-semibold mb-2">Contact Us</h3>
              <p className="text-slate-300">Email: support@entourageit.com</p>
              <div className="mt-4">
                <Link href="/auth" className="text-slate-300 hover:text-white">
                  Login
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