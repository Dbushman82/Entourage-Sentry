import { useState } from "react";
import { Link } from "wouter";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  MoreVertical,
  Link2,
  Eye,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import AssessmentLinkGenerator from "@/components/admin/AssessmentLinkGenerator";
import NewAssessmentDialog from "../components/NewAssessmentDialog";

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showNewAssessmentDialog, setShowNewAssessmentDialog] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  
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
          // We would normally include company name, contact name, etc. in the search
          // But our backend doesn't return related data in the assessments list endpoint
          false
        );
      }) : [] : [];

  // Handle Link Generation Dialog
  const handleGenerateLink = (assessment: any) => {
    setSelectedAssessment(assessment);
    setShowLinkDialog(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-slate-400">Manage your client assessments</p>
          </div>
          <Button className="bg-primary-600 hover:bg-primary-700" onClick={() => setShowNewAssessmentDialog(true)}>
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
                <Link2 className="h-4 w-4 text-blue-500" />
              </div>
              <CardTitle className="text-white text-lg">Active Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {isLoading ? <Skeleton className="h-8 w-16 bg-slate-700" /> : 
                assessments && Array.isArray(assessments) ? 
                assessments.filter((a: any) => a.linkToken && new Date(a.linkExpiration) > new Date()).length : 0}
              </div>
              <p className="text-slate-400 text-sm">Shareable assessment links</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Search and Filters */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <Input
              placeholder="Search assessments by reference code..."
              className="pl-10 bg-slate-800 border-slate-700 text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Assessments Table */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Client Assessments</CardTitle>
            <CardDescription className="text-slate-400">
              View, share and manage your client assessments
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
                  <Button 
                    className="bg-primary-600 hover:bg-primary-700" 
                    onClick={() => setShowNewAssessmentDialog(true)}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Assessment
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAssessments.slice().reverse().map((assessment: any) => {
                  const createdAt = new Date(assessment.createdAt);
                  const isCompleted = assessment.status === 'completed';
                  const hasActiveLink = assessment.linkToken && 
                    assessment.linkExpiration && 
                    new Date(assessment.linkExpiration) > new Date();
                  
                  return (
                    <div key={assessment.id} className="border border-slate-700 rounded-md p-4 transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium text-white flex items-center">
                          <span className="font-mono">{assessment.referenceCode}</span>
                          <Badge 
                            className={`ml-3 ${isCompleted ? 'bg-emerald-600' : 'bg-amber-600'}`}
                          >
                            {isCompleted ? 'Completed' : `Step ${assessment.currentStep} of 7`}
                          </Badge>
                          {hasActiveLink && (
                            <Badge className="ml-2 bg-blue-600">
                              Link Active
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm text-slate-400 mr-3">{formatDistanceToNow(createdAt, { addSuffix: true })}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="hover:bg-slate-700">
                                <MoreVertical className="h-4 w-4 text-slate-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-slate-200">
                              <DropdownMenuItem 
                                className="cursor-pointer hover:bg-slate-700"
                                onClick={() => handleGenerateLink(assessment)}
                              >
                                <Link2 className="h-4 w-4 mr-2" />
                                <span>{hasActiveLink ? 'Manage Link' : 'Generate Link'}</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="cursor-pointer hover:bg-slate-700"
                                asChild
                              >
                                <Link href={`/assessment/${assessment.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  <span>View Details</span>
                                </Link>
                              </DropdownMenuItem>
                              {user?.role === 'admin' && (
                                <DropdownMenuItem 
                                  className="cursor-pointer text-red-400 hover:bg-red-950 hover:text-red-300"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-slate-400 text-sm flex items-center">
                          <Building className="h-4 w-4 mr-1" />
                          <span>Company ID: {assessment.companyId}</span>
                          <span className="mx-2">•</span>
                          <Users className="h-4 w-4 mr-1" />
                          <span>Contact ID: {assessment.contactId}</span>
                        </div>
                        <Link href={`/assessment/${assessment.id}`}>
                          <span className="text-primary-500 text-sm cursor-pointer">View details →</span>
                        </Link>
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
              <Button variant="outline" className="border-slate-600 hover:border-slate-500" disabled>
                View All
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

      {/* Assessment Link Generator Dialog */}
      <Dialog 
        open={showLinkDialog} 
        onOpenChange={(open) => {
          setShowLinkDialog(open);
          if (!open) setSelectedAssessment(null);
        }}
      >
        <DialogContent className="sm:max-w-[600px] bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Assessment Link Management</DialogTitle>
          </DialogHeader>
          {selectedAssessment && (
            <AssessmentLinkGenerator
              assessmentId={selectedAssessment.id}
              referenceCode={selectedAssessment.referenceCode}
              linkToken={selectedAssessment.linkToken}
              linkExpiration={selectedAssessment.linkExpiration}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* New Assessment Dialog */}
      <Dialog
        open={showNewAssessmentDialog}
        onOpenChange={setShowNewAssessmentDialog}
      >
        <DialogContent className="sm:max-w-[600px] bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Create New Assessment</DialogTitle>
          </DialogHeader>
          <NewAssessmentDialog onClose={() => setShowNewAssessmentDialog(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;