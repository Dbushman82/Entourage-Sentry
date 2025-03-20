import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  Trash2,
  Link2,
  Copy,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import NewAssessmentDialog from "@/components/NewAssessmentDialog";

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Event listener for dialog open requests
  useEffect(() => {
    const handleOpenDialog = () => setIsDialogOpen(true);
    window.addEventListener('open-assessment-dialog', handleOpenDialog);
    
    return () => {
      window.removeEventListener('open-assessment-dialog', handleOpenDialog);
    };
  }, []);
  
  // Query to get assessments with error handling
  const { data: assessments, isLoading, error: assessmentsError } = useQuery({
    queryKey: ['/api/assessments'],
    retry: 3, // Retry 3 times before failing
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000) // Exponential backoff
  });

  // Handle assessment loading errors
  React.useEffect(() => {
    if (assessmentsError) {
      console.error("Error fetching assessments:", assessmentsError);
      const errorMessage = assessmentsError.message.toLowerCase();
      if (
        errorMessage.includes("database") || 
        errorMessage.includes("connection") || 
        errorMessage.includes("terminating")
      ) {
        toast({
          title: "Database Connection Error",
          description: "There was a problem connecting to the database. Please refresh the page to try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error Loading Assessments",
          description: assessmentsError.message,
          variant: "destructive",
        });
      }
    }
  }, [assessmentsError, toast]);
  
  // Delete assessment mutation
  const deleteAssessmentMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/assessments/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Assessment deleted",
        description: "The assessment has been deleted successfully",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/assessments'] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      console.error("Error deleting assessment:", error);
      const errorMessage = error.message.toLowerCase();
      if (
        errorMessage.includes("database") || 
        errorMessage.includes("connection") || 
        errorMessage.includes("terminating")
      ) {
        toast({
          title: "Database Connection Error",
          description: "There was a problem connecting to the database. Please try again in a moment.",
          variant: "destructive",
        });
        
        // Automatically invalidate the query to force a refresh
        queryClient.invalidateQueries({ queryKey: ['/api/assessments'] });
      } else {
        toast({
          title: "Error deleting assessment",
          description: error.message || "An error occurred while deleting the assessment",
          variant: "destructive"
        });
      }
    }
  });
  
  // Generate/renew assessment link mutation
  const generateLinkMutation = useMutation({
    mutationFn: async ({ id, renew = false }: { id: number, renew?: boolean }) => {
      const endpoint = renew 
        ? `/api/assessments/${id}/link/renew` 
        : `/api/assessments/${id}/link`;
        
      const res = await apiRequest('POST', endpoint, { expirationDuration: '7d' });
      return res.json();
    },
    onSuccess: (data) => {
      // Copy link to clipboard
      if (data && data.url) {
        navigator.clipboard.writeText(data.url)
          .then(() => {
            toast({
              title: "Link copied to clipboard",
              description: "Assessment link has been copied to your clipboard",
              variant: "default"
            });
          })
          .catch(() => {
            toast({
              title: "Couldn't copy to clipboard",
              description: "Please copy the link manually",
              variant: "destructive"
            });
          });
      }
    },
    onError: (error: Error) => {
      console.error("Error generating link:", error);
      const errorMessage = error.message.toLowerCase();
      if (
        errorMessage.includes("database") || 
        errorMessage.includes("connection") || 
        errorMessage.includes("terminating")
      ) {
        toast({
          title: "Database Connection Error",
          description: "There was a problem connecting to the database. Please try again in a moment.",
          variant: "destructive",
        });
        
        // Automatically invalidate the query to force a refresh
        queryClient.invalidateQueries({ queryKey: ['/api/assessments'] });
      } else {
        toast({
          title: "Error generating link",
          description: error.message || "An error occurred while generating the assessment link",
          variant: "destructive"
        });
      }
    }
  });
  
  // Duplicate assessment mutation
  const duplicateAssessmentMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/assessments/${id}/duplicate`);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Assessment duplicated",
        description: "The assessment has been duplicated successfully",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/assessments'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error duplicating assessment",
        description: error.message || "An error occurred while duplicating the assessment",
        variant: "destructive"
      });
    }
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
                      className="border border-slate-700 hover:border-primary-500 rounded-md p-4 transition-colors relative"
                    >
                      <div 
                        className="absolute right-3 top-3 z-10 flex space-x-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isCompleted && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 bg-slate-700 text-slate-300 hover:text-white hover:bg-primary-600"
                            title="View Assessment Summary"
                            onClick={() => {
                              setLocation(`/assessment-summary/${assessment.id}`);
                            }}
                          >
                            <FileCheck className="h-4 w-4" />
                            <span className="sr-only">View Summary</span>
                          </Button>
                        )}
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 bg-slate-700 text-slate-300 hover:text-white hover:bg-slate-600"
                          title={assessment.linkToken ? "Renew & Copy Link" : "Generate & Copy Link"}
                          onClick={() => {
                            generateLinkMutation.mutate({ 
                              id: assessment.id, 
                              renew: assessment.linkToken ? true : false 
                            });
                          }}
                        >
                          <Link2 className="h-4 w-4" />
                          <span className="sr-only">Copy Link</span>
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 bg-slate-700 text-slate-300 hover:text-white hover:bg-slate-600"
                          title="Duplicate Assessment"
                          onClick={() => {
                            duplicateAssessmentMutation.mutate(assessment.id);
                          }}
                        >
                          <Copy className="h-4 w-4" />
                          <span className="sr-only">Duplicate</span>
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 bg-slate-700 text-slate-300 hover:text-white hover:bg-destructive"
                          title="Delete Assessment"
                          onClick={() => {
                            setSelectedAssessment(assessment);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                      
                      <div 
                        className="flex flex-col pr-20" 
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
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assessment</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete this assessment? This action cannot be undone.
              {selectedAssessment && (
                <div className="mt-2 p-3 border border-slate-700 rounded-md bg-slate-900">
                  <div className="font-medium text-white">
                    {selectedAssessment.companyName || 'Unnamed Company'}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-mono">
                    {selectedAssessment.referenceCode}
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-slate-600 text-white hover:bg-slate-700 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() => {
                if (selectedAssessment) {
                  deleteAssessmentMutation.mutate(selectedAssessment.id);
                }
              }}
              disabled={deleteAssessmentMutation.isPending}
            >
              {deleteAssessmentMutation.isPending ? "Deleting..." : "Delete Assessment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Home;
