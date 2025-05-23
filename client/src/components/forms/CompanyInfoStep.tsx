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
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Info, Building, Globe, Search, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const companyFormSchema = z.object({
  name: z.string().min(2, { message: "Company name must be at least 2 characters" }),
  website: z.string().transform(val => {
    // Add https:// if not present
    if (val && !val.match(/^https?:\/\//)) {
      return `https://${val}`;
    }
    return val;
  }).refine(val => {
    // Validate URL after transformation
    try {
      new URL(val);
      return true;
    } catch (e) {
      return false;
    }
  }, { message: "Please enter a valid URL" }),
  // Keep address field for backward compatibility
  address: z.string().optional(),
  phone: z.string().optional(),
  // Primary Contact field removed - using contact info instead
  // Additional fields for enrichment data
  industry: z.string().optional(),
  employeeCount: z.string().optional(),
  // New detailed address fields
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
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
  const [enrichmentData, setEnrichmentData] = useState<any>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  
  // Clean up the initialDomain if needed
  const cleanedDomain = initialDomain?.replace(/^https?:\/\//, '') || '';
  
  // Query for domain reconnaissance data
  const { data: domainReconData, isLoading, error } = useQuery({
    queryKey: [`/api/domain`, cleanedDomain],
    queryFn: async () => {
      // Don't make the request if we don't have a domain
      if (!cleanedDomain) return null;
      
      console.log("Fetching domain data for:", cleanedDomain);
      const res = await apiRequest('POST', '/api/domain', { domain: cleanedDomain });
      return res.json();
    },
    enabled: !!cleanedDomain
  });
  
  // Mutation for company enrichment by domain
  const enrichByDomainMutation = useMutation({
    mutationFn: async (domain: string) => {
      setIsEnriching(true);
      const res = await apiRequest('POST', '/api/companies/enrich/domain', { domain });
      return res.json();
    },
    onSuccess: (data) => {
      setIsEnriching(false);
      setEnrichmentData(data);
      
      if (data.enrichment?.success && data.enrichment?.data) {
        // Auto-fill company name if it's provided in enrichment data
        if (data.enrichment.data.name && (!form.getValues('name') || form.getValues('name') === domainNameSuggestion())) {
          form.setValue('name', data.enrichment.data.name);
        }
        
        toast({
          title: "Company information enriched",
          description: "We've found additional information about this company."
        });
      } else {
        toast({
          title: "Enrichment limited",
          description: data.enrichment?.error || "We couldn't find additional information about this company."
        });
      }
    },
    onError: (error: Error) => {
      setIsEnriching(false);
      toast({
        title: "Enrichment failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Mutation for company enrichment by name
  const enrichByNameMutation = useMutation({
    mutationFn: async ({ name, location }: { name: string, location?: string }) => {
      setIsEnriching(true);
      const res = await apiRequest('POST', '/api/companies/enrich/name', { 
        name,
        location
      });
      return res.json();
    },
    onSuccess: (data) => {
      setIsEnriching(false);
      setEnrichmentData(data);
      
      if (data.enrichment?.success && data.enrichment?.data) {
        toast({
          title: "Company information enriched",
          description: "We've found additional information about this company."
        });
      } else {
        toast({
          title: "Enrichment limited",
          description: data.enrichment?.error || "We couldn't find additional information about this company."
        });
      }
    },
    onError: (error: Error) => {
      setIsEnriching(false);
      toast({
        title: "Enrichment failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Mutation for scraping company information from website
  const [hasScrapedAddress, setHasScrapedAddress] = useState(false);
  const scrapeDomainMutation = useMutation({
    mutationFn: async (domain: string) => {
      setIsEnriching(true);
      const res = await apiRequest('POST', '/api/companies/scrape-domain', { domain });
      return res.json();
    },
    onSuccess: async (data) => {
      setIsEnriching(false);
      
      if (data.success && data.data) {
        // Auto-fill form fields with scraped data
        const scrapedData = data.data;
        console.log("Scraped data:", scrapedData);
        
        if (scrapedData.name && (!form.getValues('name') || form.getValues('name') === domainNameSuggestion())) {
          form.setValue('name', scrapedData.name, { shouldDirty: true, shouldValidate: true });
        }
        
        if (scrapedData.phone) {
          form.setValue('phone', scrapedData.phone, { shouldDirty: true, shouldValidate: true });
          
          // Save the phone number to the database immediately
          try {
            // Get company ID from URL if available
            const assessmentId = window.location.pathname.split('/').pop();
            if (assessmentId) {
              // First get the assessment to find company ID
              const assessmentRes = await apiRequest('GET', `/api/assessments/${assessmentId}`);
              if (assessmentRes.ok) {
                const assessmentData = await assessmentRes.json();
                const companyId = assessmentData.companyId;
                
                if (companyId) {
                  // Now update the company with the new phone number
                  console.log(`Saving phone number ${scrapedData.phone} to company ID ${companyId}`);
                  const saveRes = await apiRequest('PUT', `/api/companies/${companyId}`, {
                    phone: scrapedData.phone
                  });
                  
                  if (saveRes.ok) {
                    console.log("Phone number saved to database");
                  } else {
                    console.error("Failed to save phone number to database", await saveRes.text());
                  }
                }
              }
            }
          } catch (error) {
            console.error("Error saving phone number to database:", error);
          }
        }
        
        // Handle address specially - it might be HTML or have weird formatting
        if (scrapedData.address) {
          // Check if address looks like a WordPress script block (common false positive)
          const isWordPressScript = scrapedData.address.includes('wpforms_settings') || 
                                   scrapedData.address.includes('var ') ||
                                   scrapedData.address.includes('CDATA');
          
          // If it looks like script content, don't use it
          if (!isWordPressScript) {
            // Clean up HTML and formatting issues
            let cleanedAddress = scrapedData.address;
            
            // Remove any HTML/JavaScript content
            cleanedAddress = cleanedAddress.replace(/<[^>]*>?/gm, '')
                                        .replace(/\/\*[\s\S]*?\*\//gm, '')
                                        .replace(/var.*?;/g, '')
                                        .replace(/\n/g, ' ')
                                        .replace(/\s{2,}/g, ' ')
                                        .trim();
                                        
            // Validate if looks like a physical address (contains digits and words)
            const looksLikeAddress = /\d+.*\w+.*/.test(cleanedAddress);
            
            // If we still have a valid address after cleaning
            if (cleanedAddress && cleanedAddress.length > 5 && looksLikeAddress) {
              form.setValue('address', cleanedAddress, { shouldDirty: true });
              setHasScrapedAddress(true);
              
              // Try to extract address components using simple regex patterns
              // This is a basic implementation - the AddressAutocomplete component does this better
              const streetMatch = cleanedAddress.match(/^(.*?)(?:,|\n)/);
              const cityMatch = cleanedAddress.match(/(?:,|\n)\s*([^,\n]+)(?:,|\n)/);
              const stateMatch = cleanedAddress.match(/(?:,|\n)\s*([A-Z]{2})\s+/i);
              const zipMatch = cleanedAddress.match(/\b(\d{5}(?:-\d{4})?)\b/);
              const countryMatch = cleanedAddress.match(/(?:,|\n)\s*([^,\n]+)$/);
              
              if (streetMatch && streetMatch[1]) {
                form.setValue('streetAddress', streetMatch[1].trim(), { shouldDirty: true });
              }
              if (cityMatch && cityMatch[1]) {
                form.setValue('city', cityMatch[1].trim(), { shouldDirty: true });
              }
              if (stateMatch && stateMatch[1]) {
                form.setValue('state', stateMatch[1].trim(), { shouldDirty: true });
              }
              if (zipMatch && zipMatch[1]) {
                form.setValue('postalCode', zipMatch[1].trim(), { shouldDirty: true });
              }
              if (countryMatch && countryMatch[1] && !countryMatch[1].match(/\d/)) {
                form.setValue('country', countryMatch[1].trim(), { shouldDirty: true });
              }
              
              // Save the address to the database immediately
              try {
                // Get company ID from URL if available
                const assessmentId = window.location.pathname.split('/').pop();
                if (assessmentId) {
                  // First get the assessment to find company ID
                  const assessmentRes = await apiRequest('GET', `/api/assessments/${assessmentId}`);
                  if (assessmentRes.ok) {
                    const assessmentData = await assessmentRes.json();
                    const companyId = assessmentData.companyId;
                    
                    if (companyId) {
                      // Now update the company with the new address
                      console.log(`Saving address ${cleanedAddress} to company ID ${companyId}`);
                      const saveRes = await apiRequest('PUT', `/api/companies/${companyId}`, {
                        address: cleanedAddress
                      });
                      
                      if (saveRes.ok) {
                        console.log("Address saved to database");
                      } else {
                        console.error("Failed to save address to database", await saveRes.text());
                      }
                    }
                  }
                }
              } catch (error) {
                console.error("Error saving address to database:", error);
              }
            }
          } else {
            console.log("Skipping address data as it appears to be script content");
          }
        }
        
        if (scrapedData.industry) {
          form.setValue('industry', scrapedData.industry, { shouldDirty: true });
        }
        
        // Create an array to collect missing data notifications
        const missingData: string[] = [];
        
        // Check what data was not found using scrapingResults
        if (scrapedData.scrapingResults) {
          if (!scrapedData.scrapingResults.foundName) {
            missingData.push("Company name");
          }
          if (!scrapedData.scrapingResults.foundPhone) {
            missingData.push("Phone number");
          }
          if (!scrapedData.scrapingResults.foundAddress) {
            missingData.push("Address");
          }
          if (!scrapedData.scrapingResults.foundIndustry) {
            missingData.push("Industry");
          }
        }
        
        // Success notification
        toast({
          title: "Website scraped successfully",
          description: "We've extracted information from the company website."
        });
        
        // If there are missing data fields, show a warning
        if (missingData.length > 0) {
          setTimeout(() => {
            toast({
              title: "Some information not found",
              description: `We couldn't find: ${missingData.join(", ")}. Please fill these manually.`,
              variant: "destructive",
            });
          }, 500); // Small delay so toasts don't overlap
        }
      } else {
        toast({
          title: "Website scraping limited",
          description: data.message || "We couldn't extract much information from this website."
        });
      }
    },
    onError: (error: Error) => {
      setIsEnriching(false);
      toast({
        title: "Website scraping failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Helper function to get a company name suggestion from domain
  const domainNameSuggestion = (customDomain?: string) => {
    const domainToUse = customDomain || cleanedDomain;
    if (!domainToUse) return "";
    
    // Clean up the domain to get just the main part
    const domain = domainToUse.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    const domainParts = domain.split('.');
    
    // Return capitalized first part of domain
    return domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
  };
  
  useEffect(() => {
    if (domainReconData) {
      setDomainData(domainReconData);
    }
  }, [domainReconData]);
  
  // Function to fetch domain enrichment data directly
  const fetchDomainEnrichment = async (domain: string) => {
    if (!domain) return;

    try {
      setIsEnriching(true);
      console.log("Fetching enrichment for domain:", domain);
      
      // Normalize the domain before sending to API
      const normalizedDomain = domain.toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0];
      
      // Make the API request
      const response = await apiRequest('POST', '/api/companies/enrich/domain', { domain: normalizedDomain });
      const data = await response.json();
      
      console.log("Domain enrichment API response:", data);
      
      // Set both the domain data and enrichment data
      setDomainData(data.domainData);
      setEnrichmentData(data);
      
      // Apply the enrichment data to form fields if available
      if (data.enrichment?.success && data.enrichment?.data) {
        const enrichedData = data.enrichment.data;
        
        // Update form fields with enriched data
        console.log("Applying enriched data to form:", enrichedData);
        
        // Update company name if valid and form value is empty or auto-suggested
        if (enrichedData.name && 
            (!form.getValues('name') || form.getValues('name') === domainNameSuggestion(normalizedDomain))) {
          form.setValue('name', enrichedData.name, { shouldDirty: true, shouldValidate: true });
        }
        
        // Try to update other fields if available
        if (enrichedData.industry) {
          form.setValue('industry', enrichedData.industry, { shouldDirty: true });
        }
        
        if (enrichedData.employeeCount) {
          form.setValue('employeeCount', String(enrichedData.employeeCount), { shouldDirty: true });
        }
        
        toast({
          title: "Company data enriched",
          description: "Additional company information has been found"
        });
      }
      
      setIsEnriching(false);
    } catch (error) {
      console.error("Enrichment error:", error);
      setIsEnriching(false);
      toast({
        title: "Enrichment failed",
        description: error instanceof Error ? error.message : "Could not enrich company data",
        variant: "destructive"
      });
    }
  };
  
  // Start enrichment automatically when domain data is available
  useEffect(() => {
    if (domainData?.domain && !enrichmentData && !isEnriching) {
      console.log("Starting auto enrichment for domain:", domainData.domain);
      fetchDomainEnrichment(domainData.domain);
    }
  }, [domainData]);
  
  // Log enrichment data when it changes
  useEffect(() => {
    console.log("Enrichment data updated:", enrichmentData);
  }, [enrichmentData]);
  
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      website: initialDomain || "",
      address: "",
      phone: "",
      // Primary Contact removed
      industry: "",
      employeeCount: "",
      // New address fields
      streetAddress: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      ...defaultValues
    },
  });
  
  // When domain data is loaded, update form values if they're not already set
  useEffect(() => {
    if (domainReconData && (!defaultValues || !defaultValues.name)) {
      // Extract domain name for company name suggestion
      const domain = initialDomain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      const domainParts = domain.split('.');
      const suggestedName = domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
      
      form.setValue('name', suggestedName);
    }
  }, [domainReconData, form, initialDomain, defaultValues]);
  
  // Apply enrichment data to form fields when it becomes available
  useEffect(() => {
    if (enrichmentData?.enrichment?.success && enrichmentData?.enrichment?.data) {
      const data = enrichmentData.enrichment.data;
      console.log("Applying enrichment data to form:", data);
      
      // Only update fields if they have values and current form values are empty or default
      if (data.name && (!form.getValues('name') || form.getValues('name') === domainNameSuggestion(form.getValues('website')))) {
        form.setValue('name', data.name, { shouldDirty: true, shouldValidate: true });
      }
      
      // Set website if not already set and available in enrichment
      if (data.website && !form.getValues('website')) {
        form.setValue('website', data.website, { shouldDirty: true });
      }
      
      // Set industry if available and form value is empty
      if (data.industry && !form.getValues('industry')) {
        form.setValue('industry', data.industry, { shouldDirty: true });
      }
      
      // Set employee count if available and form value is empty
      if (data.employeeCount && !form.getValues('employeeCount')) {
        form.setValue('employeeCount', String(data.employeeCount), { shouldDirty: true });
      }
    }
  }, [enrichmentData]);
  
  const handleSubmit = (values: CompanyFormValues) => {
    // Combine both domain data and enrichment data
    const combinedData = {
      domainData,
      enrichmentData: enrichmentData?.enrichment?.data || null,
      ...domainData
    };
    
    onNext(values, combinedData);
  };
  
  // Handler for manual enrichment by name
  const handleEnrichByName = () => {
    const companyName = form.getValues('name');
    const address = form.getValues('address');
    
    if (!companyName) {
      toast({
        title: "Name required",
        description: "Please enter a company name for enrichment.",
        variant: "destructive"
      });
      return;
    }
    
    enrichByNameMutation.mutate({ 
      name: companyName,
      location: address
    });
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
            
            {enrichmentData?.enrichment?.data && (
              <div className="mb-6 p-4 bg-slate-900/50 border border-primary-700/50 rounded-lg">
                <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center">
                  <Building className="h-4 w-4 mr-2 text-primary-400" />
                  Company Enrichment Data
                </h3>
                <div className="space-y-1">
                  {enrichmentData.enrichment.data.name && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Company Name</span>
                      <span className="text-xs text-white">{enrichmentData.enrichment.data.name}</span>
                    </div>
                  )}
                  {enrichmentData.enrichment.data.description && (
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-slate-400">Description</span>
                      <span className="text-xs text-white text-right max-w-[60%]">{enrichmentData.enrichment.data.description}</span>
                    </div>
                  )}
                  {enrichmentData.enrichment.data.industry && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Industry</span>
                      <span className="text-xs text-white">{enrichmentData.enrichment.data.industry}</span>
                    </div>
                  )}
                  {enrichmentData.enrichment.data.employeeCount && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Employee Count</span>
                      <span className="text-xs text-white">{enrichmentData.enrichment.data.employeeCount}</span>
                    </div>
                  )}
                  {enrichmentData.enrichment.data.founded && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Founded</span>
                      <span className="text-xs text-white">{enrichmentData.enrichment.data.founded}</span>
                    </div>
                  )}
                  {enrichmentData.enrichment.data.annualRevenue && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Annual Revenue</span>
                      <span className="text-xs text-white">{enrichmentData.enrichment.data.annualRevenue}</span>
                    </div>
                  )}
                  {enrichmentData.enrichment.data.socialProfiles && (
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-slate-400">Social Profiles</span>
                      <div className="text-xs text-white text-right">
                        {enrichmentData.enrichment.data.socialProfiles.linkedin && <div>LinkedIn</div>}
                        {enrichmentData.enrichment.data.socialProfiles.twitter && <div>Twitter</div>}
                        {enrichmentData.enrichment.data.socialProfiles.facebook && <div>Facebook</div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="flex-1 mr-2">
                        <FormLabel>Company Name</FormLabel>
                        <div className="flex">
                          <FormControl>
                            <Input 
                              {...field} 
                              className="bg-slate-700 border-slate-600 text-white rounded-r-none"
                            />
                          </FormControl>
                          <Button 
                            type="button" 
                            variant="secondary"
                            className="rounded-l-none"
                            onClick={handleEnrichByName}
                            disabled={isEnriching}
                          >
                            {isEnriching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                          </Button>
                        </div>
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
                </div>
                
                {/* Add website field with scrape button */}
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Website</FormLabel>
                      <div className="flex">
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="https://example.com"
                            className="bg-slate-700 border-slate-600 text-white rounded-r-none"
                          />
                        </FormControl>
                        <Button 
                          type="button" 
                          variant="secondary"
                          className="rounded-l-none"
                          onClick={() => {
                            const websiteValue = form.getValues('website');
                            if (!websiteValue) {
                              toast({
                                title: "Website required",
                                description: "Please enter a website URL for scraping.",
                                variant: "destructive"
                              });
                              return;
                            }
                            
                            // Clean domain for API call
                            const domain = websiteValue
                              .replace(/^https?:\/\//, '')
                              .replace(/^www\./, '')
                              .split('/')[0];
                              
                            scrapeDomainMutation.mutate(domain);
                          }}
                          disabled={isEnriching}
                        >
                          {isEnriching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                        </Button>
                      </div>
                      {domainData && (
                        <div className="flex items-center mt-1">
                          <Info className="h-3 w-3 text-success-500 mr-1" />
                          <span className="text-xs text-success-500">Domain information analyzed</span>
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
                        <AddressAutocomplete
                          value={field.value || ""}
                          onChange={(value, components) => {
                            field.onChange(value);
                            
                            // If we have detailed components, update those fields too
                            if (components) {
                              if (components.streetAddress) {
                                form.setValue('streetAddress', components.streetAddress);
                              }
                              if (components.city) {
                                form.setValue('city', components.city);
                              }
                              if (components.state) {
                                form.setValue('state', components.state);
                              }
                              if (components.postalCode) {
                                form.setValue('postalCode', components.postalCode);
                              }
                              if (components.country) {
                                form.setValue('country', components.country);
                              }
                            }
                          }}
                          placeholder="Enter company address"
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </FormControl>
                      {hasScrapedAddress && (
                        <div className="flex items-center mt-1">
                          <Info className="h-3 w-3 text-success-500 mr-1" />
                          <span className="text-xs text-success-500">Extracted from website</span>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Address Details Fields (hidden on small screens) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-800 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-slate-300 col-span-2">Detailed Address Components</h3>
                  
                  <FormField
                    control={form.control}
                    name="streetAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Street Address</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Street address"
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">City</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="City"
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">State/Province</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="State or province"
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Postal Code</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Postal/ZIP code"
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="text-xs">Country</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Country"
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
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
                  
                  {/* Primary Contact field removed as requested - using contact info instead */}
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