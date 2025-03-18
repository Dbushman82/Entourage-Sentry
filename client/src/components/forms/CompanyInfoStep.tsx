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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const companyFormSchema = z.object({
  name: z.string().min(2, { message: "Company name must be at least 2 characters" }),
  website: z.string().url({ message: "Please enter a valid URL" }),
  address: z.string().optional(),
  phone: z.string().optional(),
  primaryContact: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

interface CompanyInfoStepProps {
  onNext: (data: CompanyFormValues, domainData?: any) => void;
  onBack: () => void;
  defaultValues?: Partial<CompanyFormValues>;
  initialDomain: string;
}

const CompanyInfoStep = ({ onNext, onBack, defaultValues = {}, initialDomain }: CompanyInfoStepProps) => {
  const { toast } = useToast();
  const [domainData, setDomainData] = useState<any>(null);
  
  // Query for domain reconnaissance data
  const { data: domainReconData, isLoading, error } = useQuery({
    queryKey: [`/api/domain`],
    queryFn: async () => {
      // Don't make the request if we don't have a domain
      if (!initialDomain) return null;
      
      const res = await apiRequest('POST', '/api/domain', { domain: initialDomain });
      return res.json();
    },
    enabled: !!initialDomain
  });
  
  useEffect(() => {
    if (domainReconData) {
      setDomainData(domainReconData);
    }
  }, [domainReconData]);
  
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      website: initialDomain || "",
      address: "",
      phone: "",
      primaryContact: "",
      ...defaultValues
    },
  });
  
  // When domain data is loaded, update form values if they're not already set
  useEffect(() => {
    if (domainReconData && !defaultValues.name) {
      // Extract domain name for company name suggestion
      const domain = initialDomain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      const domainParts = domain.split('.');
      const suggestedName = domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
      
      form.setValue('name', suggestedName);
    }
  }, [domainReconData, form, initialDomain, defaultValues]);
  
  const handleSubmit = (values: CompanyFormValues) => {
    onNext(values, domainData);
  };

  return (
    <div>
      <div className="p-6 border-b border-slate-700 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Company Information</h2>
        <div className="flex space-x-2">
          <span className="px-2 py-1 bg-primary-900/50 text-primary-400 text-xs rounded-md">Step 2 of 7</span>
        </div>
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent text-primary-500 motion-reduce:animate-[spin_1.5s_linear_infinite]">
              <span className="sr-only">Loading...</span>
            </div>
            <span className="ml-3 text-slate-400">Analyzing domain information...</span>
          </div>
        ) : (
          <>
            {initialDomain && domainData && (
              <div className="flex items-center justify-between mb-6">
                <p className="text-slate-400">We've found the following information about <span className="text-white font-medium">{domainData.domain || initialDomain}</span>.</p>
                <span className="text-xs px-2 py-1 bg-success-500/20 text-success-500 rounded-full">Auto-populated</span>
              </div>
            )}
            
            {error && (
              <div className="mb-6 p-4 bg-destructive/20 border border-destructive/30 rounded-lg">
                <p className="text-destructive text-sm">
                  Error analyzing domain: {(error as Error).message}
                </p>
              </div>
            )}
            
            {domainData && (
              <div className="mb-6 p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                <h3 className="text-sm font-medium text-slate-300 mb-3">Domain Analysis Results</h3>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Domain Registration</span>
                    <span className="text-xs text-white">
                      {domainData.registrationDate ? `Registered since ${new Date(domainData.registrationDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">SSL Certificate</span>
                    <span className="text-xs text-white">
                      {domainData.sslExpiry ? `Valid (Expires ${new Date(domainData.sslExpiry).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})` : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">MX Records</span>
                    <span className="text-xs text-white">
                      {domainData.mxRecords?.length ? 
                        (domainData.mxRecords[0].includes('google') ? 'Google Workspace' : 
                          domainData.mxRecords[0].includes('outlook') ? 'Microsoft 365' : 
                          domainData.mxRecords[0].includes('zoho') ? 'Zoho Mail' : 
                          'Custom Mail Server') 
                        : 'None detected'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Email Security</span>
                    <span className="text-xs text-white">
                      {domainData.emailSecurity ? 
                        `${domainData.emailSecurity.spf ? 'SPF' : ''}${domainData.emailSecurity.dkim ? ', DKIM' : ''}${domainData.emailSecurity.dmarc ? ', DMARC' : ''} configured`
                        : 'None detected'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Website Hosting</span>
                    <span className="text-xs text-white">{domainData.hosting || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Technology Stack</span>
                    <span className="text-xs text-white">
                      {domainData.techStack?.join(', ') || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </FormControl>
                      {domainData && (
                        <div className="flex items-center mt-1">
                          <Info className="h-3 w-3 text-success-500 mr-1" />
                          <span className="text-xs text-success-500">Auto-populated from domain</span>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          className="bg-slate-700 border-slate-600 text-white"
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Phone</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="tel"
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="primaryContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Contact</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
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
                  <Button type="submit" className="bg-primary-600 hover:bg-primary-700">
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
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

export default CompanyInfoStep;
