import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Shield, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// Schema for security assessment form
const securityFormSchema = z.object({
  additionalNotes: z.string().optional(),
});

type SecurityFormValues = z.infer<typeof securityFormSchema>;

interface SecurityAssessmentStepProps {
  onNext: (data: SecurityFormValues, securityData?: any) => void;
  onBack: () => void;
  defaultValues?: Partial<SecurityFormValues>;
  companyId: number;
  domain: string;
}

const getSecurityRiskLevelColor = (score: number): string => {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-yellow-500";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
};

const getSecurityRiskLevel = (score: number): string => {
  if (score >= 80) return "Secure";
  if (score >= 60) return "Low Risk";
  if (score >= 40) return "Medium Risk";
  if (score < 40) return "High Risk";
  return "Unknown";
};

const SecurityAssessmentStep = ({ 
  onNext, 
  onBack, 
  defaultValues = {}, 
  companyId,
  domain 
}: SecurityAssessmentStepProps) => {
  const { toast } = useToast();
  const [securityData, setSecurityData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Form setup
  const form = useForm<SecurityFormValues>({
    resolver: zodResolver(securityFormSchema),
    defaultValues,
  });

  // Mutation for security assessment
  const securityAnalysisMutation = useMutation({
    mutationFn: async () => {
      setIsAnalyzing(true);
      const res = await apiRequest('POST', '/api/companies/security/domain', { 
        domain,
        companyId 
      });
      return res.json();
    },
    onSuccess: (data) => {
      setIsAnalyzing(false);
      setSecurityData(data);
      
      if (data.success) {
        toast({
          title: "Security assessment complete",
          description: "Domain security information has been collected successfully.",
        });
      } else {
        toast({
          title: "Security assessment limited",
          description: data.error || "We couldn't complete a full security assessment.",
          variant: "destructive"
        });
      }
    },
    onError: (error: Error) => {
      setIsAnalyzing(false);
      toast({
        title: "Security assessment failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Start security analysis when component mounts
  useEffect(() => {
    if (domain && !securityData && !isAnalyzing) {
      securityAnalysisMutation.mutate();
    }
  }, [domain]);

  const handleSubmit = (values: SecurityFormValues) => {
    onNext(values, securityData);
  };

  // Calculate overall security percentage for the progress bar
  const calculateSecurityPercentage = (): number => {
    if (!securityData?.securityAssessment?.securityScore) return 50;
    return securityData.securityAssessment.securityScore;
  };

  return (
    <div>
      <div className="p-6 border-b border-slate-700 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Security Assessment</h2>
        <div className="flex space-x-2">
          <span className="px-2 py-1 bg-primary-900/50 text-primary-400 text-xs rounded-md">Step 7 of 8</span>
        </div>
      </div>
      
      <div className="p-6">
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent text-primary-500 motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4">
              <span className="sr-only">Loading...</span>
            </div>
            <span className="text-slate-300 text-lg font-medium">Analyzing domain security...</span>
            <p className="text-slate-400 mt-2 max-w-md">
              We're scanning {domain} for potential security vulnerabilities and best practices.
              This may take a moment.
            </p>
          </div>
        ) : (
          <>
            {securityData?.error && (
              <div className="mb-6 p-4 bg-destructive/20 border border-destructive/30 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-destructive mr-2 mt-0.5" />
                  <div>
                    <p className="text-destructive font-medium">Security Assessment Error</p>
                    <p className="text-destructive/80 text-sm mt-1">
                      {securityData.error}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {securityData?.securityAssessment && (
              <div className="mb-6 space-y-6">
                <Card className="border-slate-700 bg-slate-800/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex justify-between items-center">
                      <span className="flex items-center">
                        <Shield className="h-5 w-5 mr-2 text-primary-500" />
                        Security Score
                      </span>
                      <span className={`text-xl ${getSecurityRiskLevelColor(calculateSecurityPercentage())}`}>
                        {calculateSecurityPercentage()}%
                      </span>
                    </CardTitle>
                    <CardDescription>
                      Overall security assessment for {domain}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-slate-400">Security Level</span>
                          <span className={`text-sm font-medium ${getSecurityRiskLevelColor(calculateSecurityPercentage())}`}>
                            {getSecurityRiskLevel(calculateSecurityPercentage())}
                          </span>
                        </div>
                        <Progress value={calculateSecurityPercentage()} className="h-2" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="bg-slate-900/50 p-3 rounded-md">
                          <div className="text-xs text-slate-400 mb-1">High Vulnerabilities</div>
                          <div className="text-lg font-semibold text-red-500">
                            {securityData.securityAssessment.vulnerabilitiesHigh || 0}
                          </div>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded-md">
                          <div className="text-xs text-slate-400 mb-1">Medium Vulnerabilities</div>
                          <div className="text-lg font-semibold text-orange-500">
                            {securityData.securityAssessment.vulnerabilitiesMedium || 0}
                          </div>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded-md">
                          <div className="text-xs text-slate-400 mb-1">Low Vulnerabilities</div>
                          <div className="text-lg font-semibold text-yellow-500">
                            {securityData.securityAssessment.vulnerabilitiesLow || 0}
                          </div>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded-md">
                          <div className="text-xs text-slate-400 mb-1">Informational Issues</div>
                          <div className="text-lg font-semibold text-blue-500">
                            {securityData.securityAssessment.vulnerabilitiesInfo || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Exposed Services */}
                {securityData.securityAssessment.exposedServices?.length > 0 && (
                  <Card className="border-slate-700 bg-slate-800/50">
                    <CardHeader>
                      <CardTitle className="text-base">Exposed Services</CardTitle>
                      <CardDescription>
                        Services that are publicly visible on the internet
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(securityData.securityAssessment.exposedServices) && 
                          securityData.securityAssessment.exposedServices.map((service: string, index: number) => (
                            <span key={index} className="px-2 py-1 text-xs bg-slate-700 rounded-full">
                              {service}
                            </span>
                          ))
                        }
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Technologies */}
                {securityData.securityAssessment.technologies?.length > 0 && (
                  <Card className="border-slate-700 bg-slate-800/50">
                    <CardHeader>
                      <CardTitle className="text-base">Detected Technologies</CardTitle>
                      <CardDescription>
                        Web technologies and frameworks in use
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(securityData.securityAssessment.technologies) && 
                          securityData.securityAssessment.technologies.map((tech: string, index: number) => (
                            <span key={index} className="px-2 py-1 text-xs bg-slate-700 rounded-full">
                              {tech}
                            </span>
                          ))
                        }
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Security Recommendations */}
                {securityData.securityAssessment.recommendations?.length > 0 && (
                  <Card className="border-slate-700 bg-slate-800/50">
                    <CardHeader>
                      <CardTitle className="text-base">Security Recommendations</CardTitle>
                      <CardDescription>
                        Suggested actions to improve security posture
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {Array.isArray(securityData.securityAssessment.recommendations) && 
                          securityData.securityAssessment.recommendations.map((rec: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <CheckCircle className="h-4 w-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-slate-300">{rec}</span>
                            </li>
                          ))
                        }
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="flex justify-between mt-8">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onBack}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" /> Previous
                  </Button>
                  
                  <Button 
                    type="submit" 
                    className="flex items-center gap-2"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </div>
    </div>
  );
};

export default SecurityAssessmentStep;