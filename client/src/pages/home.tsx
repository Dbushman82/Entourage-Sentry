import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PlusCircle,
  Search,
  Shield,
  BarChart4,
  Users,
  Building,
  Router,
  FileCheck,
  Clock,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import NewAssessmentDialog from "@/components/NewAssessmentDialog";

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [, setLocation] = useLocation();
  
  // Event listener for dialog open requests
  useEffect(() => {
    const handleOpenDialog = () => setIsDialogOpen(true);
    window.addEventListener('open-assessment-dialog', handleOpenDialog);
    
    return () => {
      window.removeEventListener('open-assessment-dialog', handleOpenDialog);
    };
  }, []);
  
  // Query to get assessments
  const { data: assessments, isLoading } = useQuery({
    queryKey: ['/api/assessments'],
  });
  
  // Filter assessments based on search query
  const filteredAssessments = assessments ? 
    Array.isArray(assessments) ? 
      assessments.filter((assessment: any) => {
        const queryLower = searchQuery.toLowerCase();
        return (
          assessment.referenceCode?.toLowerCase().includes(queryLower) ||
          (assessment.companyName && assessment.companyName.toLowerCase().includes(queryLower))
        );
      }) : [] : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Entourage Sentry</h1>
            <p className="text-slate-400">Powered by Entourage IT</p>
          </div>
          <Button 
            className="bg-primary-600 hover:bg-primary-700" 
            onClick={() => setIsDialogOpen(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Assessment
          </Button>
        </div>
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <div className="w-8 h-8 rounded-full bg-primary-900/50 flex items-center justify-center mb-2">
                <FileCheck className="h-4 w-4 text-primary-500" />
              </div>
              <CardTitle className="text-white text-lg">Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {isLoading ? <Skeleton className="h-8 w-16 bg-slate-700" /> : 
                assessments && Array.isArray(assessments) ? assessments.length : 0}
              </div>
              <p className="text-slate-400 text-sm">Total assessments</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <div className="w-8 h-8 rounded-full bg-emerald-900/50 flex items-center justify-center mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <CardTitle className="text-white text-lg">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {isLoading ? <Skeleton className="h-8 w-16 bg-slate-700" /> : 
                assessments && Array.isArray(assessments) ? 
                assessments.filter((a: any) => a.status === 'completed').length : 0}
              </div>
              <p className="text-slate-400 text-sm">Completed assessments</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <div className="w-8 h-8 rounded-full bg-amber-900/50 flex items-center justify-center mb-2">
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <CardTitle className="text-white text-lg">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {isLoading ? <Skeleton className="h-8 w-16 bg-slate-700" /> : 
                assessments && Array.isArray(assessments) ? 
                assessments.filter((a: any) => a.status === 'in_progress').length : 0}
              </div>
              <p className="text-slate-400 text-sm">In-progress assessments</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <div className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center mb-2">
                <Layers className="h-4 w-4 text-blue-500" />
              </div>
              <CardTitle className="text-white text-lg">Core Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">3</div>
              <p className="text-slate-400 text-sm">Most requested services</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Search and Filters */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <Input
              placeholder="Search assessments by reference code, company name or contact..."
              className="pl-10 bg-slate-800 border-slate-700 text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Assessments Table */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Assessments</CardTitle>
            <CardDescription className="text-slate-400">
              View and manage your client assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="border border-slate-700 rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <Skeleton className="h-6 w-32 bg-slate-700" />
                      <Skeleton className="h-6 w-24 bg-slate-700" />
                    </div>
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-48 bg-slate-700" />
                      <Skeleton className="h-4 w-16 bg-slate-700" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredAssessments.length === 0 ? (
              <div className="text-center p-8">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center mb-4">
                  <FileCheck className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No assessments found</h3>
                <p className="text-slate-400 mb-4">
                  {searchQuery ? 
                    "No assessments match your search criteria. Try a different search." : 
                    "Start by creating your first client assessment."}
                </p>
                {!searchQuery && (
                  <Button className="bg-primary-600 hover:bg-primary-700" asChild>
                    <div onClick={() => setIsDialogOpen(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      New Assessment
                    </div>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAssessments.slice().reverse().map((assessment: any) => {
                  const createdAt = new Date(assessment.createdAt);
                  const isCompleted = assessment.status === 'completed';
                  
                  return (
                    <div 
                      key={assessment.id} 
                      className="border border-slate-700 hover:border-primary-500 rounded-md p-4 transition-colors"
                      onClick={() => setLocation(`/assessment/${assessment.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium text-white flex items-center">
                          <Building className="h-4 w-4 mr-2" />
                          <span>{assessment.companyName || 'Unnamed Company'}</span>
                          <Badge 
                            className={`ml-3 ${isCompleted ? 'bg-emerald-600' : 'bg-amber-600'}`}
                          >
                            {isCompleted ? 'Completed' : `Step ${assessment.currentStep} of 7`}
                          </Badge>
                        </div>
                        <span className="text-sm text-slate-400">{formatDistanceToNow(createdAt, { addSuffix: true })}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-slate-400 text-sm flex items-center">
                          <span className="font-mono text-xs">{assessment.referenceCode}</span>
                          <span className="mx-2">•</span>
                          <Users className="h-4 w-4 mr-1" />
                          <span>Contact ID: {assessment.contactId}</span>
                        </div>
                        <span className="text-primary-500 text-sm">View details →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
          {filteredAssessments.length > 0 && (
            <CardFooter className="border-t border-slate-700 p-4 justify-between">
              <div className="text-sm text-slate-400">
                Showing {filteredAssessments.length} of {filteredAssessments.length} assessments
              </div>
              <Button 
                variant="outline" 
                className="border-slate-600 hover:border-slate-500" 
                onClick={() => setIsDialogOpen(true)}
              >
                New Assessment
              </Button>
            </CardFooter>
          )}
        </Card>
        
        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="w-10 h-10 rounded-full bg-primary-900/50 flex items-center justify-center mb-2">
                <Shield className="h-5 w-5 text-primary-500" />
              </div>
              <CardTitle className="text-white">Domain Reconnaissance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Automatically gather detailed information about your prospect's domain including DNS, email security, and hosting information.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="w-10 h-10 rounded-full bg-primary-900/50 flex items-center justify-center mb-2">
                <Router className="h-5 w-5 text-primary-500" />
              </div>
              <CardTitle className="text-white">Network Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Gather comprehensive network information with browser-based scanning, downloadable tools, or guided manual entry.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="w-10 h-10 rounded-full bg-primary-900/50 flex items-center justify-center mb-2">
                <BarChart4 className="h-5 w-5 text-primary-500" />
              </div>
              <CardTitle className="text-white">Cost Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Track IT expenses, identify cost-saving opportunities, and benchmark against industry standards for optimized spending.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
      
      {/* Assessment Dialog */}
      <NewAssessmentDialog 
        open={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
      />
    </div>
  );
};

export default Home;
