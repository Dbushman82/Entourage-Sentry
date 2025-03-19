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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const serviceInterests = [
  { id: "mssp", label: "Managed Security Services", desc: "Proactive threat detection, prevention, and response" },
  { id: "desktop", label: "Desktop/End-user Support", desc: "Helpdesk, troubleshooting, and user assistance" },
  { id: "consulting", label: "Solutions Consulting", desc: "Strategic IT planning and solutions architecture" },
  { id: "cloud", label: "Cloud Management", desc: "Cloud infrastructure design, migration and management" },
  { id: "infrastructure", label: "Infrastructure Management", desc: "Server, network, and data center management" },
  { id: "backup", label: "Backup & Disaster Recovery", desc: "Data protection and business continuity" },
  { id: "compliance", label: "Compliance Management", desc: "Regulatory compliance and auditing" },
  { id: "voip", label: "VoIP/Telecommunications", desc: "Phone systems, conferencing, and communications" },
];

const painPointsSchema = z.object({
  description: z.string().optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  responseTime: z.string().optional(),
  interests: z.record(z.boolean()).default({}),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  additionalNotes: z.string().optional(),
});

type PainPointsFormValues = z.infer<typeof painPointsSchema>;

interface PainPointsStepProps {
  onSubmit: () => void;
  onBack: () => void;
  companyId: number;
  defaultValues?: Partial<PainPointsFormValues>;
}

const PainPointsStep = ({ onSubmit, onBack, companyId, defaultValues = {} }: PainPointsStepProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Set up default interests values
  const defaultInterests = serviceInterests.reduce((acc, interest) => {
    acc[interest.id] = defaultValues.interests?.[interest.id] || false;
    return acc;
  }, {} as Record<string, boolean>);
  
  const form = useForm<PainPointsFormValues>({
    resolver: zodResolver(painPointsSchema),
    defaultValues: {
      description: "",
      priority: defaultValues.priority || "medium",
      responseTime: "",
      interests: defaultInterests,
      budget: "",
      timeline: "",
      additionalNotes: "",
      ...defaultValues
    },
  });
  
  // Submit pain points and complete assessment
  const submitMutation = useMutation({
    mutationFn: async (data: PainPointsFormValues) => {
      // First save the pain points data
      const painPointsRes = await apiRequest('POST', '/api/pain-points', {
        ...data,
        companyId,
      });
      const painPointsData = await painPointsRes.json();
      
      // Then mark the assessment as complete
      const assessment = await queryClient.fetchQuery({
        queryKey: [`/api/assessments`],
      });
      
      const assessmentId = Array.isArray(assessment) ? 
        assessment.find((a: any) => a.companyId === companyId)?.id : null;
      
      if (assessmentId) {
        const completeRes = await apiRequest('PUT', `/api/assessments/${assessmentId}/complete`, {});
        return completeRes.json();
      }
      
      return painPointsData;
    },
    onSuccess: () => {
      toast({
        title: "Assessment completed",
        description: "Thank you for completing the client assessment.",
      });
      onSubmit();
    },
    onError: (error) => {
      toast({
        title: "Error submitting assessment",
        description: (error as Error).message || "An error occurred while submitting the assessment.",
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = (values: PainPointsFormValues) => {
    submitMutation.mutate(values);
  };

  return (
    <div>
      <div className="p-6 border-b border-slate-700 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Pain Points & Service Interests</h2>
        <div className="flex space-x-2">
          <span className="px-2 py-1 bg-primary-900/50 text-primary-400 text-xs rounded-md">Step 7 of 7</span>
        </div>
      </div>
      <div className="p-6">
        <p className="text-slate-400 mb-6">Identify current IT challenges and areas of service interest.</p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current IT Challenges</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field}
                      rows={4}
                      placeholder="Describe current IT challenges and pain points..."
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Challenge Priority</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="space-y-2"
                    >
                      <div className="flex items-center">
                        <RadioGroupItem value="critical" id="priorityCritical" className="text-primary-600 border-slate-500 focus:ring-primary-500 bg-slate-700" />
                        <label htmlFor="priorityCritical" className="ml-2 text-sm flex items-center">
                          <span className="px-2 py-0.5 bg-destructive/20 text-destructive text-xs rounded mr-2">Critical</span>
                          <span className="text-slate-300">Severe impact on business operations</span>
                        </label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem value="high" id="priorityHigh" className="text-primary-600 border-slate-500 focus:ring-primary-500 bg-slate-700" />
                        <label htmlFor="priorityHigh" className="ml-2 text-sm flex items-center">
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-xs rounded mr-2">High</span>
                          <span className="text-slate-300">Significant impact on productivity</span>
                        </label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem value="medium" id="priorityMedium" className="text-primary-600 border-slate-500 focus:ring-primary-500 bg-slate-700" />
                        <label htmlFor="priorityMedium" className="ml-2 text-sm flex items-center">
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-xs rounded mr-2">Medium</span>
                          <span className="text-slate-300">Moderate impact on efficiency</span>
                        </label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem value="low" id="priorityLow" className="text-primary-600 border-slate-500 focus:ring-primary-500 bg-slate-700" />
                        <label htmlFor="priorityLow" className="ml-2 text-sm flex items-center">
                          <span className="px-2 py-0.5 bg-slate-500/20 text-slate-300 text-xs rounded mr-2">Low</span>
                          <span className="text-slate-300">Minor inconvenience</span>
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="responseTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Response Time Expectations</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select expected response time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="_none">Select expected response time</SelectItem>
                      <SelectItem value="1hour">Within 1 hour</SelectItem>
                      <SelectItem value="4hours">Within 4 hours</SelectItem>
                      <SelectItem value="sameday">Same business day</SelectItem>
                      <SelectItem value="nextday">Next business day</SelectItem>
                      <SelectItem value="48hours">Within 48 hours</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel className="block text-sm font-medium text-slate-300 mb-2">Service Interests</FormLabel>
              <p className="text-xs text-slate-400 mb-3">Select the services you're interested in exploring:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {serviceInterests.map(interest => (
                  <FormField
                    key={interest.id}
                    control={form.control}
                    name={`interests.${interest.id}`}
                    render={({ field }) => (
                      <div className="flex items-center p-3 bg-slate-800 border border-slate-700 rounded-md">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-4 w-4 text-primary-600 border-slate-500 rounded focus:ring-primary-500 bg-slate-700"
                          />
                        </FormControl>
                        <div className="ml-3 block text-sm text-white">
                          <span className="font-medium">{interest.label}</span>
                          <span className="block text-xs text-slate-400 mt-0.5">{interest.desc}</span>
                        </div>
                      </div>
                    )}
                  />
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Budget Range (Monthly)</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Select budget range" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="_none">Select budget range</SelectItem>
                        <SelectItem value="under1k">Under $1,000</SelectItem>
                        <SelectItem value="1k-5k">$1,000 - $5,000</SelectItem>
                        <SelectItem value="5k-10k">$5,000 - $10,000</SelectItem>
                        <SelectItem value="10k-25k">$10,000 - $25,000</SelectItem>
                        <SelectItem value="over25k">Over $25,000</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="timeline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Decision Timeline</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Select timeline" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="_none">Select timeline</SelectItem>
                        <SelectItem value="immediate">Immediate (1-2 weeks)</SelectItem>
                        <SelectItem value="month">Within a month</SelectItem>
                        <SelectItem value="quarter">This quarter</SelectItem>
                        <SelectItem value="sixmonths">Next 6 months</SelectItem>
                        <SelectItem value="year">Within a year</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="additionalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field}
                      rows={3}
                      placeholder="Any other information you'd like to share..."
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
                type="submit"
                className="bg-success-600 hover:bg-success-700"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Assessment</span>
                    <Check className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default PainPointsStep;
