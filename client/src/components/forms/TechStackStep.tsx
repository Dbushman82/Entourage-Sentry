import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  Trash2, 
  Database,
  ShieldCheck, 
  Laptop, 
  Cloud, 
  File,
  Package
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const serviceSchema = z.object({
  name: z.string().min(2, { message: "Service name must be at least 2 characters" }),
  type: z.string().min(1, { message: "Please select a service type" }),
  deployment: z.string().min(1, { message: "Please select a deployment type" }),
  licenseCount: z.number().min(0).optional(),
  primaryAdmin: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface TechStackStepProps {
  onNext: () => void;
  onBack: () => void;
  companyId: number;
  autoDetectedServices?: any[];
}

interface Service {
  id: number;
  companyId: number;
  name: string;
  type: string;
  deployment: string;
  licenseCount?: number;
  primaryAdmin?: string;
  autoDetected: boolean;
}

// Common services with pre-filled data
const commonServices = [
  { 
    name: "Microsoft 365", 
    type: "productivity", 
    deployment: "cloud",
    icon: <Laptop className="text-slate-300" size={18} />
  },
  { 
    name: "Google Workspace", 
    type: "productivity", 
    deployment: "cloud",
    icon: <Cloud className="text-slate-300" size={18} />
  },
  { 
    name: "AWS", 
    type: "infrastructure", 
    deployment: "cloud",
    icon: <Database className="text-slate-300" size={18} />
  },
  { 
    name: "Antivirus", 
    type: "security", 
    deployment: "onprem",
    icon: <ShieldCheck className="text-slate-300" size={18} />
  },
  { 
    name: "CRM", 
    type: "crm", 
    deployment: "cloud",
    icon: <Database className="text-slate-300" size={18} />
  },
  { 
    name: "Backup Solution", 
    type: "backup", 
    deployment: "hybrid",
    icon: <Package className="text-slate-300" size={18} />
  },
];

const TechStackStep = ({ onNext, onBack, companyId, autoDetectedServices = [] }: TechStackStepProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [services, setServices] = useState<Service[]>([]);
  
  // Get the services for this company
  const { data: companyServices, isLoading } = useQuery({
    queryKey: [`/api/services/company/${companyId}`],
    enabled: companyId > 0,
  });
  
  useEffect(() => {
    if (companyServices) {
      setServices(companyServices);
    }
  }, [companyServices]);
  
  // Add service mutation
  const addServiceMutation = useMutation({
    mutationFn: async (service: any) => {
      const res = await apiRequest('POST', '/api/services', {
        ...service,
        companyId,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setServices([...services, data]);
      toast({
        title: "Service added",
        description: "The service has been added to the inventory.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/services/company/${companyId}`] });
      form.reset({
        name: "",
        type: "",
        deployment: "",
        licenseCount: undefined,
        primaryAdmin: "",
      });
    },
  });
  
  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: number) => {
      await apiRequest('DELETE', `/api/services/${serviceId}`, undefined);
    },
    onSuccess: (_, serviceId) => {
      setServices(services.filter(service => service.id !== serviceId));
      toast({
        title: "Service removed",
        description: "The service has been removed from the inventory.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/services/company/${companyId}`] });
    },
  });
  
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      type: "",
      deployment: "",
      licenseCount: undefined,
      primaryAdmin: "",
    },
  });
  
  const handleAddService = (values: ServiceFormValues) => {
    addServiceMutation.mutate({
      ...values,
      autoDetected: false,
      licenseCount: values.licenseCount || 0,
    });
  };
  
  const handleRemoveService = (serviceId: number) => {
    deleteServiceMutation.mutate(serviceId);
  };
  
  const selectCommonService = (service: typeof commonServices[0]) => {
    form.setValue("name", service.name);
    form.setValue("type", service.type);
    form.setValue("deployment", service.deployment);
  };

  return (
    <div>
      <div className="p-6 border-b border-slate-700 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Application & Service Inventory</h2>
        <div className="flex space-x-2">
          <span className="px-2 py-1 bg-primary-900/50 text-primary-400 text-xs rounded-md">Step 4 of 7</span>
        </div>
      </div>
      <div className="p-6">
        <p className="text-slate-400 mb-6">Collect information about the company's technology stack, applications, and services.</p>
        
        {autoDetectedServices && autoDetectedServices.length > 0 && (
          <div className="mb-6 p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-300">Auto-Detected Services</h3>
              <span className="text-xs px-2 py-1 bg-success-500/20 text-success-500 rounded-full">Auto-populated</span>
            </div>
            <div className="space-y-2">
              {autoDetectedServices.map((service, idx) => (
                <div key={idx} className="flex items-center p-2 bg-slate-800 rounded-md">
                  {service.type === 'productivity' ? (
                    <File className="text-lg text-slate-300 mr-3" size={24} />
                  ) : service.type === 'cms' ? (
                    <Package className="text-lg text-slate-300 mr-3" size={24} />
                  ) : service.type === 'ecommerce' ? (
                    <Package className="text-lg text-slate-300 mr-3" size={24} />
                  ) : (
                    <Database className="text-lg text-slate-300 mr-3" size={24} />
                  )}
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-white">{service.name}</h4>
                    <p className="text-xs text-slate-400">{service.description || 'Service'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent text-primary-500 motion-reduce:animate-[spin_1.5s_linear_infinite]">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {services.map(service => (
              <div key={service.id} className="bg-slate-800 border border-slate-700 rounded-md p-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-md font-medium text-white">{service.name}</h3>
                  <button 
                    className="text-slate-400 hover:text-white"
                    onClick={() => handleRemoveService(service.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
                    <div className="flex items-center">
                      <span className="px-2 py-1 bg-slate-700 text-white text-xs rounded">
                        {service.type === 'productivity' ? 'Productivity' :
                         service.type === 'communication' ? 'Communication' :
                         service.type === 'security' ? 'Security' :
                         service.type === 'infrastructure' ? 'Infrastructure' :
                         service.type === 'database' ? 'Database' :
                         service.type === 'crm' ? 'CRM' :
                         service.type === 'erp' ? 'ERP' :
                         service.type === 'accounting' ? 'Accounting' :
                         service.type === 'backup' ? 'Backup & DR' :
                         'Other'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Deployment</label>
                    <div className="flex items-center">
                      <span className="px-2 py-1 bg-slate-700 text-white text-xs rounded">
                        {service.deployment === 'cloud' ? 'Cloud' :
                         service.deployment === 'onprem' ? 'On-premises' :
                         'Hybrid'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">License Count</label>
                    <div className="flex items-center">
                      <span className="text-white">{service.licenseCount || 'N/A'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Primary Admin</label>
                    <div className="flex items-center">
                      <span className="text-white">{service.primaryAdmin || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Add Service Form */}
            <div className="border border-dashed border-slate-600 rounded-md p-4">
              <h3 className="text-md font-medium text-white mb-4">Add New Service</h3>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddService)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Name</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="e.g., Microsoft 365"
                              className="bg-slate-700 border-slate-600 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                              <SelectItem value="productivity">Productivity</SelectItem>
                              <SelectItem value="communication">Communication</SelectItem>
                              <SelectItem value="security">Security</SelectItem>
                              <SelectItem value="infrastructure">Infrastructure</SelectItem>
                              <SelectItem value="database">Database</SelectItem>
                              <SelectItem value="crm">CRM</SelectItem>
                              <SelectItem value="erp">ERP</SelectItem>
                              <SelectItem value="accounting">Accounting</SelectItem>
                              <SelectItem value="backup">Backup & DR</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <FormField
                      control={form.control}
                      name="deployment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deployment Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                <SelectValue placeholder="Select deployment" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                              <SelectItem value="cloud">Cloud</SelectItem>
                              <SelectItem value="onprem">On-premises</SelectItem>
                              <SelectItem value="hybrid">Hybrid</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="licenseCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Count</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min={0}
                              {...field}
                              value={field.value || ''}
                              onChange={e => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                              className="bg-slate-700 border-slate-600 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="primaryAdmin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Admin</FormLabel>
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
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit"
                      className="bg-primary-600 hover:bg-primary-700"
                      disabled={addServiceMutation.isPending}
                    >
                      {addServiceMutation.isPending ? 
                        <div className="flex items-center">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"></div>
                          <span>Adding...</span>
                        </div> :
                        <>
                          <Plus className="mr-1 h-4 w-4" /> Add Service
                        </>
                      }
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
            
            {/* Common Services */}
            <div>
              <h3 className="text-md font-medium text-white mb-3">Common Services</h3>
              <p className="text-sm text-slate-400 mb-3">Select from common services to add to your inventory:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {commonServices.map((service, index) => (
                  <button 
                    key={index}
                    className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-sm text-left flex items-center"
                    onClick={() => selectCommonService(service)}
                  >
                    {service.icon}
                    <span className="ml-2">{service.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700 flex justify-between items-center">
        <Button
          type="button"
          variant="outline"
          className="border-slate-600 hover:border-slate-500"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button type="button" className="bg-primary-600 hover:bg-primary-700" onClick={onNext}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default TechStackStep;
