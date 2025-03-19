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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  firstName: z.string().optional().default(""),
  lastName: z.string().optional().default(""),
  email: z.string().email("Please enter a valid email").optional().default(""),
  expirationDuration: z.string().optional().default("7d"),
});

type NewAssessmentFormValues = z.infer<typeof newAssessmentSchema>;

interface NewAssessmentDialogProps {
  open: boolean;
  onClose: () => void;
}

const NewAssessmentDialog = ({ open, onClose }: NewAssessmentDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // Define form
  const form = useForm<NewAssessmentFormValues>({
    resolver: zodResolver(newAssessmentSchema),
    defaultValues: {
      companyName: "",
      companyWebsite: "",
      firstName: "",
      lastName: "",
      email: "",
      expirationDuration: "7d",
    },
  });
  
  // Create a new assessment and generate a link
  const createAssessmentMutation = useMutation({
    mutationFn: async (data: NewAssessmentFormValues) => {
      // Format website properly
      let formattedWebsite = data.companyWebsite.trim();
      if (formattedWebsite && !formattedWebsite.match(/^https?:\/\//)) {
        formattedWebsite = `https://${formattedWebsite}`;
      }
      
      const res = await apiRequest("POST", "/api/assessments", {
        contact: {
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          phone: "",
          companyWebsite: formattedWebsite, // Include properly formatted website
        },
        company: {
          name: data.companyName,
          website: formattedWebsite, // Make sure it's the same format for both
        },
      });
      const result = await res.json();
      
      // Get the created assessment and generate a link
      const linkRes = await apiRequest("POST", `/api/assessments/${result.assessment.id}/link`, {
        expirationDuration: data.expirationDuration,
      });
      
      return {
        assessment: result.assessment,
        link: await linkRes.json()
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      toast({
        title: "Assessment Created",
        description: `Assessment ${data.assessment.referenceCode} has been created successfully.`,
      });
      
      // Show success message with the generated link
      toast({
        title: "Link Generated",
        description: "Assessment link has been generated. You can now share it with your client.",
      });
      
      // Copy link to clipboard
      if (data.link && data.link.url) {
        navigator.clipboard.writeText(data.link.url)
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
      }
      
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Assessment",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: NewAssessmentFormValues) => {
    createAssessmentMutation.mutate(values);
  };
  
  const isPending = createAssessmentMutation.isPending;
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Assessment</DialogTitle>
          <DialogDescription className="text-slate-400">
            Create a new client assessment and generate a shareable link.
          </DialogDescription>
        </DialogHeader>
        
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
            
            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} className="bg-slate-700 border-slate-600" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} className="bg-slate-700 border-slate-600" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="contact@example.com" {...field} className="bg-slate-700 border-slate-600" />
                  </FormControl>
                  <FormDescription>
                    Optional contact email
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                    Set how long the assessment link will be valid. Your client will be able to access the assessment until this time.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
      </DialogContent>
    </Dialog>
  );
};

export default NewAssessmentDialog;