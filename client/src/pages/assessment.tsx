import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAssessment } from "@/context/AssessmentContext";
import NDANotice from "@/components/forms/NDANotice";

// Define assessment data interface
interface AssessmentData {
  id: number;
  referenceCode: string;
  contactId: number;
  companyId: number;
  currentStep: number;
  status: string;
}

// Define details data interface
interface AssessmentDetails {
  contact?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    companyWebsite?: string;
  };
  company?: {
    name: string;
    website: string;
    address: string;
    phone: string;
    primaryContact: string;
    industry: string;
    employeeCount: string;
    locationCount: string;
    businessHours: string;
    overview: string;
    compliance: Record<string, boolean>;
    growthPlans: string;
  };
  domainData?: {
    techStack?: string[];
    [key: string]: any;
  };
}
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProgressTracker from "@/components/progress/ProgressTracker";
import ContactInfoStep from "@/components/forms/ContactInfoStep";
import CompanyInfoStep from "@/components/forms/CompanyInfoStep";
import CompanyDetailsStep from "@/components/forms/CompanyDetailsStep";
import TechStackStep from "@/components/forms/TechStackStep";
import NetworkAssessmentStep from "@/components/forms/NetworkAssessmentStep";
import ExpensesStep from "@/components/forms/ExpensesStep";
import SecurityAssessmentStep from "@/components/forms/SecurityAssessmentStep";
import PainPointsStep from "@/components/forms/PainPointsStep";
import SuccessScreen from "@/components/success/SuccessScreen";
import { Skeleton } from "@/components/ui/skeleton";

const Assessment = () => {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { 
    currentStep, setCurrentStep,
    assessment, setAssessment,
    contactData, setContactData,
    companyData, setCompanyData,
    companyProfileData, setCompanyProfileData,
    domainData, setDomainData,
    referenceCode, setReferenceCode
  } = useAssessment();
  
  const [isCompleted, setIsCompleted] = useState(false);
  const [showNDANotice, setShowNDANotice] = useState(false);
  const [pendingContactData, setPendingContactData] = useState<any>(null);
  
  // If we have an assessment ID, load that assessment
  const assessmentId = params.id;
  const { data: assessmentData, isLoading: isLoadingAssessment } = useQuery({
    queryKey: [`/api/assessments/${assessmentId}`],
    enabled: !!assessmentId,
  });
  
  // If we have assessment data, also get the details
  const { data: assessmentDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: [`/api/assessments/${assessmentId}/details`],
    enabled: !!assessmentData,
  });
  
  // Initialize assessment state from loaded data
  useEffect(() => {
    if (assessmentData && assessmentDetails) {
      const typedAssessmentData = assessmentData as AssessmentData;
      const typedAssessmentDetails = assessmentDetails as AssessmentDetails;
      
      setAssessment(typedAssessmentData);
      setReferenceCode(typedAssessmentData.referenceCode);
      setCurrentStep(typedAssessmentData.currentStep);
      
      if (typedAssessmentData.status === 'completed') {
        setIsCompleted(true);
      }
      
      if (typedAssessmentDetails.contact) {
        // Make sure to populate the contact data with the company website
        setContactData({
          firstName: typedAssessmentDetails.contact.firstName,
          lastName: typedAssessmentDetails.contact.lastName,
          email: typedAssessmentDetails.contact.email,
          phone: typedAssessmentDetails.contact.phone,
          companyWebsite: typedAssessmentDetails.contact.companyWebsite || typedAssessmentDetails.company?.website || "",
        });
      }
      
      if (typedAssessmentDetails.company) {
        setCompanyData({
          name: typedAssessmentDetails.company.name,
          website: typedAssessmentDetails.company.website,
          address: typedAssessmentDetails.company.address,
          phone: typedAssessmentDetails.company.phone,
          primaryContact: typedAssessmentDetails.company.primaryContact,
        });
        
        setCompanyProfileData({
          industry: typedAssessmentDetails.company.industry,
          employeeCount: typedAssessmentDetails.company.employeeCount,
          locationCount: typedAssessmentDetails.company.locationCount,
          businessHours: typedAssessmentDetails.company.businessHours,
          overview: typedAssessmentDetails.company.overview,
          compliance: typedAssessmentDetails.company.compliance,
          growthPlans: typedAssessmentDetails.company.growthPlans,
        });
      }
      
      if (typedAssessmentDetails.domainData) {
        setDomainData(typedAssessmentDetails.domainData);
      }
    }
  }, [assessmentData, assessmentDetails, setAssessment, setCurrentStep, setContactData, setCompanyData, setCompanyProfileData, setDomainData, setReferenceCode]);
  
  // Show NDA notice immediately when a new assessment is loaded from token
  useEffect(() => {
    if (assessmentId && assessmentData && assessmentDetails) {
      // Check if assessmentDetails has a contact property that's null/undefined
      const details = assessmentDetails as AssessmentDetails;
      if (!details.contact) {
        // This is a brand new assessment that hasn't been started yet
        setShowNDANotice(true);
      }
    }
  }, [assessmentId, assessmentData, assessmentDetails]);
  
  // Create a new assessment
  const createAssessmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/assessments', data);
      return res.json();
    },
    onSuccess: (data) => {
      setAssessment(data.assessment);
      setReferenceCode(data.assessment.referenceCode);
      setContactData({
        ...contactData,
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/assessments`] });
    },
    onError: (error) => {
      toast({
        title: "Error creating assessment",
        description: (error as Error).message || "An error occurred while creating the assessment.",
        variant: "destructive",
      });
    },
  });
  
  // Update assessment step
  const updateAssessmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('PUT', `/api/assessments/${assessment?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/assessments/${assessment?.id}`] });
    },
    onError: (error) => {
      toast({
        title: "Error updating assessment",
        description: (error as Error).message || "An error occurred while updating the assessment.",
        variant: "destructive",
      });
    },
  });
  
  // Handle contact form submission (Step 1)
  const handleContactSubmit = (data: any) => {
    setContactData(data);
    
    if (!assessment) {
      // Store the contact data to be used after NDA confirmation
      setPendingContactData(data);
      // Show the NDA notice
      setShowNDANotice(true);
    } else {
      // Continue directly to step 2 for existing assessments
      setCurrentStep(2);
      
      // Update contact info in the database if needed
      apiRequest('PUT', `/api/contacts/${assessment.contactId}`, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        companyWebsite: data.companyWebsite
      }).catch(error => {
        console.error("Error updating contact:", error);
      });
      
      updateAssessmentMutation.mutate({
        currentStep: 2
      });
    }
  };
  
  // Handle NDA confirmation
  const handleNDAConfirm = () => {
    // Close the NDA notice
    setShowNDANotice(false);
    
    // Proceed with assessment creation using the pending contact data if available
    if (pendingContactData) {
      createAssessmentMutation.mutate({
        contact: {
          firstName: pendingContactData.firstName,
          lastName: pendingContactData.lastName,
          email: pendingContactData.email,
          phone: pendingContactData.phone,
          companyWebsite: pendingContactData.companyWebsite,
        },
        company: {
          name: "",
          website: pendingContactData.companyWebsite,
        }
      });
      
      // Move to step 2
      setCurrentStep(2);
      
      // Clear the pending data
      setPendingContactData(null);
    }
    // If assessment already exists (but no contact info), proceed to step 1
    else if (assessment) {
      // Stay on step 1 to collect contact information
      setCurrentStep(1);
    }
  };
  
  // Handle contact save
  const handleContactSave = (data: any) => {
    setContactData(data);
    
    // If we have an assessment, update the contact info in the database
    if (assessment && assessment.contactId) {
      apiRequest('PUT', `/api/contacts/${assessment.contactId}`, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        companyWebsite: data.companyWebsite
      }).catch(error => {
        console.error("Error saving contact:", error);
      });
      
      // If the company website changed, also update the company record
      if (data.companyWebsite && companyData && data.companyWebsite !== companyData.website) {
        apiRequest('PUT', `/api/companies/${assessment.companyId}`, {
          ...companyData,
          website: data.companyWebsite
        }).catch(error => {
          console.error("Error updating company website:", error);
        });
      }
    }
    
    toast({
      title: "Progress saved",
      description: "Your assessment progress has been saved.",
    });
  };
  
  // Handle company info submission (Step 2)
  const handleCompanySubmit = (data: any, domainReconData: any) => {
    setCompanyData(data);
    if (domainReconData) {
      setDomainData(domainReconData);
    }
    
    setCurrentStep(3);
    
    if (assessment) {
      updateAssessmentMutation.mutate({
        currentStep: 3
      });
    }
  };
  
  // Handle company profile submission (Step 3)
  const handleCompanyProfileSubmit = async (data: any) => {
    console.log("Profile submit triggered with data:", data);
    setCompanyProfileData(data);
    
    try {
      console.log("Assessment data:", assessment);
      console.log("Company data:", companyData);
      
      if (assessment && assessment.id && companyData) {
        console.log("Updating company data...");
        // Update company data with profile information
        await apiRequest('PUT', `/api/companies/${assessment.companyId}`, {
          ...companyData,
          ...data
        });
        console.log("Company data updated successfully");
      } else {
        console.log("Missing required data for company update");
      }
      
      console.log("Setting step to 4");
      setCurrentStep(4);
      
      if (assessment) {
        console.log("Updating assessment step to 4");
        updateAssessmentMutation.mutate({
          currentStep: 4
        });
      }
    } catch (error) {
      console.error("Error in company profile submission:", error);
      toast({
        title: "Error updating company profile",
        description: (error as Error).message || "An error occurred while updating the company profile.",
        variant: "destructive",
      });
      // Continue anyway despite error
      setCurrentStep(4);
      if (assessment) {
        updateAssessmentMutation.mutate({
          currentStep: 4
        });
      }
    }
  };
  
  // Handle progression to next steps
  const handleGoToStep = (step: number) => {
    setCurrentStep(step);
    
    if (assessment) {
      updateAssessmentMutation.mutate({
        currentStep: step
      });
    }
  };
  
  // Handle assessment completion
  const handleAssessmentComplete = () => {
    setIsCompleted(true);
    
    // Additional completion logic would be handled in the PainPointsStep component
  };
  
  if (isLoadingAssessment || isLoadingDetails) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 bg-slate-700 mb-2" />
            <Skeleton className="h-4 w-96 bg-slate-700" />
          </div>
          <div className="mb-8">
            <Skeleton className="h-4 w-full bg-slate-700 mb-2" />
            <Skeleton className="h-2 w-1/3 bg-slate-700" />
          </div>
          <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-lg overflow-hidden">
            <Skeleton className="h-16 w-full bg-slate-700" />
            <div className="p-6">
              <Skeleton className="h-4 w-full bg-slate-700 mb-6" />
              <div className="space-y-6">
                <Skeleton className="h-10 w-full bg-slate-700" />
                <Skeleton className="h-10 w-full bg-slate-700" />
                <Skeleton className="h-10 w-full bg-slate-700" />
              </div>
            </div>
            <Skeleton className="h-16 w-full bg-slate-700" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (assessmentId && assessmentData && (assessmentData as AssessmentData).status === 'completed' && !isCompleted) {
    setIsCompleted(true);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Client Assessment</h1>
          <p className="text-slate-400">Complete the assessment to gather essential information about your prospect.</p>
        </div>
        
        {!isCompleted && (
          <ProgressTracker currentStep={currentStep} totalSteps={7} />
        )}
        
        <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-lg overflow-hidden">
          {isCompleted ? (
            <SuccessScreen referenceCode={referenceCode} />
          ) : (
            <>
              {currentStep === 1 && (
                <ContactInfoStep 
                  onNext={handleContactSubmit} 
                  onSave={handleContactSave}
                  defaultValues={contactData}
                />
              )}
              
              {currentStep === 2 && (
                <CompanyInfoStep 
                  onNext={handleCompanySubmit} 
                  onBack={() => handleGoToStep(1)}
                  defaultValues={companyData}
                  initialDomain={contactData?.companyWebsite || ''}
                />
              )}
              
              {currentStep === 3 && assessment && (
                <CompanyDetailsStep
                  assessmentId={assessment.id}
                  onNext={handleCompanyProfileSubmit}
                  onBack={() => handleGoToStep(2)}
                  defaultValues={companyProfileData}
                />
              )}
              
              {currentStep === 4 && assessment && (
                <ExpensesStep 
                  onNext={() => handleGoToStep(5)} 
                  onBack={() => handleGoToStep(3)}
                  companyId={assessment.companyId}
                />
              )}
              
              {currentStep === 5 && assessment && (
                <NetworkAssessmentStep 
                  onNext={() => handleGoToStep(6)} 
                  onBack={() => handleGoToStep(4)}
                  companyId={assessment.companyId}
                />
              )}
              
              {currentStep === 6 && assessment && (
                <SecurityAssessmentStep 
                  onNext={() => handleGoToStep(7)} 
                  onBack={() => handleGoToStep(5)}
                  companyId={assessment.companyId}
                  domain={companyData?.website || ""}
                />
              )}
              
              {currentStep === 7 && assessment && (
                <PainPointsStep 
                  onSubmit={handleAssessmentComplete} 
                  onBack={() => handleGoToStep(6)}
                  companyId={assessment.companyId}
                />
              )}
            </>
          )}
        </div>
      </main>
      
      <Footer />
      
      {/* NDA Notice Dialog */}
      <NDANotice 
        isOpen={showNDANotice} 
        onConfirm={handleNDAConfirm} 
      />
    </div>
  );
};

export default Assessment;
