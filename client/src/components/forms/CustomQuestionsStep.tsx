import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CustomQuestion, 
  InsertCustomQuestion,
  CustomQuestionResponse,
  InsertCustomQuestionResponse,
  questionTypes
} from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface CustomQuestionsStepProps {
  assessmentId: number;
  userId: number;
  hideControls?: boolean;
  onComplete?: () => void;
  onNext?: () => void;
  onBack?: () => void;
}

export default function CustomQuestionsStep({ 
  assessmentId, 
  userId, 
  hideControls = false,
  onComplete, 
  onNext,
  onBack
}: CustomQuestionsStepProps) {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<CustomQuestion | null>(null);
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Partial<InsertCustomQuestion>>({
    assessmentId,
    createdBy: userId,
    question: '',
    type: 'text',
    required: false,
    description: '',
    options: [],
    order: 0
  });
  const [newOptionText, setNewOptionText] = useState('');
  
  // QUERIES AND MUTATIONS
  
  // Fetch all custom questions for this assessment
  const { 
    data: questions = [], 
    isLoading: questionsLoading,
    error: questionsError 
  } = useQuery<CustomQuestion[]>({
    queryKey: ['/api/questions/assessment', assessmentId],
    queryFn: async () => {
      const response = await fetch(`/api/questions/assessment/${assessmentId}`);
      if (!response.ok) {
        throw new Error('Failed to load questions');
      }
      return response.json();
    },
    enabled: !!assessmentId
  });
  
  // Create a new custom question
  const { mutate: createQuestion, isPending: isCreatingQuestionPending } = useMutation({
    mutationFn: async (question: InsertCustomQuestion) => {
      const res = await apiRequest('POST', '/api/questions', question);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions/assessment', assessmentId] });
      setIsCreatingQuestion(false);
      setNewQuestion({
        assessmentId,
        createdBy: userId,
        question: '',
        type: 'text',
        required: false,
        description: '',
        options: [],
        order: 0
      });
      toast({
        title: 'Question created',
        description: 'Custom question has been added successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create question',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Update an existing custom question
  const { mutate: updateQuestion } = useMutation({
    mutationFn: async ({ id, question }: { id: number, question: Partial<InsertCustomQuestion> }) => {
      const res = await apiRequest('PUT', `/api/questions/${id}`, question);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions/assessment', assessmentId] });
      toast({
        title: 'Question updated',
        description: 'Custom question has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update question',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Delete a custom question
  const { mutate: deleteQuestion, isPending: isDeleting } = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/questions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions/assessment', assessmentId] });
      setIsDeleteDialogOpen(false);
      setQuestionToDelete(null);
      toast({
        title: 'Question deleted',
        description: 'Custom question has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete question',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Fetch responses for a question (if we're in view mode)
  const { 
    data: responses = {}, 
    isLoading: responsesLoading 
  } = useQuery<Record<number, CustomQuestionResponse[]>>({
    queryKey: ['/api/question-responses', assessmentId],
    queryFn: async () => {
      const result: Record<number, CustomQuestionResponse[]> = {};
      
      if (hideControls && questions.length > 0) {
        await Promise.all(questions.map(async (question) => {
          const response = await fetch(`/api/question-responses/question/${question.id}`);
          if (response.ok) {
            const data = await response.json();
            result[question.id] = data;
          }
        }));
      }
      
      return result;
    },
    enabled: !!hideControls && questions.length > 0
  });
  
  // Submit a response to a question
  const { mutate: saveResponse } = useMutation({
    mutationFn: async (response: InsertCustomQuestionResponse) => {
      const res = await apiRequest('POST', '/api/question-responses', response);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/question-responses', assessmentId] });
      toast({
        title: 'Response saved',
        description: 'Your answer has been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to save response',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // HANDLERS
  
  const handleAddOption = () => {
    if (newOptionText.trim()) {
      setNewQuestion(prev => ({
        ...prev,
        options: [...(prev.options || []), newOptionText.trim()]
      }));
      setNewOptionText('');
    }
  };
  
  const handleRemoveOption = (index: number) => {
    setNewQuestion(prev => ({
      ...prev,
      options: (prev.options || []).filter((_, i) => i !== index)
    }));
  };
  
  const handleCreateQuestion = () => {
    if (!newQuestion.question?.trim()) {
      toast({
        title: 'Missing question text',
        description: 'Please enter the question text.',
        variant: 'destructive',
      });
      return;
    }
    
    if (['select', 'multiselect', 'checkbox', 'radio'].includes(newQuestion.type || '') && 
        (!newQuestion.options || newQuestion.options.length < 2)) {
      toast({
        title: 'Missing options',
        description: 'Please add at least two options for this question type.',
        variant: 'destructive',
      });
      return;
    }
    
    createQuestion(newQuestion as InsertCustomQuestion);
  };
  
  const handleDeleteQuestion = (question: CustomQuestion) => {
    setQuestionToDelete(question);
    setIsDeleteDialogOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (questionToDelete) {
      deleteQuestion(questionToDelete.id);
    }
  };
  
  const handleCompleteStep = () => {
    if (onComplete) {
      onComplete();
    }
    if (onNext) {
      onNext();
    }
  };
  
  const handleSubmitResponse = (questionId: number, response: string | string[]) => {
    saveResponse({
      questionId,
      response: Array.isArray(response) ? response.join(',') : response.toString()
    });
  };
  
  if (questionsLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading custom questions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (questionsError) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center text-destructive py-10">
            <p>Failed to load custom questions. Please try refreshing the page.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Custom Questions</CardTitle>
        <CardDescription>
          {hideControls 
            ? 'Please answer the following questions to help us better understand your needs.'
            : 'Create custom questions for this assessment.'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Display existing questions */}
        {questions.length > 0 ? (
          <div className="space-y-6">
            {questions.map((question) => (
              <Card key={question.id} className="relative group">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{question.question}</CardTitle>
                      {question.description && (
                        <CardDescription>{question.description}</CardDescription>
                      )}
                    </div>
                    
                    {!hideControls && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteQuestion(question)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline">{question.type}</Badge>
                    {question.required && (
                      <Badge variant="secondary">Required</Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  {hideControls ? (
                    <QuestionInput 
                      question={question} 
                      value={responses[question.id]?.[0]?.response || ''}
                      onChange={(response) => handleSubmitResponse(question.id, response)}
                    />
                  ) : (
                    <div className="space-y-2">
                      {['select', 'multiselect', 'checkbox', 'radio'].includes(question.type) && (
                        <div className="space-y-2">
                          <Label>Options</Label>
                          <ul className="list-disc pl-5">
                            {question.options?.map((option, index) => (
                              <li key={index}>{option}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            {hideControls 
              ? 'No custom questions have been created for this assessment.' 
              : 'No custom questions yet. Create one below.'}
          </div>
        )}
        
        {/* Create new question form - only visible in edit mode */}
        {!hideControls && (
          <>
            {isCreatingQuestion ? (
              <Card>
                <CardHeader>
                  <CardTitle>Create New Question</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="question-text">Question Text</Label>
                    <Input 
                      id="question-text"
                      placeholder="Enter your question"
                      value={newQuestion.question}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, question: e.target.value }))}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="question-description">Description (Optional)</Label>
                    <Textarea 
                      id="question-description"
                      placeholder="Add additional context or instructions"
                      value={newQuestion.description || ''}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="question-type">Question Type</Label>
                      <Select 
                        value={newQuestion.type}
                        onValueChange={(value) => setNewQuestion(prev => ({ 
                          ...prev, 
                          type: value as any,
                          options: ['select', 'multiselect', 'checkbox', 'radio'].includes(value) 
                            ? (prev.options || []) 
                            : []
                        }))}
                      >
                        <SelectTrigger id="question-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {questionTypes.enumValues.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Required?</Label>
                      <div className="flex items-center space-x-2 pt-2">
                        <Switch 
                          checked={newQuestion.required}
                          onCheckedChange={(checked) => setNewQuestion(prev => ({ ...prev, required: checked }))}
                        />
                        <Label>Make this question required</Label>
                      </div>
                    </div>
                  </div>
                  
                  {['select', 'multiselect', 'checkbox', 'radio'].includes(newQuestion.type || '') && (
                    <div className="space-y-3">
                      <Label>Options</Label>
                      
                      {(newQuestion.options || []).length > 0 && (
                        <ul className="space-y-2">
                          {(newQuestion.options || []).map((option, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <div className="flex-1 p-2 border rounded-md">{option}</div>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleRemoveOption(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                      
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Add option"
                          value={newOptionText}
                          onChange={(e) => setNewOptionText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddOption();
                            }
                          }}
                        />
                        <Button 
                          type="button" 
                          variant="secondary"
                          onClick={handleAddOption}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreatingQuestion(false)}
                  >
                    Cancel
                  </Button>
                  
                  <Button 
                    onClick={handleCreateQuestion}
                    disabled={isCreatingQuestionPending}
                  >
                    {isCreatingQuestionPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Question
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <Button 
                className="w-full"
                variant="outline"
                onClick={() => setIsCreatingQuestion(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Custom Question
              </Button>
            )}
          </>
        )}
      </CardContent>
      
      {!hideControls && (
        <CardFooter className="flex justify-between">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
          )}
          <Button onClick={handleCompleteStep}>
            <Save className="mr-2 h-4 w-4" />
            Save and Continue
          </Button>
        </CardFooter>
      )}
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this custom question from the assessment.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// Component to render the appropriate input type based on question type
interface QuestionInputProps {
  question: CustomQuestion;
  value: string;
  onChange: (value: string | string[]) => void;
}

function QuestionInput({ question, value, onChange }: QuestionInputProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  
  useEffect(() => {
    if (question.type === 'multiselect' || question.type === 'checkbox') {
      setSelectedOptions(value ? value.split(',') : []);
    }
  }, [question.type, value]);
  
  const handleMultiOptionChange = (option: string, checked: boolean) => {
    const newSelection = checked 
      ? [...selectedOptions, option]
      : selectedOptions.filter(item => item !== option);
    
    setSelectedOptions(newSelection);
    onChange(newSelection);
  };

  switch(question.type) {
    case 'textarea':
      return (
        <Textarea 
          placeholder="Enter your answer"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={question.required}
        />
      );
    
    case 'select':
      return (
        <Select 
          value={value}
          onValueChange={onChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {question.options?.map((option, index) => (
              <SelectItem key={index} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    
    case 'multiselect':
    case 'checkbox':
      return (
        <div className="space-y-2">
          {question.options?.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Checkbox 
                id={`${question.id}-option-${index}`}
                checked={selectedOptions.includes(option)}
                onCheckedChange={(checked) => handleMultiOptionChange(option, !!checked)}
              />
              <Label htmlFor={`${question.id}-option-${index}`}>
                {option}
              </Label>
            </div>
          ))}
        </div>
      );
    
    case 'radio':
      return (
        <RadioGroup 
          value={value}
          onValueChange={onChange}
        >
          {question.options?.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem value={option} id={`${question.id}-option-${index}`} />
              <Label htmlFor={`${question.id}-option-${index}`}>
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );
    
    case 'text':
    default:
      return (
        <Input 
          placeholder="Enter your answer"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={question.required}
        />
      );
  }
}