import React, { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
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
  Link as LinkIcon,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const AssessmentCustomize = () => {
  const [match, params] = useRoute("/assessments/:id/customize");
  const [, setLocation] = useLocation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("assessment-questions");
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const assessmentId = match ? parseInt(params.id) : 0;

  // Query to get assessment data
  const { data: assessment, isLoading: assessmentLoading } = useQuery({
    queryKey: [`/api/assessments/${assessmentId}`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/assessments/${assessmentId}`);
      return res.json();
    },
    enabled: match && !!assessmentId,
  });

  // Query to get assessment-specific questions
  const { data: questions, isLoading: questionsLoading, error } = useQuery({
    queryKey: [`/api/assessments/${assessmentId}/questions`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/assessments/${assessmentId}/questions`);
      return res.json();
    },
    enabled: match && !!assessmentId,
  });

  // Query to get global questions for the library
  const { data: globalQuestions, isLoading: globalQuestionsLoading } = useQuery({
    queryKey: ['/api/questions/global'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/questions/global');
      return res.json();
    },
  });

  // Query to get all industries
  const { data: industries, isLoading: industriesLoading } = useQuery({
    queryKey: ['/api/industries'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/industries');
      return res.json();
    },
  });

  // Query to get industry-specific questions based on selected industry
  const { data: industryQuestions, isLoading: industryQuestionsLoading } = useQuery({
    queryKey: ['/api/questions/industry', selectedIndustry],
    queryFn: async () => {
      if (!selectedIndustry) return [];
      const res = await apiRequest('GET', `/api/questions/industry/${selectedIndustry}`);
      return res.json();
    },
    enabled: !!selectedIndustry,
  });

  // Loading state
  const isLoading = assessmentLoading || questionsLoading || globalQuestionsLoading || industriesLoading || (!!selectedIndustry && industryQuestionsLoading);

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
        assessmentId: assessmentId, // Specific to this assessment
        global: false,
        category: 'assessment', // Required field - assessment-specific question
        allowMultiple: false, // Required field
        createdBy: 1 // Default to admin user ID 1
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Question created",
        description: "The custom question has been created successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/assessments/${assessmentId}/questions`] });
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
      queryClient.invalidateQueries({ queryKey: [`/api/assessments/${assessmentId}/questions`] });
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

  if (!match) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Invalid Assessment</h1>
            <p className="text-slate-400 my-4">The assessment you are trying to customize does not exist or you don't have permission to access it.</p>
            <Button onClick={() => setLocation("/dashboard")}>Return to Dashboard</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => setLocation("/dashboard")} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Customize Assessment</h1>
              {assessment && (
                <p className="text-slate-400">
                  Adding custom questions to assessment: <span className="font-medium text-slate-300">{assessment.referenceCode}</span>
                </p>
              )}
            </div>
          </div>
          
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>
        
        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center p-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading assessment data...</span>
          </div>
        ) : (
          <Tabs defaultValue="assessment-questions" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="assessment-questions">Assessment Questions</TabsTrigger>
              <TabsTrigger value="question-library">Question Library</TabsTrigger>
            </TabsList>
            
            {/* Assessment Questions Tab */}
            <TabsContent value="assessment-questions">
              {/* Industry Selection Dropdown */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Label htmlFor="industry-select" className="text-white font-medium">Select Industry to View Questions</Label>
                  <Select 
                    value={selectedIndustry || "all"} 
                    onValueChange={value => setSelectedIndustry(value === "all" ? null : value)}
                  >
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="All Industries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Industries</SelectItem>
                      {industries && industries.map((industry: any) => (
                        <SelectItem key={industry.id} value={String(industry.id)}>{industry.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card className="bg-slate-800 border-slate-700 mb-6">
                <CardHeader>
                  <CardTitle className="text-white">Assessment-Specific Questions</CardTitle>
                  <CardDescription className="text-slate-400">
                    These questions will only appear on this specific assessment
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {error ? (
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
                      <p className="text-slate-400 mb-4">Add questions to customize this assessment</p>
                      
                      <Button onClick={() => setIsFormOpen(true)}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Question
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {questions.filter((q: any) => !q.global).map((question: any) => (
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
              
              {/* Industry-specific Questions Section - only show when industry is selected */}
              {selectedIndustry && (
                <Card className="bg-slate-800 border-slate-700 mb-6">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Industry-Specific Questions
                      {industries && selectedIndustry && (
                        <span className="ml-2 text-primary-300">
                          ({industries.find((i: any) => i.id === parseInt(selectedIndustry))?.name})
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Questions specific to the selected industry that will be included in this assessment
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    {industryQuestionsLoading ? (
                      <div className="flex justify-center items-center p-6">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="ml-2">Loading industry questions...</span>
                      </div>
                    ) : !industryQuestions || industryQuestions.length === 0 ? (
                      <div className="text-center p-6 border border-slate-700 rounded-md">
                        <p className="text-slate-400">No questions found for this industry.</p>
                        <Button 
                          variant="link" 
                          onClick={() => setLocation("/customize-assessment")}
                          className="mt-2"
                        >
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Go to Question Library
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {industryQuestions.map((question: any) => (
                          <Card key={question.id} className="relative border-slate-700 bg-slate-800/50">
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
                                
                                <Badge variant="outline" className="bg-green-900/30 text-green-300 border-green-800">
                                  Industry
                                </Badge>
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
              )}

              {/* Global Questions Section */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Global Questions (Available to All Assessments)</CardTitle>
                  <CardDescription className="text-slate-400">
                    These global questions will also be included in this assessment
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {globalQuestionsLoading ? (
                    <div className="flex justify-center items-center p-6">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2">Loading global questions...</span>
                    </div>
                  ) : !globalQuestions || globalQuestions.length === 0 ? (
                    <div className="text-center p-6 border border-slate-700 rounded-md">
                      <p className="text-slate-400">No global questions have been created yet.</p>
                      <Button 
                        variant="link" 
                        onClick={() => setLocation("/customize-assessment")}
                        className="mt-2"
                      >
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Go to Question Library
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {globalQuestions.map((question: any) => (
                        <Card key={question.id} className="relative border-slate-700 bg-slate-800/50">
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
                              
                              <Badge variant="outline" className="bg-blue-900/30 text-blue-300 border-blue-800">
                                Global
                              </Badge>
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
            </TabsContent>
            
            {/* Question Library Tab */}
            <TabsContent value="question-library">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Global Question Library</CardTitle>
                  <CardDescription className="text-slate-400">
                    Browse and manage questions from the global library
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {globalQuestionsLoading ? (
                    <div className="flex justify-center items-center p-6">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2">Loading global questions...</span>
                    </div>
                  ) : !globalQuestions || globalQuestions.length === 0 ? (
                    <div className="text-center p-6 border border-slate-700 rounded-md">
                      <p className="text-slate-400">No global questions have been created yet.</p>
                      <Button 
                        variant="link" 
                        onClick={() => setLocation("/customize-assessment")}
                        className="mt-2"
                      >
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Go to Question Library
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {globalQuestions.map((question: any) => (
                        <Card key={question.id} className="relative border-slate-700 bg-slate-800/50">
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
                              
                              <Badge variant="outline" className="bg-blue-900/30 text-blue-300 border-blue-800">
                                Global
                              </Badge>
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
                
                <CardFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setLocation("/customize-assessment")}
                    className="w-full"
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Manage Global Question Library
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
      
      <Footer />
      
      {/* Create Question Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Custom Question</DialogTitle>
            <DialogDescription className="text-slate-400">
              Add a new question to this assessment
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
                          <div className="space-y-2">
                            <div className="flex space-x-2">
                              <Input 
                                placeholder="Add an option" 
                                className="bg-slate-900 border-slate-700"
                                value={newOption}
                                onChange={e => setNewOption(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addOption();
                                  }
                                }}
                              />
                              <Button 
                                type="button" 
                                variant="secondary" 
                                onClick={addOption}
                              >
                                Add
                              </Button>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mt-2">
                              {form.getValues("options").map((option, index) => (
                                <Badge key={index} variant="secondary" className="bg-slate-700 flex items-center">
                                  {option}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 ml-1 hover:bg-slate-600 rounded-full p-0"
                                    onClick={() => removeOption(index)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createQuestionMutation.isPending}
                >
                  {createQuestionMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Create Question
                    </>
                  )}
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
            <AlertDialogCancel className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600"
              onClick={confirmDelete}
              disabled={deleteQuestionMutation.isPending}
            >
              {deleteQuestionMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AssessmentCustomize;