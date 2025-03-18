import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAssessment } from "@/context/AssessmentContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProgressTracker from "@/components/progress/ProgressTracker";
import ContactInfoStep from "@/components/forms/ContactInfoStep";
import CompanyInfoStep from "@/components/forms/CompanyInfoStep";
import CompanyProfileStep from "@/components/forms/CompanyProfileStep";
import TechStackStep from "@/components/forms/TechStackStep";
import NetworkAssessmentStep from "@/components/forms/NetworkAssessmentStep";
import ServiceCostStep from "@/components/forms/ServiceCostStep";
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
      setAssessment(assessmentData);
      setReferenceCode(assessmentData.referenceCode);
      setCurrentStep(assessmentData.currentStep);
      
      if (assessmentData.status === 'completed') {
        setIsCompleted(true);
      }
      
      if (assessmentDetails.contact) {
        setContactData({
          firstName: assessmentDetails.contact.firstName,
          lastName: assessmentDetails.contact.lastName,
          email: assessmentDetails.contact.email,
          phone: assessmentDetails.contact.phone,
          companyWebsite: assessmentDetails.company?.website,
        });
      }
      
      if (assessmentDetails.company) {
        setCompanyData({
          name: assessmentDetails.company.name,
          website: assessmentDetails.company.website,
          address: assessmentDetails.company.address,
          phone: assessmentDetails.company.phone,
          primaryContact: assessmentDetails.company.primaryContact,
        });
        
        setCompanyProfileData({
          industry: assessmentDetails.company.industry,
          employeeCount: assessmentDetails.company.employeeCount,
          locationCount: assessmentDetails.company.locationCount,
          businessHours: assessmentDetails.company.businessHours,
          overview: assessmentDetails.company.overview,
          compliance: assessmentDetails.company.compliance,
          growthPlans: assessmentDetails.company.growthPlans,
        });
      }
      
      if (assessmentDetails.domainData) {
        setDomainData(assessmentDetails.domainData);
      }
    }
  }, [assessmentData, assessmentDetails, setAssessment, setCurrentStep, setContactData, setCompanyData, setCompanyProfileData, setDomainData, setReferenceCode]);
  
  // Create a new assessment
  const createAssessmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/assessments', data);
      return res.json();
    },
    onSuccess: (data) => {
      setAssessment(data.assessment);
      setReferenceCode(data.assessment.referenceCode);
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
      // Create a new assessment
      createAssessmentMutation.mutate({
        contact: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
        },
        company: {
          name: "",
          website: data.companyWebsite,
        }
      });
    }
    
    setCurrentStep(2);
    
    if (assessment) {
      updateAssessmentMutation.mutate({
        currentStep: 2
      });
    }
  };
  
  // Handle contact save
  const handleContactSave = (data: any) => {
    setContactData(data);
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
  const handleCompanyProfileSubmit = (data: any) => {
    setCompanyProfileData(data);
    
    if (assessment && assessment.id && companyData) {
      // Update company data with profile information
      apiRequest('PUT', `/api/companies/${assessment.companyId}`, {
        ...companyData,
        ...data
      });
    }
    
    setCurrentStep(4);
    
    if (assessment) {
      updateAssessmentMutation.mutate({
        currentStep: 4
      });
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
  
  if (assessmentId && assessmentData && assessmentData.status === 'completed' && !isCompleted) {
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
              
              {currentStep === 3 && (
                <CompanyProfileStep 
                  onNext={handleCompanyProfileSubmit} 
                  onBack={() => handleGoToStep(2)}
                  defaultValues={companyProfileData}
                />
              )}
              
              {currentStep === 4 && assessment && (
                <TechStackStep 
                  onNext={() => handleGoToStep(5)} 
                  onBack={() => handleGoToStep(3)}
                  companyId={assessment.companyId}
                  autoDetectedServices={domainData?.techStack?.map((tech: string) => ({
                    name: tech,
                    type: tech.toLowerCase().includes('wordpress') ? 'cms' : 
                           tech.toLowerCase().includes('woocommerce') ? 'ecommerce' : 'productivity',
                    deployment: 'cloud',
                    autoDetected: true
                  }))}
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
                <ServiceCostStep 
                  onNext={() => handleGoToStep(7)} 
                  onBack={() => handleGoToStep(5)}
                  companyId={assessment.companyId}
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
    </div>
  );
};

export default Assessment;
