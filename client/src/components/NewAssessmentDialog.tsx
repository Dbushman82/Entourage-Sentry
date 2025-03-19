import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// Define schema for new assessment
const newAssessmentSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  companyWebsite: z.string().min(3, "Website is required"),
  expirationDuration: z.string().optional().default("7d"),
  generateLink: z.boolean().default(true),
});

type NewAssessmentFormValues = z.infer<typeof newAssessmentSchema>;

interface NewAssessmentDialogProps {
  onClose: () => void;
}

const NewAssessmentDialog = ({ onClose }: NewAssessmentDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // Define form
  const form = useForm<NewAssessmentFormValues>({
    resolver: zodResolver(newAssessmentSchema),
    defaultValues: {
      companyName: "",
      companyWebsite: "",
      expirationDuration: "7d",
      generateLink: true,
    },
  });
  
  // Create a new assessment
  const createAssessmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/assessments", {
        contact: {
          firstName: "Contact",
          lastName: "Pending",
          email: "pending@example.com",
          phone: "",
        },
        company: {
          name: data.companyName,
          website: data.companyWebsite,
        },
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      toast({
        title: "Assessment Created",
        description: `Assessment ${data.assessment.referenceCode} has been created successfully.`,
      });
      
      // If generateLink is true, generate a link for the assessment
      if (form.getValues().generateLink) {
        generateLinkMutation.mutate({
          assessmentId: data.assessment.id,
          expirationDuration: form.getValues().expirationDuration,
        });
      } else {
        onClose();
        // Navigate to the assessment for further editing
        setLocation(`/assessment/${data.assessment.id}`);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Assessment",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Generate a link for the assessment
  const generateLinkMutation = useMutation({
    mutationFn: async (data: { assessmentId: number; expirationDuration: string }) => {
      const res = await apiRequest("POST", `/api/assessments/${data.assessmentId}/link`, {
        expirationDuration: data.expirationDuration,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      
      // Show success message with the generated link
      toast({
        title: "Link Generated",
        description: "Assessment link has been generated. You can now share it with your client.",
      });
      
      // Copy link to clipboard
      navigator.clipboard.writeText(data.url)
        .then(() => {
          toast({
            title: "Link Copied",
            description: "Assessment link has been copied to your clipboard.",
          });
        })
        .catch(() => {
          toast({
            title: "Copy Failed",
            description: "Please copy the link manually.",
            variant: "destructive",
          });
        });
      
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error Generating Link",
        description: error.message,
        variant: "destructive",
      });
      onClose();
    },
  });
  
  const onSubmit = (values: NewAssessmentFormValues) => {
    createAssessmentMutation.mutate(values);
  };
  
  const isPending = createAssessmentMutation.isPending || generateLinkMutation.isPending;
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Acme Inc." {...field} className="bg-slate-700 border-slate-600" />
              </FormControl>
              <FormDescription>
                Enter the company name for this assessment.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="companyWebsite"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Website</FormLabel>
              <FormControl>
                <Input placeholder="example.com" {...field} className="bg-slate-700 border-slate-600" />
              </FormControl>
              <FormDescription>
                Enter the company website URL.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="generateLink"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Assessment Access</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => field.onChange(value === "true")}
                  defaultValue={field.value ? "true" : "false"}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="true" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Generate shareable link
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="false" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Complete assessment manually
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                Choose whether to generate a shareable link for client self-service or complete the assessment manually.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {form.watch("generateLink") && (
          <FormField
            control={form.control}
            name="expirationDuration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link Expiration</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue placeholder="Select an expiration time" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="1d">1 Day</SelectItem>
                    <SelectItem value="3d">3 Days</SelectItem>
                    <SelectItem value="7d">7 Days</SelectItem>
                    <SelectItem value="14d">14 Days</SelectItem>
                    <SelectItem value="30d">30 Days</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Set how long the assessment link will be valid.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="border-slate-600 hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isPending}
            className="bg-primary-600 hover:bg-primary-700"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Creating..." : "Create Assessment"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default NewAssessmentDialog;