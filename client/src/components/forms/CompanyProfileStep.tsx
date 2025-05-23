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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

const complianceOptions = [
  { id: "hipaa", label: "HIPAA" },
  { id: "pci", label: "PCI DSS" },
  { id: "gdpr", label: "GDPR" },
  { id: "sox", label: "SOX" },
  { id: "ccpa", label: "CCPA" },
  { id: "other", label: "Other" },
];

// Define the schema with no required fields except dropdown selects
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
  compliance: z.record(z.boolean()).default({}),
  growthPlans: z.string().optional().default(""),
});

type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>;

interface CompanyProfileStepProps {
  onNext: (data: CompanyProfileFormValues) => void;
  onBack: () => void;
  defaultValues?: Partial<CompanyProfileFormValues>;
}

const CompanyProfileStep = ({ onNext, onBack, defaultValues = {} }: CompanyProfileStepProps) => {
  // Set up default compliance values
  const defaultValues_safe = defaultValues || {};
  const defaultCompliance_obj = defaultValues_safe.compliance || {};
  
  const defaultCompliance = complianceOptions.reduce((acc, option) => {
    acc[option.id] = defaultCompliance_obj[option.id] || false;
    return acc;
  }, {} as Record<string, boolean>);
  
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
  
  const handleSubmit = (values: any) => {
    // Log the original values
    console.log("Original form values:", values);
    console.log("Form state:", form.formState);
    
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
    
    // Log the fixed values
    console.log("Fixed values to be submitted:", fixedValues);
    
    // Call the onNext function with the fixed values
    onNext(fixedValues);
  };
  
  // Handle form submit by clicking the continue button directly
  const handleContinueClick = () => {
    console.log("Continue button clicked directly");
    
    // Prepare default values
    const defaultValues = {
      industry: form.getValues().industry || "_none",
      employeeCount: form.getValues().employeeCount || "_none",
      locationCount: form.getValues().locationCount || "_none",
      overview: form.getValues().overview || "No company overview provided",
      growthPlans: form.getValues().growthPlans || "No specific growth plans provided",
      compliance: form.getValues().compliance || {},
    };
    
    // Check if the required fields meet the minimum requirements
    if (defaultValues.industry === "_none" || 
        defaultValues.employeeCount === "_none" || 
        defaultValues.locationCount === "_none") {
      console.log("Missing required fields");
      form.trigger(); // Show validation errors
      return;
    }
    
    console.log("Continue clicked with values:", defaultValues);
    onNext(defaultValues);
  };

  return (
    <div>
      <div className="p-6 border-b border-slate-700 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Company Profile</h2>
        <div className="flex space-x-2">
          <span className="px-2 py-1 bg-primary-900/50 text-primary-400 text-xs rounded-md">Step 3 of 7</span>
        </div>
      </div>
      <div className="p-6">
        <p className="text-slate-400 mb-6">Tell us more about the company and its business operations.</p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || "_none"}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select an industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="_none">Select an industry</SelectItem>
                      <SelectItem value="retail">Retail & E-commerce</SelectItem>
                      <SelectItem value="healthcare">Healthcare & Medical</SelectItem>
                      <SelectItem value="finance">Financial Services</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="professional">Professional Services</SelectItem>
                      <SelectItem value="hospitality">Hospitality & Tourism</SelectItem>
                      <SelectItem value="construction">Construction & Real Estate</SelectItem>
                      <SelectItem value="nonprofit">Non-profit & Government</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="employeeCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Employees</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || "_none"}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Select employee count" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="_none">Select employee count</SelectItem>
                        <SelectItem value="1-10">1-10</SelectItem>
                        <SelectItem value="11-50">11-50</SelectItem>
                        <SelectItem value="51-200">51-200</SelectItem>
                        <SelectItem value="201-500">201-500</SelectItem>
                        <SelectItem value="501-1000">501-1000</SelectItem>
                        <SelectItem value="1001+">1001+</SelectItem>
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
                      onValueChange={field.onChange} 
                      value={field.value || "_none"}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Select location count" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="_none">Select location count</SelectItem>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2-3">2-3</SelectItem>
                        <SelectItem value="4-10">4-10</SelectItem>
                        <SelectItem value="11-25">11-25</SelectItem>
                        <SelectItem value="26+">26+</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="overview"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Overview</FormLabel>
                  <FormControl>
                    <Textarea 
                      value={field.value || ""}
                      onChange={field.onChange}
                      rows={3}
                      placeholder="Brief description of the company and its operations"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel className="block text-sm font-medium text-slate-300 mb-1">Regulatory Compliance Requirements</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                {complianceOptions.map(option => (
                  <FormField
                    key={option.id}
                    control={form.control}
                    name={`compliance.${option.id}`}
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                            className="h-4 w-4 text-primary-600 border-slate-500 rounded focus:ring-primary-500 bg-slate-700"
                          />
                        </FormControl>
                        <FormLabel className="text-sm text-slate-300">
                          {option.label}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="growthPlans"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Growth Plans and Business Objectives</FormLabel>
                  <FormControl>
                    <Textarea 
                      value={field.value || ""}
                      onChange={field.onChange}
                      rows={3}
                      placeholder="Describe future growth plans and key business objectives"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700 flex justify-between items-center -mx-6 -mb-6 mt-6">
              <Button
                type="button"
                variant="outline"
                className="border-slate-600 hover:border-slate-500"
                onClick={onBack}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button 
                type="button" 
                className="bg-primary-600 hover:bg-primary-700"
                onClick={handleContinueClick}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CompanyProfileStep;
