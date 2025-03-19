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
import { Button } from "@/components/ui/button";
import { ArrowRight, Save, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const contactFormSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters" }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().optional(),
  companyWebsite: z.string()
    .transform(val => {
      if (!val) return '';
      
      // Remove any leading/trailing whitespace
      val = val.trim();
      
      // Add https:// if not present and the value is not empty
      if (val && !val.match(/^https?:\/\//)) {
        return `https://${val}`;
      }
      return val;
    })
    // No validation at all - accept any input
    .optional(),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface ContactInfoStepProps {
  onNext: (data: ContactFormValues) => void;
  onSave: (data: ContactFormValues) => void;
  defaultValues?: Partial<ContactFormValues>;
}

const ContactInfoStep = ({ onNext, onSave, defaultValues = {} }: ContactInfoStepProps) => {
  const { toast } = useToast();
  
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      companyWebsite: "",
      ...defaultValues
    },
  });
  
  const handleSaveAndExit = () => {
    const values = form.getValues();
    onSave(values);
    toast({
      title: "Assessment saved",
      description: "Your progress has been saved. You can return later to continue.",
    });
  };

  const handleSubmit = (values: ContactFormValues) => {
    onNext(values);
  };

  return (
    <div>
      <div className="p-6 border-b border-slate-700 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Basic Contact Information</h2>
        <div className="flex space-x-2">
          <span className="px-2 py-1 bg-primary-900/50 text-primary-400 text-xs rounded-md">Step 1 of 7</span>
        </div>
      </div>
      <div className="p-6">
        <p className="text-slate-400 mb-6">Let's start with some basic information about your prospect.</p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
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
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
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
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="email"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="companyWebsite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Website URL</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                        <Globe size={16} />
                      </div>
                      <Input 
                        {...field} 
                        type="text"
                        placeholder="example.com"
                        className="bg-slate-700 border-slate-600 text-white pl-10"
                      />
                    </div>
                  </FormControl>
                  <p className="mt-1 text-xs text-slate-400">We'll use this to auto-populate company information in the next step.</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
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
            
            <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700 flex justify-between items-center -mx-6 -mb-6 mt-6">
              <Button
                type="button"
                variant="ghost"
                className="text-slate-400 hover:text-white"
                onClick={handleSaveAndExit}
              >
                <Save className="mr-2 h-4 w-4" />
                Save & Exit
              </Button>
              <Button type="submit" className="bg-primary-600 hover:bg-primary-700">
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

export default ContactInfoStep;
