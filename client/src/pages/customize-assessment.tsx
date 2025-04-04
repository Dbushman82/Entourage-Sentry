import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PlusCircle,
  ArrowLeft,
  Check,
  Loader2,
  FileEdit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FormInput,
  ListChecks,
  AlignLeft,
  Settings,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const CustomizeAssessment = () => {
  const [, setLocation] = useLocation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query to get all custom questions
  const { data: questions, isLoading, error } = useQuery({
    queryKey: ['/api/questions/global'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/questions/global');
      return res.json();
    },
  });

  // Form schema for creating/editing custom questions
  const formSchema = z.object({
    question: z.string().min(3, { message: "Question text is required and must be at least 3 characters" }),
    description: z.string().optional(),
    type: z.enum(["text", "textarea", "select", "multiselect", "checkbox", "radio"]),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional().default([]),
    order: z.number().optional().default(0),
  });

  // Setup the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
      description: "",
      type: "text",
      required: false,
      options: [],
      order: 0
    },
  });

  // Reset form when opening
  useEffect(() => {
    if (isFormOpen) {
      form.reset({
        question: "",
        description: "",
        type: "text",
        required: false,
        options: [],
        order: 0
      });
    }
  }, [isFormOpen, form]);

  // Create question mutation
  const createQuestionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const res = await apiRequest('POST', '/api/questions', { 
        ...data,
        assessmentId: 0, // 0 means global question
        global: true
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Question created",
        description: "The custom question has been created successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/questions/global'] });
      setIsFormOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating question",
        description: error.message || "An error occurred while creating the question",
        variant: "destructive",
      });
    },
  });

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/questions/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Question deleted",
        description: "The custom question has been deleted successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/questions/global'] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting question",
        description: error.message || "An error occurred while deleting the question",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // Validate options if question type requires them
    if (["select", "multiselect", "checkbox", "radio"].includes(data.type) && (!data.options || data.options.length === 0)) {
      toast({
        title: "Options required",
        description: `The question type "${data.type}" requires at least one option`,
        variant: "destructive",
      });
      return;
    }

    createQuestionMutation.mutate(data);
  };

  // Handle adding new option
  const [newOption, setNewOption] = useState("");
  
  const addOption = () => {
    if (!newOption.trim()) return;
    
    const currentOptions = form.getValues("options") || [];
    form.setValue("options", [...currentOptions, newOption.trim()]);
    setNewOption("");
  };

  // Handle removing an option
  const removeOption = (index: number) => {
    const currentOptions = form.getValues("options") || [];
    form.setValue("options", currentOptions.filter((_, i) => i !== index));
  };

  // Handle question type change
  const handleTypeChange = (value: string) => {
    form.setValue("type", value as any);
    
    // If the question type doesn't need options, clear them
    if (!["select", "multiselect", "checkbox", "radio"].includes(value)) {
      form.setValue("options", []);
    }
  };

  // Confirm delete dialog
  const handleDeleteQuestion = (id: number) => {
    setSelectedQuestionId(id);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const confirmDelete = () => {
    if (selectedQuestionId) {
      deleteQuestionMutation.mutate(selectedQuestionId);
    }
  };

  // Get icon for question type
  const getTypeIcon = (type: string) => {
    switch(type) {
      case "text":
        return <FormInput className="h-4 w-4" />;
      case "textarea":
        return <AlignLeft className="h-4 w-4" />;
      case "select":
        return <Settings className="h-4 w-4" />;
      case "multiselect":
      case "checkbox":
        return <ListChecks className="h-4 w-4" />;
      case "radio":
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <FormInput className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => setLocation("/")} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Customize Assessments</h1>
              <p className="text-slate-400">Create and manage global custom questions for all assessments</p>
            </div>
          </div>
          
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>
        
        {/* Questions List */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Custom Questions Library</CardTitle>
            <CardDescription className="text-slate-400">
              These questions can be added to any assessment during the assessment process
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading questions...</span>
              </div>
            ) : error ? (
              <div className="text-center text-destructive p-10">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Failed to load questions. Please try again later.</p>
              </div>
            ) : !questions || questions.length === 0 ? (
              <div className="text-center p-10">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center mb-4">
                  <FormInput className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No custom questions found</h3>
                <p className="text-slate-400 mb-4">Create your first custom question to get started</p>
                
                <Button onClick={() => setIsFormOpen(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question: any) => (
                  <Card key={question.id} className="relative border-slate-700 transition-colors group">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-2">
                          <div className="mt-1">
                            {getTypeIcon(question.type)}
                          </div>
                          <div>
                            <CardTitle className="text-base text-white">{question.question}</CardTitle>
                            {question.description && (
                              <CardDescription>{question.description}</CardDescription>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteQuestion(question.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="bg-slate-700 text-slate-200">
                          {question.type}
                        </Badge>
                        
                        {question.required && (
                          <Badge>Required</Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    {["select", "multiselect", "checkbox", "radio"].includes(question.type) && question.options && (
                      <CardContent>
                        <div className="text-sm text-slate-400">Options:</div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {question.options.map((option: string, index: number) => (
                            <Badge key={index} variant="secondary" className="bg-slate-700">
                              {option}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Information Card */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">About Custom Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400 mb-4">
              Custom questions allow you to gather specific information from clients during the assessment process.
              These questions can be industry-specific, compliance-related, or tailored to your service offerings.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="border border-slate-700 rounded-md p-4">
                <h3 className="font-medium text-white mb-2 flex items-center">
                  <FormInput className="h-4 w-4 mr-2 text-primary" />
                  Text & Textarea Questions
                </h3>
                <p className="text-slate-400 text-sm">
                  Ideal for open-ended responses where clients need to provide detailed information or explanations.
                </p>
              </div>
              
              <div className="border border-slate-700 rounded-md p-4">
                <h3 className="font-medium text-white mb-2 flex items-center">
                  <ListChecks className="h-4 w-4 mr-2 text-primary" />
                  Multiple Choice Questions
                </h3>
                <p className="text-slate-400 text-sm">
                  Perfect for gathering structured data with predefined options, making analysis easier.
                </p>
              </div>
            </div>
            
            <p className="text-slate-400 text-sm">
              Add questions to this library to make them available for all assessments. During the assessment process,
              administrators can select which questions to include in each assessment.
            </p>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
      
      {/* Create Question Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Custom Question</DialogTitle>
            <DialogDescription className="text-slate-400">
              Add a new question to your custom questions library
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Text</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your question" 
                        className="bg-slate-900 border-slate-700"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add additional context or instructions" 
                        className="bg-slate-900 border-slate-700"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question Type</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={handleTypeChange}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-slate-900 border-slate-700">
                            <SelectValue placeholder="Select a question type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="text">Text (Single line)</SelectItem>
                          <SelectItem value="textarea">Text Area (Multiple lines)</SelectItem>
                          <SelectItem value="select">Dropdown (Single selection)</SelectItem>
                          <SelectItem value="multiselect">Multiple Selection</SelectItem>
                          <SelectItem value="checkbox">Checkboxes</SelectItem>
                          <SelectItem value="radio">Radio Buttons</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="required"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-end space-x-2 space-y-0 rounded-md">
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="required"
                          />
                          <Label htmlFor="required" className="text-sm font-normal">
                            Make this question required
                          </Label>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              {["select", "multiselect", "checkbox", "radio"].includes(form.getValues("type")) && (
                <div className="space-y-4 border border-slate-700 rounded-md p-4">
                  <FormField
                    control={form.control}
                    name="options"
                    render={() => (
                      <FormItem>
                        <FormLabel>Options</FormLabel>
                        <FormControl>
                          <ScrollArea className="h-40 rounded-md border border-slate-700 p-4">
                            {form.getValues("options")?.length > 0 ? (
                              <div className="space-y-2">
                                {form.getValues("options")?.map((option, index) => (
                                  <div key={index} className="flex items-center space-x-2">
                                    <div className="flex-1 p-2 bg-slate-900 rounded-md">
                                      {option}
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeOption(index)}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center text-slate-400 py-8">
                                <p>No options added yet</p>
                                <p className="text-sm">Add at least one option below</p>
                              </div>
                            )}
                          </ScrollArea>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add a new option"
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      className="bg-slate-900 border-slate-700"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addOption();
                        }
                      }}
                    />
                    <Button type="button" onClick={addOption}>
                      Add
                    </Button>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setIsFormOpen(false)}
                  className="border-slate-600"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createQuestionMutation.isPending}
                >
                  {createQuestionMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Question
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete this question? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={deleteQuestionMutation.isPending}
            >
              {deleteQuestionMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomizeAssessment;