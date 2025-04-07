import { useState, useEffect } from "react";
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
import { Loader2, Plus, Trash2, Settings as SettingsIcon } from "lucide-react";
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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

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

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("questions");
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  
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
  
  const { data: globalQuestions, isLoading: isLoadingQuestions } = useQuery({
    queryKey: ['/api/questions/global'],
    enabled: !!user,
  });
  
  const createQuestionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/questions', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions/global'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/questions/global'] });
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
  
  const onSubmit = (data: NewQuestionForm) => {
    // Convert options string to array if needed
    const needsOptions = ["select", "multiselect", "checkbox", "radio"].includes(data.type);
    const optionsArray = needsOptions ? data.options.split(',').map(opt => opt.trim()) : [];
    
    createQuestionMutation.mutate({
      question: data.question,
      description: data.description || null,
      type: data.type,
      options: needsOptions ? optionsArray : [],
      required: data.required,
      global: true, // Always set to true in settings page as all questions here are global
      assessmentId: 0, // Use 0 to trigger global flag in backend
      order: globalQuestions ? (globalQuestions as CustomQuestion[]).length + 1 : 0,
      industries: data.industries,
      allowMultiple: data.allowMultiple,
      createdBy: user?.id
    });
  };
  
  const handleDeleteQuestion = (id: number) => {
    if (confirm("Are you sure you want to delete this question?")) {
      deleteQuestionMutation.mutate(id);
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
          <TabsList className="grid grid-cols-3 max-w-md">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="questions">Global Questions</TabsTrigger>
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
                <CardTitle>Global Custom Questions</CardTitle>
                <CardDescription>
                  Manage questions that will appear in all assessments. These questions collect additional information
                  from clients during the assessment process.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="mb-4 flex justify-between items-center">
                  <h3 className="text-lg font-medium">Question List</h3>
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
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="retail" 
                                  onCheckedChange={(checked: boolean) => handleIndustryChange("retail", checked)}
                                  checked={form.watch("industries").includes("retail")}
                                />
                                <Label htmlFor="retail">Retail & E-commerce</Label>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="healthcare" 
                                  onCheckedChange={(checked: boolean) => handleIndustryChange("healthcare", checked)}
                                  checked={form.watch("industries").includes("healthcare")}
                                />
                                <Label htmlFor="healthcare">Healthcare & Medical</Label>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="finance" 
                                  onCheckedChange={(checked: boolean) => handleIndustryChange("finance", checked)}
                                  checked={form.watch("industries").includes("finance")}
                                />
                                <Label htmlFor="finance">Financial Services</Label>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="manufacturing" 
                                  onCheckedChange={(checked: boolean) => handleIndustryChange("manufacturing", checked)}
                                  checked={form.watch("industries").includes("manufacturing")}
                                />
                                <Label htmlFor="manufacturing">Manufacturing</Label>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="technology" 
                                  onCheckedChange={(checked: boolean) => handleIndustryChange("technology", checked)}
                                  checked={form.watch("industries").includes("technology")}
                                />
                                <Label htmlFor="technology">Technology</Label>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="education" 
                                  onCheckedChange={(checked: boolean) => handleIndustryChange("education", checked)}
                                  checked={form.watch("industries").includes("education")}
                                />
                                <Label htmlFor="education">Education</Label>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="professional" 
                                  onCheckedChange={(checked: boolean) => handleIndustryChange("professional", checked)}
                                  checked={form.watch("industries").includes("professional")}
                                />
                                <Label htmlFor="professional">Professional Services</Label>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="hospitality" 
                                  onCheckedChange={(checked: boolean) => handleIndustryChange("hospitality", checked)}
                                  checked={form.watch("industries").includes("hospitality")}
                                />
                                <Label htmlFor="hospitality">Hospitality & Tourism</Label>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="construction" 
                                  onCheckedChange={(checked: boolean) => handleIndustryChange("construction", checked)}
                                  checked={form.watch("industries").includes("construction")}
                                />
                                <Label htmlFor="construction">Construction & Real Estate</Label>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="nonprofit" 
                                  onCheckedChange={(checked: boolean) => handleIndustryChange("nonprofit", checked)}
                                  checked={form.watch("industries").includes("nonprofit")}
                                />
                                <Label htmlFor="nonprofit">Non-profit & Government</Label>
                              </div>
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
                </div>
                
                <Separator />
                
                {isLoadingQuestions ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : globalQuestions && (globalQuestions as CustomQuestion[]).length > 0 ? (
                  <div className="space-y-4">
                    {(globalQuestions as CustomQuestion[]).map((question) => (
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
                    <p>No global questions have been created yet.</p>
                    <p className="mt-2">Click the "Add Question" button to create your first global question.</p>
                  </div>
                )}
              </CardContent>
            </Card>
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
    </div>
  );
};

export default SettingsPage;