import { createContext, useContext, useState, ReactNode } from 'react';

interface AssessmentContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  
  assessment: any | null;
  setAssessment: (assessment: any) => void;
  
  contactData: any | null;
  setContactData: (data: any) => void;
  
  companyData: any | null;
  setCompanyData: (data: any) => void;
  
  companyProfileData: any | null;
  setCompanyProfileData: (data: any) => void;
  
  domainData: any | null;
  setDomainData: (data: any) => void;
  
  referenceCode: string;
  setReferenceCode: (code: string) => void;
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [assessment, setAssessment] = useState<any | null>(null);
  const [contactData, setContactData] = useState<any | null>(null);
  const [companyData, setCompanyData] = useState<any | null>(null);
  const [companyProfileData, setCompanyProfileData] = useState<any | null>(null);
  const [domainData, setDomainData] = useState<any | null>(null);
  const [referenceCode, setReferenceCode] = useState('');
  
  return (
    <AssessmentContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        assessment,
        setAssessment,
        contactData,
        setContactData,
        companyData,
        setCompanyData,
        companyProfileData,
        setCompanyProfileData,
        domainData,
        setDomainData,
        referenceCode,
        setReferenceCode
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const context = useContext(AssessmentContext);
  if (context === undefined) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
}
