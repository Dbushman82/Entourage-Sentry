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
  AlertCircle,
  Loader2,
  TableProperties as SelectIcon
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const expenseFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  type: z.string().optional(),
  provider: z.string().optional(),
  perUserCost: z.number().min(0, { message: "Per unit cost must be at least 0" }),
  monthlyCost: z.number().min(0, { message: "Monthly cost must be at least 0" }),
  count: z.number().optional(),
  renewalDate: z.string().optional(),
  period: z.enum(["month", "year"]).default("month"),
  notes: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface ExpensesStepProps {
  onNext: () => void;
  onBack: () => void;
  companyId: number;
}

interface Expense {
  id: number;
  companyId: number;
  name: string;
  type?: string;
  provider?: string;
  monthlyCost: number;
  userCount?: number; // Legacy field - will be used until backend is updated
  count?: number;     // New field name
  renewalDate?: string;
  notes?: string;
  createdAt: string;
}

// Expense types
const expenseTypes = [
  "Software",
  "Service",
  "Host",
  "Vendor",
  "Consulting",
  "Hardware",
  "Consumable",
  "Utility"
];

const ExpensesStep = ({ onNext, onBack, companyId }: ExpensesStepProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  
  // Calculate expense summary
  const monthlyExpensesTotal = expenses.reduce((sum, expense) => sum + expense.monthlyCost, 0);
  const annualExpensesTotal = monthlyExpensesTotal * 12;
  const totalUsers = expenses.reduce((sum, expense) => sum + (expense.count || expense.userCount || 0), 0);
  const costPerUser = totalUsers > 0 ? Math.round(monthlyExpensesTotal / totalUsers) : 0;
  
  // Get the expenses for this company
  const { data: companyExpenses, isLoading } = useQuery({
    queryKey: [`/api/expenses/company/${companyId}`],
    enabled: companyId > 0,
  });
  
  useEffect(() => {
    if (companyExpenses && Array.isArray(companyExpenses)) {
      setExpenses(companyExpenses);
    }
  }, [companyExpenses]);
  
  // Add expense mutation
  const addExpenseMutation = useMutation({
    mutationFn: async (expense: any) => {
      // Map count to userCount for backward compatibility
      const mappedExpense = {
        ...expense,
        companyId,
        userCount: expense.count // Ensure we send userCount to API
      };
      const res = await apiRequest('POST', '/api/expenses', mappedExpense);
      return res.json();
    },
    onSuccess: (data) => {
      setExpenses([...expenses, data]);
      toast({
        title: "Expense added",
        description: "The expense has been added to the inventory.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/expenses/company/${companyId}`] });
      setShowExpenseForm(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error adding expense",
        description: (error as Error).message || "An error occurred while adding the expense.",
        variant: "destructive",
      });
    },
  });
  
  // Update expense mutation
  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      // Map count to userCount for backward compatibility
      const mappedData = {
        ...data,
        userCount: data.count // Ensure we send userCount to API
      };
      const res = await apiRequest('PUT', `/api/expenses/${id}`, mappedData);
      return res.json();
    },
    onSuccess: (data) => {
      setExpenses(expenses.map(expense => expense.id === data.id ? data : expense));
      toast({
        title: "Expense updated",
        description: "The expense has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/expenses/company/${companyId}`] });
      setShowExpenseForm(false);
      setEditingExpenseId(null);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error updating expense",
        description: (error as Error).message || "An error occurred while updating the expense.",
        variant: "destructive",
      });
    },
  });
  
  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: number) => {
      await apiRequest('DELETE', `/api/expenses/${expenseId}`, undefined);
    },
    onSuccess: (_, expenseId) => {
      setExpenses(expenses.filter(expense => expense.id !== expenseId));
      toast({
        title: "Expense removed",
        description: "The expense has been removed from the inventory.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/expenses/company/${companyId}`] });
    },
    onError: (error) => {
      toast({
        title: "Error removing expense",
        description: (error as Error).message || "An error occurred while removing the expense.",
        variant: "destructive",
      });
    },
  });
  
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      name: "",
      type: "",
      provider: "",
      perUserCost: 0,
      monthlyCost: 0,
      count: undefined,
      renewalDate: "",
      period: "month",
      notes: "",
    },
  });
  
  const resetForm = () => {
    form.reset({
      name: "",
      type: "",
      provider: "",
      perUserCost: 0,
      monthlyCost: 0,
      count: undefined,
      renewalDate: "",
      period: "month",
      notes: "",
    });
  };
  
  const handleAddExpense = () => {
    setEditingExpenseId(null);
    resetForm();
    setShowExpenseForm(true);
  };
  
  const handleEditExpense = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    // Get the count value (count if available, otherwise userCount)
    const countValue = expense.count || expense.userCount || 0;
    // Calculate per user cost from monthlyCost and count
    const perUserCost = countValue > 0 
      ? Math.round(expense.monthlyCost / countValue) 
      : 0;
    
    form.reset({
      name: expense.name,
      type: expense.type || "",
      provider: expense.provider || "",
      perUserCost: perUserCost,
      monthlyCost: expense.monthlyCost,
      count: countValue,
      renewalDate: expense.renewalDate || "",
      period: "month", // Default to monthly when editing
      notes: expense.notes || "",
    });
    setShowExpenseForm(true);
  };
  
  const handleDeleteExpense = (expenseId: number) => {
    deleteExpenseMutation.mutate(expenseId);
  };
  
  const closeExpenseForm = () => {
    setShowExpenseForm(false);
    setEditingExpenseId(null);
  };
  
  const onSubmit = (values: ExpenseFormValues) => {
    // Ensure monthlyCost is correctly calculated from perUserCost * count
    if (values.count && values.perUserCost) {
      // If period is year, convert yearly cost to monthly cost
      if (values.period === "year") {
        values.monthlyCost = (values.perUserCost * values.count) / 12;
      } else {
        values.monthlyCost = values.perUserCost * values.count;
      }
    }
    
    if (editingExpenseId) {
      updateExpenseMutation.mutate({ id: editingExpenseId, data: values });
    } else {
      addExpenseMutation.mutate(values);
    }
  };

  return (
    <div>
      <div className="p-6 border-b border-slate-700 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Expense Tracking</h2>
        <div className="flex space-x-2">
          <span className="px-2 py-1 bg-primary-900/50 text-primary-400 text-xs rounded-md">Step 4 of 7</span>
        </div>
      </div>
      <div className="p-6">
        
        {/* Expense Summary */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
            <h4 className="text-sm font-medium text-slate-400 mb-1">Expenses Added</h4>
            <span className="text-3xl text-white font-semibold">{expenses.length}</span>
          </div>
          <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
            <h4 className="text-sm font-medium text-slate-400 mb-1">Monthly Expenses</h4>
            <span className="text-3xl text-white font-semibold">${monthlyExpensesTotal}</span>
          </div>
          <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
            <h4 className="text-sm font-medium text-slate-400 mb-1">Annual Expenses</h4>
            <span className="text-3xl text-white font-semibold">${annualExpensesTotal}</span>
          </div>
        </div>
        
        {/* Expenses Table */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-md font-medium text-white">Expenses</h3>
            <Button 
              className="px-3 py-1 bg-primary-600 hover:bg-primary-700 h-auto text-sm"
              onClick={handleAddExpense}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Expense
            </Button>
          </div>
          
          {/* Add/Edit Expense Form */}
          {showExpenseForm && (
            <div className="relative bg-slate-800 border border-slate-700 mb-4 p-4 rounded-lg">
              <div className="absolute top-2 right-2">
                <button 
                  className="text-slate-400 hover:text-white"
                  onClick={closeExpenseForm}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    <div>
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs mb-1 block">Name</FormLabel>
                            <FormControl>
                              <Input className="h-8 text-sm bg-slate-900" placeholder="Spotify" {...field} />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div>
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs mb-1 block">Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-8 text-sm bg-slate-900">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {expenseTypes.map((type) => (
                                  <SelectItem key={type} value={type} className="text-sm">
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div>
                      <FormField
                        control={form.control}
                        name="provider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs mb-1 block">Provider</FormLabel>
                            <FormControl>
                              <Input className="h-8 text-sm bg-slate-900" placeholder="Microsoft, Amazon, etc." {...field} />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div>
                      <FormField
                        control={form.control}
                        name="renewalDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs mb-1 block">Renewal Date</FormLabel>
                            <FormControl>
                              <Input 
                                className="h-8 text-sm bg-slate-900"
                                type="date" 
                                placeholder="mm/dd/yyyy"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    <div>
                      <FormField
                        control={form.control}
                        name="count"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs mb-1 block">Count</FormLabel>
                            <FormControl>
                              <Input 
                                className="h-8 text-sm bg-slate-900"
                                placeholder="0" 
                                type="number" 
                                {...field}
                                value={field.value || ''}
                                onChange={e => {
                                  const count = e.target.value ? parseInt(e.target.value) : undefined;
                                  field.onChange(count);
                                  
                                  // Update monthly cost when count changes
                                  const perUserCost = form.getValues('perUserCost') || 0;
                                  const period = form.getValues('period');
                                  
                                  if (count && perUserCost) {
                                    // If period is year, convert to monthly cost
                                    const monthlyCost = period === "year" 
                                      ? (perUserCost * count) / 12 
                                      : perUserCost * count;
                                    
                                    form.setValue('monthlyCost', monthlyCost);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div>
                      <FormField
                        control={form.control}
                        name="perUserCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs mb-1 block">Cost ($)</FormLabel>
                            <FormControl>
                              <Input 
                                className="h-8 text-sm bg-slate-900"
                                placeholder="0.00" 
                                type="number" 
                                {...field}
                                onChange={e => {
                                  const cost = parseFloat(e.target.value);
                                  field.onChange(cost);
                                  
                                  // Update monthly cost when per unit cost changes
                                  const count = form.getValues('count') || 0;
                                  const period = form.getValues('period');
                                  
                                  if (count && cost) {
                                    // If period is year, convert to monthly cost
                                    const monthlyCost = period === "year" 
                                      ? (cost * count) / 12 
                                      : cost * count;
                                      
                                    form.setValue('monthlyCost', monthlyCost);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div>
                      <FormField
                        control={form.control}
                        name="period"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs mb-1 block">Per</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                
                                // Update total cost based on period
                                const perUserCost = form.getValues('perUserCost') || 0;
                                const count = form.getValues('count') || 0;
                                
                                if (count && perUserCost) {
                                  // If yearly, we divide by 12 to get monthly cost
                                  const monthlyCost = value === "year" 
                                    ? (perUserCost * count) / 12 
                                    : perUserCost * count;
                                  
                                  form.setValue('monthlyCost', monthlyCost);
                                }
                              }}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-8 text-sm bg-slate-900">
                                  <SelectValue placeholder="Period" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="month" className="text-sm">Month</SelectItem>
                                <SelectItem value="year" className="text-sm">Year</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div>
                      <FormField
                        control={form.control}
                        name="monthlyCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs mb-1 block">Total</FormLabel>
                            <FormControl>
                              <Input 
                                className="h-8 text-sm bg-slate-900"
                                placeholder="0.00" 
                                type="number" 
                                {...field}
                                onChange={e => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs mb-1 block">Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter any additional notes about this expense..." 
                              className="h-20 text-sm bg-slate-900 min-h-16"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={closeExpenseForm}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      className="h-8 text-xs"
                      disabled={addExpenseMutation.isPending || updateExpenseMutation.isPending}
                    >
                      {(addExpenseMutation.isPending || updateExpenseMutation.isPending) && (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      )}
                      Save
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
          
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent text-primary-500 motion-reduce:animate-[spin_1.5s_linear_infinite]">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center p-8 bg-slate-800 border border-slate-700 rounded-lg">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center mb-4">
                <DollarSign className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No expenses added yet</h3>
              <p className="text-slate-400 mb-4">Start tracking expenses by adding your first expense item.</p>
              <Button 
                className="bg-primary-600 hover:bg-primary-700"
                onClick={handleAddExpense}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Your First Expense
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-800">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Provider</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Per Unit Cost</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Count</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Total Cost</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Renewal</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800 divide-y divide-slate-700">
                  {expenses.map((expense) => {
                    // Calculate per unit cost for display
                    // Get the count value (count if available, otherwise userCount)
                    const countValue = expense.count || expense.userCount || 0;
                    const perUserCost = countValue > 0 
                      ? Math.round(expense.monthlyCost / countValue) 
                      : 0;
                      
                    return (
                    <tr key={expense.id}>
                      <td className="px-4 py-3 text-sm text-white">{expense.name}</td>
                      <td className="px-4 py-3 text-sm text-white">{expense.type || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-white">{expense.provider || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-white">${perUserCost}</td>
                      <td className="px-4 py-3 text-sm text-white">{expense.count || expense.userCount || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-white">${expense.monthlyCost}</td>
                      <td className="px-4 py-3 text-sm text-white">
                        {expense.renewalDate ? new Date(expense.renewalDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        <div className="flex space-x-2">
                          <button 
                            className="text-slate-400 hover:text-white"
                            onClick={() => handleEditExpense(expense)}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            className="text-slate-400 hover:text-destructive"
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Expense Insights */}
        <div className="mb-6 p-4 bg-slate-800 border border-slate-700 rounded-lg">
          <h3 className="text-md font-medium text-white mb-3">Cost Insights</h3>
          <div className="space-y-3">
            {expenses.length === 0 ? (
              <div className="p-3 bg-slate-900/20 border border-slate-700/30 rounded-md">
                <div className="flex items-start">
                  <BarChart className="text-slate-400 text-lg mr-3 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-slate-400">No Expense Analysis</h4>
                    <p className="text-xs text-slate-300">Add expenses to see cost-saving insights and recommendations.</p>
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
                        {expenses.some(e => e.name.toLowerCase().includes('microsoft')) ? 
                          "Microsoft 365 licenses could be optimized by moving to E3 plan for potential savings of $120/month." :
                          "Consider consolidating multiple subscriptions to reduce overhead costs and improve efficiency."}
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
                          {expenses.some(e => e.name.toLowerCase().includes('microsoft')) ?
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
                        {monthlyExpensesTotal > 1000 ?
                          "Your spending is approximately 12% higher than industry average for a business of this size and sector." :
                          "Your spending appears to be aligned with industry averages for a business of this size and sector."}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        

        
        <div className="flex justify-between mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          
          <Button
            type="button"
            onClick={onNext}
            className="flex items-center"
          >
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExpensesStep;