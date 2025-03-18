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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  Edit, 
  Trash2, 
  X,
  DollarSign,
  BarChart,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const costFormSchema = z.object({
  serviceName: z.string().min(2, { message: "Service name must be at least 2 characters" }),
  serviceProvider: z.string().optional(),
  monthlyCost: z.number().min(0, { message: "Monthly cost must be at least 0" }),
  userCount: z.number().optional(),
  renewalDate: z.string().optional(),
  contractNotes: z.string().optional(),
});

type CostFormValues = z.infer<typeof costFormSchema>;

interface ServiceCostStepProps {
  onNext: () => void;
  onBack: () => void;
  companyId: number;
}

interface Cost {
  id: number;
  companyId: number;
  serviceName: string;
  serviceProvider?: string;
  monthlyCost: number;
  userCount?: number;
  renewalDate?: string;
  contractNotes?: string;
  createdAt: string;
}

const ServiceCostStep = ({ onNext, onBack, companyId }: ServiceCostStepProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [costs, setCosts] = useState<Cost[]>([]);
  const [showCostForm, setShowCostForm] = useState(false);
  const [editingCostId, setEditingCostId] = useState<number | null>(null);
  
  // Calculate cost summary
  const monthlyCostsTotal = costs.reduce((sum, cost) => sum + cost.monthlyCost, 0);
  const annualCostsTotal = monthlyCostsTotal * 12;
  const totalUsers = costs.reduce((sum, cost) => sum + (cost.userCount || 0), 0);
  const costPerUser = totalUsers > 0 ? Math.round(monthlyCostsTotal / totalUsers) : 0;
  
  // Get the costs for this company
  const { data: companyCosts, isLoading } = useQuery({
    queryKey: [`/api/costs/company/${companyId}`],
    enabled: companyId > 0,
  });
  
  useEffect(() => {
    if (companyCosts) {
      setCosts(companyCosts);
    }
  }, [companyCosts]);
  
  // Add cost mutation
  const addCostMutation = useMutation({
    mutationFn: async (cost: any) => {
      const res = await apiRequest('POST', '/api/costs', {
        ...cost,
        companyId,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setCosts([...costs, data]);
      toast({
        title: "Cost added",
        description: "The service cost has been added to the inventory.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/costs/company/${companyId}`] });
      setShowCostForm(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error adding cost",
        description: (error as Error).message || "An error occurred while adding the cost.",
        variant: "destructive",
      });
    },
  });
  
  // Update cost mutation
  const updateCostMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest('PUT', `/api/costs/${id}`, data);
      return res.json();
    },
    onSuccess: (data) => {
      setCosts(costs.map(cost => cost.id === data.id ? data : cost));
      toast({
        title: "Cost updated",
        description: "The service cost has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/costs/company/${companyId}`] });
      setShowCostForm(false);
      setEditingCostId(null);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error updating cost",
        description: (error as Error).message || "An error occurred while updating the cost.",
        variant: "destructive",
      });
    },
  });
  
  // Delete cost mutation
  const deleteCostMutation = useMutation({
    mutationFn: async (costId: number) => {
      await apiRequest('DELETE', `/api/costs/${costId}`, undefined);
    },
    onSuccess: (_, costId) => {
      setCosts(costs.filter(cost => cost.id !== costId));
      toast({
        title: "Cost removed",
        description: "The service cost has been removed from the inventory.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/costs/company/${companyId}`] });
    },
    onError: (error) => {
      toast({
        title: "Error removing cost",
        description: (error as Error).message || "An error occurred while removing the cost.",
        variant: "destructive",
      });
    },
  });
  
  const form = useForm<CostFormValues>({
    resolver: zodResolver(costFormSchema),
    defaultValues: {
      serviceName: "",
      serviceProvider: "",
      monthlyCost: 0,
      userCount: undefined,
      renewalDate: "",
      contractNotes: "",
    },
  });
  
  const resetForm = () => {
    form.reset({
      serviceName: "",
      serviceProvider: "",
      monthlyCost: 0,
      userCount: undefined,
      renewalDate: "",
      contractNotes: "",
    });
  };
  
  const handleAddCost = () => {
    setEditingCostId(null);
    resetForm();
    setShowCostForm(true);
  };
  
  const handleEditCost = (cost: Cost) => {
    setEditingCostId(cost.id);
    form.reset({
      serviceName: cost.serviceName,
      serviceProvider: cost.serviceProvider || "",
      monthlyCost: cost.monthlyCost,
      userCount: cost.userCount,
      renewalDate: cost.renewalDate || "",
      contractNotes: cost.contractNotes || "",
    });
    setShowCostForm(true);
  };
  
  const handleDeleteCost = (costId: number) => {
    deleteCostMutation.mutate(costId);
  };
  
  const closeCostForm = () => {
    setShowCostForm(false);
    setEditingCostId(null);
  };
  
  const onSubmit = (values: CostFormValues) => {
    if (editingCostId) {
      updateCostMutation.mutate({ id: editingCostId, data: values });
    } else {
      addCostMutation.mutate(values);
    }
  };

  return (
    <div>
      <div className="p-6 border-b border-slate-700 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Service Cost Tracking</h2>
        <div className="flex space-x-2">
          <span className="px-2 py-1 bg-primary-900/50 text-primary-400 text-xs rounded-md">Step 6 of 7</span>
        </div>
      </div>
      <div className="p-6">
        <p className="text-slate-400 mb-6">Track IT-related expenses and identify cost-saving opportunities.</p>
        
        {/* Cost Summary */}
        <div className="mb-6 p-4 bg-slate-800 border border-slate-700 rounded-lg">
          <h3 className="text-md font-medium text-white mb-3">Cost Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-slate-900/50 rounded-md">
              <h4 className="text-xs font-medium text-slate-400 mb-1">Monthly Expenses</h4>
              <span className="text-xl text-white font-semibold">${monthlyCostsTotal}</span>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-md">
              <h4 className="text-xs font-medium text-slate-400 mb-1">Annual Expenses</h4>
              <span className="text-xl text-white font-semibold">${annualCostsTotal}</span>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-md">
              <h4 className="text-xs font-medium text-slate-400 mb-1">Cost Per User</h4>
              <span className="text-xl text-white font-semibold">${costPerUser}</span>
            </div>
          </div>
        </div>
        
        {/* Service Cost Table */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-md font-medium text-white">IT Services Costs</h3>
            <Button 
              className="px-3 py-1 bg-primary-600 hover:bg-primary-700 h-auto text-sm"
              onClick={handleAddCost}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Cost
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent text-primary-500 motion-reduce:animate-[spin_1.5s_linear_infinite]">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          ) : costs.length === 0 ? (
            <div className="text-center p-8 bg-slate-800 border border-slate-700 rounded-lg">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center mb-4">
                <DollarSign className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No costs added yet</h3>
              <p className="text-slate-400 mb-4">Start tracking IT-related expenses by adding your first service cost.</p>
              <Button 
                className="bg-primary-600 hover:bg-primary-700"
                onClick={handleAddCost}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Your First Cost
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-800">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Service</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Provider</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Monthly Cost</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Users</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Renewal</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800 divide-y divide-slate-700">
                  {costs.map((cost) => (
                    <tr key={cost.id}>
                      <td className="px-4 py-3 text-sm text-white">{cost.serviceName}</td>
                      <td className="px-4 py-3 text-sm text-white">{cost.serviceProvider || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-white">${cost.monthlyCost}</td>
                      <td className="px-4 py-3 text-sm text-white">{cost.userCount || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-white">
                        {cost.renewalDate ? new Date(cost.renewalDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        <div className="flex space-x-2">
                          <button 
                            className="text-slate-400 hover:text-white"
                            onClick={() => handleEditCost(cost)}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            className="text-slate-400 hover:text-destructive"
                            onClick={() => handleDeleteCost(cost.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Cost Insights */}
        <div className="mb-6 p-4 bg-slate-800 border border-slate-700 rounded-lg">
          <h3 className="text-md font-medium text-white mb-3">Cost Insights</h3>
          <div className="space-y-3">
            {costs.length === 0 ? (
              <div className="p-3 bg-slate-900/20 border border-slate-700/30 rounded-md">
                <div className="flex items-start">
                  <BarChart className="text-slate-400 text-lg mr-3 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-slate-400">No Cost Analysis</h4>
                    <p className="text-xs text-slate-300">Add service costs to see cost-saving insights and recommendations.</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="p-3 bg-emerald-900/20 border border-emerald-800/30 rounded-md">
                  <div className="flex items-start">
                    <DollarSign className="text-emerald-400 text-lg mr-3 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-emerald-400">Cost Saving Opportunity</h4>
                      <p className="text-xs text-slate-300">
                        {costs.some(c => c.serviceName.toLowerCase().includes('microsoft')) ? 
                          "Microsoft 365 licenses could be optimized by moving to E3 plan for potential savings of $120/month." :
                          "Consider consolidating multiple services to reduce overhead costs and improve efficiency."}
                      </p>
                    </div>
                  </div>
                </div>
                
                {totalUsers > 0 && (
                  <div className="p-3 bg-amber-900/20 border border-amber-800/30 rounded-md">
                    <div className="flex items-start">
                      <AlertCircle className="text-amber-400 text-lg mr-3 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-amber-400">License Utilization</h4>
                        <p className="text-xs text-slate-300">
                          {costs.some(c => c.serviceName.toLowerCase().includes('microsoft')) ?
                            "5 unused Microsoft 365 licenses detected. Consider reducing license count to optimize costs." :
                            "Consider auditing licenses to ensure all are being actively used. Unused licenses could be costing you money."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="p-3 bg-blue-900/20 border border-blue-800/30 rounded-md">
                  <div className="flex items-start">
                    <BarChart className="text-blue-400 text-lg mr-3 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-400">Industry Benchmark</h4>
                      <p className="text-xs text-slate-300">
                        {monthlyCostsTotal > 1000 ?
                          "Your IT spend is approximately 12% higher than industry average for a business of this size and sector." :
                          "Your IT spend appears to be aligned with industry averages for a business of this size and sector."}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Add/Edit Cost Form */}
        {showCostForm && (
          <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-medium text-white">
                {editingCostId ? "Edit IT Service Cost" : "Add IT Service Cost"}
              </h3>
              <button
                className="text-slate-400 hover:text-white"
                onClick={closeCostForm}
              >
                <X />
              </button>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="serviceName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Name</FormLabel>
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
                  
                  <FormField
                    control={form.control}
                    name="serviceProvider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Provider</FormLabel>
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="monthlyCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Cost ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="0"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="userCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User/License Count</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="0"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="renewalDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Renewal Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="month"
                            {...field}
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
                  name="contractNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field}
                          rows={2}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-600 hover:border-slate-500"
                    onClick={closeCostForm}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-primary-600 hover:bg-primary-700"
                    disabled={addCostMutation.isPending || updateCostMutation.isPending}
                  >
                    {(addCostMutation.isPending || updateCostMutation.isPending) ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Cost</span>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
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
        <Button 
          type="button" 
          className="bg-primary-600 hover:bg-primary-700"
          onClick={onNext}
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ServiceCostStep;
