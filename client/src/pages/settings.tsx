import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { AlertCircle, Edit, Loader2, Plus, Trash2, Settings as SettingsIcon } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { 
  Select, 
  SelectContent, 
  SelectGroup,
  SelectItem, 
  SelectLabel,
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type QuestionType = "text" | "textarea" | "select" | "multiselect" | "checkbox" | "radio";

interface CustomQuestion {
  id: number;
  assessmentId: number | null;
  global: boolean;
  question: string;
  description: string | null;
  type: QuestionType;
  options: string[];
  required: boolean;
  order: number;
  industries: string[];
  allowMultiple: boolean;
  createdAt: string;
  createdBy: number;
}

interface NewQuestionForm {
  question: string;
  description: string;
  type: QuestionType;
  options: string;
  required: boolean;
  global: boolean;
  industries: string[];
  allowMultiple: boolean;
}

interface Industry {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  createdBy: number;
}

interface IndustryForm {
  name: string;
  description: string;
}

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("questions");
  const [questionFilter, setQuestionFilter] = useState<string>("global");
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<CustomQuestion | null>(null);
  
  // Industry management state
  const [isAddingIndustry, setIsAddingIndustry] = useState(false);
  const [isEditingIndustry, setIsEditingIndustry] = useState(false);
  const [editingIndustry, setEditingIndustry] = useState<Industry | null>(null);
  const [industryToDelete, setIndustryToDelete] = useState<number | null>(null);
  const [isIndustryDeleteDialogOpen, setIsIndustryDeleteDialogOpen] = useState(false);
  
  const industryForm = useForm<IndustryForm>({
    defaultValues: {
      name: "",
      description: ""
    }
  });
  
  const form = useForm<NewQuestionForm>({
    defaultValues: {
      question: "",
      description: "",
      type: "text",
      options: "",
      required: false,
      global: true,
      industries: [],
      allowMultiple: false
    }
  });
  
  // Query all questions by default
  const { data: allQuestions, isLoading: isLoadingQuestions } = useQuery({
    queryKey: ['/api/questions'],
    queryFn: async () => {
      const res = await fetch('/api/questions');
      if (!res.ok) {
        throw new Error('Failed to fetch questions');
      }
      return res.json();
    },
    enabled: !!user,
  });
  
  // Filter questions based on the selected filter
  const filteredQuestions = useMemo(() => {
    if (!allQuestions) return [];
    
    const questions = allQuestions as CustomQuestion[];
    
    if (questionFilter === 'all') {
      return questions;
    } else if (questionFilter === 'global') {
      return questions.filter(q => q.global === true);
    } else if (questionFilter.startsWith('industry-')) {
      const industryId = parseInt(questionFilter.split('-')[1]);
      return questions.filter(q => 
        q.industries && Array.isArray(q.industries) && 
        q.industries.some(i => parseInt(i) === industryId)
      );
    }
    
    return questions;
  }, [allQuestions, questionFilter]);
  
  const { data: industries, isLoading: isLoadingIndustries } = useQuery<Industry[]>({
    queryKey: ['/api/industries'],
    enabled: !!user,
  });
  
  const createQuestionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/questions', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      toast({
        title: "Success",
        description: "Question has been created successfully.",
      });
      
      form.reset();
      setIsAddingQuestion(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message || "There was an error creating the question.",
        variant: "destructive",
      });
    }
  });
  
  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/questions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      toast({
        title: "Success",
        description: "Question has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message || "There was an error deleting the question.",
        variant: "destructive",
      });
    }
  });
  
  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiRequest('PUT', `/api/questions/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      toast({
        title: "Success",
        description: "Question has been updated successfully.",
      });
      
      form.reset();
      setIsEditingQuestion(false);
      setEditingQuestion(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message || "There was an error updating the question.",
        variant: "destructive",
      });
    }
  });
  
  // Handle editing a question
  const handleEditQuestion = (question: CustomQuestion) => {
    setEditingQuestion(question);
    
    // Convert options array to comma-separated string for the form
    const optionsString = question.options?.join(', ') || '';
    
    // Reset form and set values for editing
    form.reset({
      question: question.question,
      description: question.description || '',
      type: question.type,
      options: optionsString,
      required: question.required,
      global: question.global,
      industries: question.industries || [],
      allowMultiple: question.allowMultiple
    });
    
    setIsEditingQuestion(true);
  };
  
  const onSubmit = (data: NewQuestionForm) => {
    // Convert options string to array if needed
    const needsOptions = ["select", "multiselect", "checkbox", "radio"].includes(data.type);
    const optionsArray = needsOptions ? data.options.split(',').map(opt => opt.trim()) : [];
    
    // Determine the category based on global flag
    let category: "global" | "industry" | "assessment" = "assessment";
    if (data.global) {
      category = "global";
    } else if (data.industries && data.industries.length > 0) {
      category = "industry";
    }
    
    const formattedData = {
      question: data.question,
      description: data.description || null,
      type: data.type,
      options: needsOptions ? optionsArray : [],
      required: data.required,
      global: data.global, // This will determine if it's a global question
      // Only set assessmentId to 0 for global questions
      assessmentId: data.global ? 0 : null, // Will be overridden in custom assessment flows
      order: allQuestions ? (allQuestions as CustomQuestion[]).length + 1 : 0,
      industries: data.industries,
      allowMultiple: data.allowMultiple,
      createdBy: user?.id,
      category: category // Add the required category field
    };
    
    // Add some debug logging to verify what we're sending
    console.log('Submitting question with data:', formattedData);
    
    if (isEditingQuestion && editingQuestion) {
      // Update existing question
      updateQuestionMutation.mutate({
        id: editingQuestion.id,
        data: formattedData
      });
    } else {
      // Create new question
      createQuestionMutation.mutate(formattedData);
    }
  };
  
  const [questionToDelete, setQuestionToDelete] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const handleDeleteQuestion = (id: number) => {
    setQuestionToDelete(id);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (questionToDelete !== null) {
      deleteQuestionMutation.mutate(questionToDelete);
      setQuestionToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };
  
  // Industry management
  const createIndustryMutation = useMutation({
    mutationFn: async (data: IndustryForm) => {
      const formData = {
        ...data,
        createdBy: user?.id
      };
      const res = await apiRequest('POST', '/api/industries', formData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/industries'] });
      toast({
        title: "Success",
        description: "Industry has been added successfully.",
      });
      
      industryForm.reset();
      setIsAddingIndustry(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message || "There was an error adding the industry.",
        variant: "destructive",
      });
    }
  });
  
  const updateIndustryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: IndustryForm }) => {
      const res = await apiRequest('PUT', `/api/industries/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/industries'] });
      toast({
        title: "Success",
        description: "Industry has been updated successfully.",
      });
      
      industryForm.reset();
      setIsEditingIndustry(false);
      setEditingIndustry(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message || "There was an error updating the industry.",
        variant: "destructive",
      });
    }
  });
  
  const deleteIndustryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/industries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/industries'] });
      toast({
        title: "Success",
        description: "Industry has been deleted successfully.",
      });
      setIndustryToDelete(null);
      setIsIndustryDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message || "There was an error deleting the industry.",
        variant: "destructive",
      });
    }
  });
  
  const handleEditIndustry = (industry: Industry) => {
    setEditingIndustry(industry);
    industryForm.reset({
      name: industry.name,
      description: industry.description || ''
    });
    setIsEditingIndustry(true);
  };
  
  const onIndustrySubmit = (data: IndustryForm) => {
    if (isEditingIndustry && editingIndustry) {
      updateIndustryMutation.mutate({
        id: editingIndustry.id,
        data
      });
    } else {
      createIndustryMutation.mutate(data);
    }
  };
  
  const handleDeleteIndustry = (id: number) => {
    setIndustryToDelete(id);
    setIsIndustryDeleteDialogOpen(true);
  };
  
  const confirmIndustryDelete = () => {
    if (industryToDelete !== null) {
      deleteIndustryMutation.mutate(industryToDelete);
    }
  };
  
  // Utility function to handle industry checkbox changes
  const handleIndustryChange = (industry: string, checked: boolean) => {
    const industries = [...form.watch("industries")];
    if (checked) {
      if (!industries.includes(industry)) industries.push(industry);
    } else {
      const index = industries.indexOf(industry);
      if (index > -1) industries.splice(index, 1);
    }
    form.setValue("industries", industries);
  };
  
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please log in to access settings</h1>
            <Button asChild>
              <a href="/login">Login</a>
            </Button>
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
        <div className="flex items-center mb-6">
          <SettingsIcon className="h-6 w-6 mr-2" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 max-w-md">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="industries">Industries</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account details and preferences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    value={`${user.firstName || ''} ${user.lastName || ''}`} 
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={user.email} 
                    disabled
                  />
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-slate-500">Account details can only be modified by an administrator.</p>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="questions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Question Management</CardTitle>
                <CardDescription>
                  Manage questions for assessments including global questions (appear in all assessments) and 
                  industry-specific questions. These questions collect additional information
                  from clients during the assessment process. Filter the questions by type using the dropdown below.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border p-4 mb-4 bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <div className="font-medium text-blue-600">Important Note</div>
                  </div>
                  <div className="mt-2 text-sm text-blue-700">
                    Questions can be filtered by type (Global or Industry-specific). When editing a question, toggling the "Global Question" 
                    switch or setting industry associations will determine where the question appears. Industry-specific questions will only 
                    appear in assessments for companies in those industries.
                  </div>
                </div>
                <div className="mb-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-medium">Question List</h3>
                    <Select 
                      value={questionFilter} 
                      onValueChange={setQuestionFilter}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filter questions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Questions</SelectItem>
                        <SelectItem value="global">Global Questions</SelectItem>
                        <SelectGroup>
                          <SelectLabel>Industry Questions</SelectLabel>
                          {Array.isArray(industries) && industries.map((industry) => (
                            <SelectItem key={industry.id} value={`industry-${industry.id}`}>
                              {industry.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Add Question Dialog */}
                  <Dialog open={isAddingQuestion} onOpenChange={setIsAddingQuestion}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Question</DialogTitle>
                        <DialogDescription>
                          Add a new question that will appear in all assessments.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="question">Question Text*</Label>
                          <Input 
                            id="question" 
                            placeholder="Enter your question here" 
                            {...form.register("question", { required: true })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="description">Description (Optional)</Label>
                          <Textarea 
                            id="description" 
                            placeholder="Enter additional context for the question" 
                            {...form.register("description")}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="type">Question Type*</Label>
                          <Select 
                            onValueChange={(value) => form.setValue("type", value as QuestionType)} 
                            defaultValue={form.getValues("type")}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select question type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Short Text</SelectItem>
                              <SelectItem value="textarea">Long Text</SelectItem>
                              <SelectItem value="select">Single Choice (Dropdown)</SelectItem>
                              <SelectItem value="multiselect">Multiple Choice (Multi-select)</SelectItem>
                              <SelectItem value="checkbox">Checkboxes</SelectItem>
                              <SelectItem value="radio">Radio Buttons</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {["select", "multiselect", "checkbox", "radio"].includes(form.watch("type")) && (
                          <div className="space-y-2">
                            <Label htmlFor="options">Options (comma-separated)*</Label>
                            <Textarea 
                              id="options" 
                              placeholder="Option 1, Option 2, Option 3" 
                              {...form.register("options", { 
                                required: ["select", "multiselect", "checkbox", "radio"].includes(form.watch("type")) 
                              })}
                            />
                          </div>
                        )}
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Switch 
                                id="required" 
                                checked={form.watch("required")}
                                onCheckedChange={(checked) => form.setValue("required", checked)}
                              />
                              <Label htmlFor="required">Required Question</Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Switch 
                                id="global" 
                                checked={form.watch("global")}
                                onCheckedChange={(checked) => form.setValue("global", checked)}
                              />
                              <Label htmlFor="global">Global Question</Label>
                            </div>
                          </div>
                          
                          {["select", "multiselect", "checkbox", "radio"].includes(form.watch("type")) && (
                            <div className="flex items-center space-x-2">
                              <Switch 
                                id="allowMultiple" 
                                checked={form.watch("allowMultiple")}
                                onCheckedChange={(checked) => form.setValue("allowMultiple", checked)}
                              />
                              <Label htmlFor="allowMultiple">Allow Multiple Answers</Label>
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <Label htmlFor="industries">Industry Association (Optional)</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {isLoadingIndustries ? (
                                <div className="col-span-2 flex justify-center py-2">
                                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                </div>
                              ) : Array.isArray(industries) && industries.length > 0 ? (
                                industries.map((industry) => (
                                  <div key={industry.id} className="flex items-center space-x-2">
                                    <Checkbox 
                                      id={`industry-${industry.id}`}
                                      onCheckedChange={(checked: boolean) => 
                                        handleIndustryChange(String(industry.id), checked)
                                      }
                                      checked={form.watch("industries").includes(String(industry.id))}
                                    />
                                    <Label htmlFor={`industry-${industry.id}`}>{industry.name}</Label>
                                  </div>
                                ))
                              ) : (
                                <div className="col-span-2 text-sm text-muted-foreground py-2">
                                  No industries have been added yet. Add industries in the Industries tab.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsAddingQuestion(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createQuestionMutation.isPending}
                          >
                            {createQuestionMutation.isPending && (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            Create Question
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  
                  {/* Edit Question Dialog */}
                  <Dialog open={isEditingQuestion} onOpenChange={setIsEditingQuestion}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Question</DialogTitle>
                        <DialogDescription>
                          Make changes to the existing question.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="question">Question Text*</Label>
                          <Input 
                            id="question" 
                            placeholder="Enter your question here" 
                            {...form.register("question", { required: true })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="description">Description (Optional)</Label>
                          <Textarea 
                            id="description" 
                            placeholder="Enter additional context for the question" 
                            {...form.register("description")}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="type">Question Type*</Label>
                          <Select 
                            onValueChange={(value) => form.setValue("type", value as QuestionType)} 
                            defaultValue={form.getValues("type")}
                            value={form.watch("type")}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select question type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Short Text</SelectItem>
                              <SelectItem value="textarea">Long Text</SelectItem>
                              <SelectItem value="select">Single Choice (Dropdown)</SelectItem>
                              <SelectItem value="multiselect">Multiple Choice (Multi-select)</SelectItem>
                              <SelectItem value="checkbox">Checkboxes</SelectItem>
                              <SelectItem value="radio">Radio Buttons</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {["select", "multiselect", "checkbox", "radio"].includes(form.watch("type")) && (
                          <div className="space-y-2">
                            <Label htmlFor="options">Options (comma-separated)*</Label>
                            <Textarea 
                              id="options" 
                              placeholder="Option 1, Option 2, Option 3" 
                              {...form.register("options", { 
                                required: ["select", "multiselect", "checkbox", "radio"].includes(form.watch("type")) 
                              })}
                            />
                          </div>
                        )}
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Switch 
                                id="required" 
                                checked={form.watch("required")}
                                onCheckedChange={(checked) => form.setValue("required", checked)}
                              />
                              <Label htmlFor="required">Required Question</Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Switch 
                                id="global" 
                                checked={form.watch("global")}
                                onCheckedChange={(checked) => form.setValue("global", checked)}
                              />
                              <Label htmlFor="global">Global Question</Label>
                            </div>
                          </div>
                          
                          {["select", "multiselect", "checkbox", "radio"].includes(form.watch("type")) && (
                            <div className="flex items-center space-x-2">
                              <Switch 
                                id="allowMultiple" 
                                checked={form.watch("allowMultiple")}
                                onCheckedChange={(checked) => form.setValue("allowMultiple", checked)}
                              />
                              <Label htmlFor="allowMultiple">Allow Multiple Answers</Label>
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <Label htmlFor="industries">Industry Association (Optional)</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {isLoadingIndustries ? (
                                <div className="col-span-2 flex justify-center py-2">
                                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                </div>
                              ) : Array.isArray(industries) && industries.length > 0 ? (
                                industries.map((industry) => (
                                  <div key={`edit-industry-${industry.id}`} className="flex items-center space-x-2">
                                    <Checkbox 
                                      id={`edit-industry-${industry.id}`}
                                      onCheckedChange={(checked: boolean) => 
                                        handleIndustryChange(String(industry.id), checked)
                                      }
                                      checked={form.watch("industries").includes(String(industry.id))}
                                    />
                                    <Label htmlFor={`edit-industry-${industry.id}`}>{industry.name}</Label>
                                  </div>
                                ))
                              ) : (
                                <div className="col-span-2 text-sm text-muted-foreground py-2">
                                  No industries have been added yet. Add industries in the Industries tab.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              setIsEditingQuestion(false);
                              setEditingQuestion(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={updateQuestionMutation.isPending}
                          >
                            {updateQuestionMutation.isPending && (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            Update Question
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <Separator />
                
                {isLoadingQuestions ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredQuestions && filteredQuestions.length > 0 ? (
                  <div className="space-y-4">
                    {filteredQuestions.map((question) => (
                      <div key={question.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{question.question}</h4>
                            {question.description && (
                              <p className="text-sm text-slate-400 mt-1">{question.description}</p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditQuestion(question)}
                            >
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDeleteQuestion(question.id)}
                              disabled={deleteQuestionMutation.isPending}
                            >
                              {deleteQuestionMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 space-y-2">
                          <div className="flex space-x-4 text-xs text-slate-400">
                            <span>Type: {question.type}</span>
                            <span>{question.required ? "Required" : "Optional"}</span>
                            <span>{question.global ? "Global" : "Assessment-specific"}</span>
                          </div>
                          
                          {question.options.length > 0 && (
                            <div className="text-xs">
                              <span className="text-slate-400">Options: </span>
                              <span>{question.options.join(", ")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400">
                    {questionFilter === 'global' ? (
                      <>
                        <p>No global questions have been created yet.</p>
                        <p className="mt-2">Click the "Add Question" button to create your first global question.</p>
                      </>
                    ) : questionFilter.startsWith('industry-') ? (
                      <>
                        <p>No questions for this industry have been created yet.</p>
                        <p className="mt-2">Click the "Add Question" button to create your first industry-specific question.</p>
                      </>
                    ) : (
                      <>
                        <p>No questions have been created yet.</p>
                        <p className="mt-2">Click the "Add Question" button to create your first question.</p>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="industries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Industry Management</CardTitle>
                <CardDescription>
                  Manage industry categories that can be associated with questions and assessments.
                  Industry-specific questions will only appear in assessments for companies in those industries.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="mb-4 flex justify-between items-center">
                  <h3 className="text-lg font-medium">Industry List</h3>
                  <Dialog open={isAddingIndustry} onOpenChange={setIsAddingIndustry}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Industry
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Industry</DialogTitle>
                        <DialogDescription>
                          Add a new industry that can be associated with questions and assessments.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <form onSubmit={industryForm.handleSubmit(onIndustrySubmit)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Industry Name*</Label>
                          <Input 
                            id="name" 
                            placeholder="Enter industry name" 
                            {...industryForm.register("name", { required: true })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="description">Description (Optional)</Label>
                          <Textarea 
                            id="description" 
                            placeholder="Enter industry description" 
                            {...industryForm.register("description")}
                          />
                        </div>
                        
                        <DialogFooter>
                          <Button type="submit">
                            Save Industry
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  
                  {/* Edit Industry Dialog */}
                  <Dialog open={isEditingIndustry} onOpenChange={setIsEditingIndustry}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Industry</DialogTitle>
                        <DialogDescription>
                          Update industry details.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <form onSubmit={industryForm.handleSubmit(onIndustrySubmit)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Industry Name*</Label>
                          <Input 
                            id="name" 
                            placeholder="Enter industry name" 
                            {...industryForm.register("name", { required: true })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="description">Description (Optional)</Label>
                          <Textarea 
                            id="description" 
                            placeholder="Enter industry description" 
                            {...industryForm.register("description")}
                          />
                        </div>
                        
                        <DialogFooter>
                          <Button type="submit">
                            Update Industry
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {isLoadingIndustries ? (
                  <div className="py-6 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {Array.isArray(industries) && industries.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-24">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(industries as Industry[]).map((industry: Industry) => (
                            <TableRow key={industry.id}>
                              <TableCell className="font-medium">{industry.name}</TableCell>
                              <TableCell>{industry.description || '-'}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleEditIndustry(industry)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleDeleteIndustry(industry.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="py-6 text-center text-muted-foreground">
                        No industries have been added yet. Use the "Add Industry" button to create your first industry.
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* Industry Delete Confirmation Dialog */}
            <AlertDialog open={isIndustryDeleteDialogOpen} onOpenChange={setIsIndustryDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this industry? This action cannot be undone.
                    Any questions associated with this industry will be affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmIndustryDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>Customize the look and feel of your interface.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-400">Appearance customization options will be available in a future update.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this question and any associated responses.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsPage;