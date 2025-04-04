import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Box, CheckCircle2, ClipboardList, FileText, Loader2, Building, Users, ShieldCheck } from "lucide-react";

// Define compliance options
const complianceOptions = [
  { id: "hipaa", label: "HIPAA" },
  { id: "pci", label: "PCI DSS" },
  { id: "gdpr", label: "GDPR" },
  { id: "sox", label: "SOX" },
  { id: "ccpa", label: "CCPA" },
  { id: "other", label: "Other" },
];

// Define the company profile schema
const companyProfileSchema = z.object({
  industry: z.string().refine(val => val !== "_none", {
    message: "Please select an industry",
  }),
  employeeCount: z.string().refine(val => val !== "_none", {
    message: "Please select an employee count",
  }),
  locationCount: z.string().refine(val => val !== "_none", {
    message: "Please select a location count",
  }),
  overview: z.string().optional().default(""),
  compliance: z.record(z.boolean()).optional().default({}),
  growthPlans: z.string().optional().default(""),
});

type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>;

interface CompanyDetailsStepProps {
  assessmentId: number;
  onNext: (data: CompanyProfileFormValues, customResponses?: Record<string, any>) => void;
  onBack: () => void;
  defaultValues?: Partial<CompanyProfileFormValues>;
}

const CompanyDetailsStep: React.FC<CompanyDetailsStepProps> = ({ 
  assessmentId,
  onNext,
  onBack,
  defaultValues = {}
}) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [customResponses, setCustomResponses] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Set up default compliance values
  const defaultValues_safe = defaultValues || {};
  const defaultCompliance_obj = defaultValues_safe.compliance || {};
  
  const defaultCompliance = complianceOptions.reduce((acc, option) => {
    acc[option.id] = defaultCompliance_obj[option.id] || false;
    return acc;
  }, {} as Record<string, boolean>);
  
  // Setup form for company profile
  const form = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      industry: "_none",
      employeeCount: "_none",
      locationCount: "_none",
      overview: "",
      compliance: defaultCompliance,
      growthPlans: "",
      ...defaultValues
    },
  });
  
  // Query to get all questions for this assessment
  const { data: questions, isLoading: loadingQuestions } = useQuery({
    queryKey: [`/api/assessments/${assessmentId}/questions`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/assessments/${assessmentId}/questions`);
      return res.json();
    },
    enabled: !!assessmentId,
  });
  
  // Handle custom question responses
  const updateCustomResponse = (questionId: number, value: any) => {
    setCustomResponses(prev => ({
      ...prev,
      [`question_${questionId}`]: value
    }));
  };
  
  // Check if all required questions are answered
  const checkCustomQuestionsValid = () => {
    if (!questions || questions.length === 0) return true;
    
    const requiredQuestions = questions.filter((q: any) => q.required);
    if (requiredQuestions.length === 0) return true;
    
    for (const question of requiredQuestions) {
      const response = customResponses[`question_${question.id}`];
      if (!response || (Array.isArray(response) && response.length === 0)) {
        return false;
      }
    }
    
    return true;
  };
  
  const handleSubmit = (values: CompanyProfileFormValues) => {
    console.log("Continue clicked with values:", values);
    
    // Only do this check if we're on the questions tab
    if (activeTab === "questions" && !checkCustomQuestionsValid()) {
      toast({
        title: "Required questions",
        description: "Please answer all required questions before continuing.",
        variant: "destructive"
      });
      return;
    }
    
    // Fix any potential issues with the values
    const fixedValues = {
      // Ensure the required fields are always present
      industry: values.industry || '',
      employeeCount: values.employeeCount || '',
      locationCount: values.locationCount || '',
      
      // Provide default values for optional fields
      overview: values.overview ? values.overview.trim() : 'No company overview provided',
      growthPlans: values.growthPlans ? values.growthPlans.trim() : 'No specific growth plans provided',
      
      // Ensure compliance is a valid object
      compliance: values.compliance || {},
    };
    
    console.log("Profile submit triggered with data:", fixedValues);
    
    // Save custom question responses
    const saveResponses = async () => {
      setIsSubmitting(true);
      
      try {
        // Skip if no questions exist
        if (!questions || questions.length === 0) {
          console.log("No questions to save, proceeding to next step");
          onNext(fixedValues);
          return;
        }
        
        console.log("Saving custom question responses...");
        
        // Create array of promises for question response submissions
        const responsePromises = questions.map(async (question: any) => {
          const fieldName = `question_${question.id}`;
          const response = customResponses[fieldName];
          
          // Skip if no response
          if (response === undefined) return null;
          
          const payload = {
            questionId: question.id,
            response: Array.isArray(response) ? response.join(', ') : response
          };
          
          try {
            const res = await apiRequest('POST', '/api/question-responses', payload);
            return await res.json();
          } catch (error) {
            console.error(`Error submitting response for question ${question.id}:`, error);
            return null;
          }
        });
        
        // Wait for all responses to be submitted
        await Promise.all(responsePromises);
        console.log("Question responses saved successfully");
        
        // Proceed to next step
        console.log("Proceeding to next step with data:", fixedValues);
        onNext(fixedValues, customResponses);
      } catch (error) {
        console.error("Error submitting question responses:", error);
        toast({
          title: "Error saving responses",
          description: "There was a problem saving your responses. Please try again.",
          variant: "destructive"
        });
        
        // Still proceed to next step despite error
        onNext(fixedValues, customResponses);
      } finally {
        setIsSubmitting(false);
      }
    };
    
    saveResponses();
  };

  const handleContinue = () => {
    if (activeTab === "profile") {
      setActiveTab("questions");
    } else if (activeTab === "questions") {
      setActiveTab("compliance");
    } else if (activeTab === "compliance") {
      // Directly call handleSubmit with current form values
      handleSubmit(form.getValues());
    }
  };
  
  return (
    <div>
      <div className="p-6 border-b border-slate-700 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Company Details</h2>
        <div className="flex space-x-2">
          <span className="px-2 py-1 bg-primary-900/50 text-primary-400 text-xs rounded-md">Step 3 of 7</span>
        </div>
      </div>
      
      <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6 pt-6">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="profile" className="flex items-center gap-2 w-full">
              <Building className="h-4 w-4" />
              Company Profile
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-2 w-full">
              <ClipboardList className="h-4 w-4" />
              Custom Questions {questions?.length > 0 && `(${questions.length})`}
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center gap-2 w-full">
              <ShieldCheck className="h-4 w-4" />
              Compliance
            </TabsTrigger>
          </TabsList>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pb-6">
            <TabsContent value="profile" className="px-6 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="_none">Select industry</SelectItem>
                          <SelectItem value="accounting">Accounting</SelectItem>
                          <SelectItem value="automotive">Automotive</SelectItem>
                          <SelectItem value="construction">Construction</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="hospitality">Hospitality</SelectItem>
                          <SelectItem value="insurance">Insurance</SelectItem>
                          <SelectItem value="legal">Legal</SelectItem>
                          <SelectItem value="manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="nonprofit">Non-Profit</SelectItem>
                          <SelectItem value="professional_services">Professional Services</SelectItem>
                          <SelectItem value="real_estate">Real Estate</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="employeeCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Employees</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select employee count" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="_none">Select employee count</SelectItem>
                          <SelectItem value="1-10">1-10</SelectItem>
                          <SelectItem value="11-50">11-50</SelectItem>
                          <SelectItem value="51-100">51-100</SelectItem>
                          <SelectItem value="101-250">101-250</SelectItem>
                          <SelectItem value="251-500">251-500</SelectItem>
                          <SelectItem value="501-1000">501-1000</SelectItem>
                          <SelectItem value="1000+">1000+</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="locationCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Locations</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location count" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="_none">Select location count</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2-5">2-5</SelectItem>
                          <SelectItem value="6-10">6-10</SelectItem>
                          <SelectItem value="11-20">11-20</SelectItem>
                          <SelectItem value="20+">20+</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4 mt-6">
                <FormField
                  control={form.control}
                  name="overview"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Overview</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter a brief description of your business..." 
                          className="resize-none min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="growthPlans"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Growth Plans</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your company's planned growth over the next 1-3 years..." 
                          className="resize-none min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="questions" className="px-6 pt-2">
              {loadingQuestions ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3">Loading questions...</span>
                </div>
              ) : questions && questions.length > 0 ? (
                <div className="space-y-6">
                  {questions.map((question: any) => (
                    <div key={question.id} className="border border-slate-700 rounded-lg p-5">
                      <div className="flex items-start gap-2 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <h3 className="font-medium">
                              {question.question}
                              {question.required && <span className="text-red-500 ml-1">*</span>}
                            </h3>
                          </div>
                          {question.description && (
                            <p className="text-sm text-slate-400 mt-1">{question.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        {renderQuestionInput(question, customResponses, updateCustomResponse)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-slate-700 rounded-lg">
                  <Box className="h-12 w-12 mx-auto mb-4 text-slate-500" />
                  <h3 className="font-medium mb-2">No custom questions required</h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    This assessment doesn't have any custom questions configured.
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="compliance" className="px-6 pt-2">
              <div className="bg-slate-800 p-4 rounded-lg mb-6">
                <h3 className="text-sm font-medium mb-2">Compliance Requirements</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Please select all compliance frameworks that your organization is subject to.
                </p>
              </div>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="compliance"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {complianceOptions.map((option) => (
                          <FormField
                            key={option.id}
                            control={form.control}
                            name={`compliance.${option.id}`}
                            render={({ field }) => (
                              <FormItem
                                key={option.id}
                                className="flex items-start space-x-3 space-y-0 rounded-md border border-slate-700 p-4"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="text-sm text-slate-100 font-medium cursor-pointer">
                                    {option.label}
                                  </FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>
            
            <div className="px-6 pt-4 flex justify-between items-center border-t border-slate-700">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              
              <Button 
                type="button"
                disabled={isSubmitting}
                className="flex items-center gap-2"
                onClick={handleContinue}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    Continue <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </Tabs>
    </div>
  );
};

// Helper function to render the appropriate input for each question type
const renderQuestionInput = (question: any, responses: Record<string, any>, updateResponse: (id: number, value: any) => void) => {
  const fieldName = `question_${question.id}`;
  const currentValue = responses[fieldName];
  
  switch (question.type) {
    case 'text':
      return (
        <Input
          value={currentValue || ''}
          onChange={(e) => updateResponse(question.id, e.target.value)}
          placeholder="Enter your answer here"
        />
      );
      
    case 'textarea':
      return (
        <Textarea
          value={currentValue || ''}
          onChange={(e) => updateResponse(question.id, e.target.value)}
          placeholder="Enter your answer here"
          className="min-h-[100px]"
        />
      );
      
    case 'select':
      return (
        <Select
          value={currentValue || ''}
          onValueChange={(value) => updateResponse(question.id, value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {question.options && question.options.map((option: string, index: number) => (
              <SelectItem key={index} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
      
    case 'multiselect':
      return (
        <div className="space-y-3">
          {question.options && question.options.map((option: string, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <Checkbox
                id={`${fieldName}-${index}`}
                checked={Array.isArray(currentValue) && currentValue.includes(option)}
                onCheckedChange={(checked) => {
                  const newValue = Array.isArray(currentValue) ? [...currentValue] : [];
                  if (checked) {
                    if (!newValue.includes(option)) {
                      newValue.push(option);
                    }
                  } else {
                    const index = newValue.indexOf(option);
                    if (index !== -1) {
                      newValue.splice(index, 1);
                    }
                  }
                  updateResponse(question.id, newValue);
                }}
              />
              <Label htmlFor={`${fieldName}-${index}`} className="text-sm">
                {option}
              </Label>
            </div>
          ))}
        </div>
      );
      
    case 'checkbox':
      return (
        <div className="space-y-3">
          {question.options && question.options.map((option: string, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <Checkbox
                id={`${fieldName}-${index}`}
                checked={Array.isArray(currentValue) && currentValue.includes(option)}
                onCheckedChange={(checked) => {
                  const newValue = Array.isArray(currentValue) ? [...currentValue] : [];
                  if (checked) {
                    if (!newValue.includes(option)) {
                      newValue.push(option);
                    }
                  } else {
                    const index = newValue.indexOf(option);
                    if (index !== -1) {
                      newValue.splice(index, 1);
                    }
                  }
                  updateResponse(question.id, newValue);
                }}
              />
              <Label htmlFor={`${fieldName}-${index}`} className="text-sm">
                {option}
              </Label>
            </div>
          ))}
        </div>
      );
      
    case 'radio':
      return (
        <RadioGroup
          value={currentValue || ''}
          onValueChange={(value) => updateResponse(question.id, value)}
        >
          <div className="space-y-3">
            {question.options && question.options.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem id={`${fieldName}-${index}`} value={option} />
                <Label htmlFor={`${fieldName}-${index}`} className="text-sm">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      );
      
    default:
      return <p className="text-sm text-red-500">Unsupported question type: {question.type}</p>;
  }
};

export default CompanyDetailsStep;