import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Box, CheckCircle2, ClipboardList, FileText, Loader2 } from "lucide-react";

interface CustomQuestionsStepProps {
  assessmentId: number;
  onNext: () => void;
  onPrevious: () => void;
}

const CustomQuestionsStep: React.FC<CustomQuestionsStepProps> = ({ 
  assessmentId,
  onNext,
  onPrevious,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Query to get all questions for this assessment
  const { data: questions, isLoading, error } = useQuery({
    queryKey: [`/api/assessments/${assessmentId}/questions`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/assessments/${assessmentId}/questions`);
      return res.json();
    },
    enabled: !!assessmentId,
  });

  // Generate a form schema based on the questions
  const generateFormSchema = (questions: any[]) => {
    const schemaObj: Record<string, any> = {};
    
    questions.forEach(question => {
      const fieldName = `question_${question.id}`;
      
      // Create different validators based on question type
      switch (question.type) {
        case 'text':
          schemaObj[fieldName] = question.required 
            ? z.string().min(1, "This field is required") 
            : z.string().optional();
          break;
        case 'textarea':
          schemaObj[fieldName] = question.required 
            ? z.string().min(1, "This field is required") 
            : z.string().optional();
          break;
        case 'select':
          schemaObj[fieldName] = question.required 
            ? z.string().min(1, "This field is required") 
            : z.string().optional();
          break;
        case 'multiselect':
        case 'checkbox':
          schemaObj[fieldName] = question.required 
            ? z.array(z.string()).min(1, "At least one option must be selected") 
            : z.array(z.string()).optional();
          break;
        case 'radio':
          schemaObj[fieldName] = question.required 
            ? z.string().min(1, "This field is required") 
            : z.string().optional();
          break;
        default:
          schemaObj[fieldName] = z.string().optional();
      }
    });
    
    return z.object(schemaObj);
  };

  // Create form once questions are loaded
  const formSchema = questions ? generateFormSchema(questions) : z.object({});
  
  // Setup the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  // Submit handler
  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      // Convert the form data to question responses
      const responses = Object.entries(data).map(([key, value]) => {
        const questionId = parseInt(key.replace('question_', ''));
        
        // Make sure value is array, handle empty inputs
        let responseArray: string[] = [];
        
        if (Array.isArray(value)) {
          // Filter out empty values
          responseArray = value.filter(v => v && String(v).trim() !== '');
        } else if (value && String(value).trim() !== '') {
          responseArray = [value];
        }
        
        console.log(`Question ${questionId} responses:`, responseArray);
        
        return {
          questionId,
          response: responseArray
        };
      });
      
      // Submit each response that has data
      const validResponses = responses.filter(response => response.response.length > 0);
      
      if (validResponses.length === 0) {
        toast({
          title: "No responses to save",
          description: "Please provide at least one answer before continuing.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      console.log("Saving responses:", validResponses);
      
      // Submit each response
      const promises = validResponses.map(response => {
        return apiRequest('POST', '/api/question-responses', {
          questionId: response.questionId,
          assessmentId: assessmentId,  // Make sure responses are associated with the assessment
          response: response.response  // Send array of responses
        });
      });
      
      await Promise.all(promises);
      
      toast({
        title: "Responses saved",
        description: "Your answers to the custom questions have been saved successfully.",
        variant: "default",
      });
      
      onNext();
    } catch (error) {
      console.error("Error submitting responses:", error);
      toast({
        title: "Error saving responses",
        description: "There was a problem saving your answers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form rendering based on question types
  const renderQuestionField = (question: any) => {
    const fieldName = `question_${question.id}` as const;
    
    switch (question.type) {
      case 'text':
        return (
          <FormField
            key={question.id}
            control={form.control}
            name={fieldName}
            render={({ field }) => {
              // Convert field value to array if not already
              const answers = Array.isArray(field.value) ? field.value : field.value ? [field.value] : [];
              
              const addAnswer = () => {
                field.onChange([...answers, '']);
              };
              
              const removeAnswer = (index: number) => {
                const newAnswers = [...answers];
                newAnswers.splice(index, 1);
                field.onChange(newAnswers.length ? newAnswers : '');
              };
              
              const updateAnswer = (index: number, value: string) => {
                const newAnswers = [...answers];
                newAnswers[index] = value;
                field.onChange(newAnswers);
              };
              
              return (
                <FormItem className="mb-6">
                  <FormLabel className="text-white">
                    {question.question}
                    {question.required && <span className="text-destructive ml-1">*</span>}
                  </FormLabel>
                  <div className="space-y-2">
                    {answers.length === 0 ? (
                      <div className="flex">
                        <FormControl>
                          <Input 
                            placeholder="Your answer" 
                            className="bg-slate-900 border-slate-700"
                            value=""
                            onChange={(e) => field.onChange([e.target.value])}
                          />
                        </FormControl>
                      </div>
                    ) : (
                      answers.map((answer, index) => (
                        <div key={index} className="flex">
                          <FormControl>
                            <Input 
                              placeholder="Your answer" 
                              className="bg-slate-900 border-slate-700"
                              value={answer || ''}
                              onChange={(e) => updateAnswer(index, e.target.value)}
                            />
                          </FormControl>
                          <Button 
                            type="button"
                            variant="outline"
                            className="ml-2 px-2 py-0"
                            onClick={() => removeAnswer(index)}
                          >
                            &times;
                          </Button>
                        </div>
                      ))
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2"
                      onClick={addAnswer}
                    >
                      + Add Another Answer
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        );
      
      case 'textarea':
        return (
          <FormField
            key={question.id}
            control={form.control}
            name={fieldName}
            render={({ field }) => {
              // Convert field value to array if not already
              const answers = Array.isArray(field.value) ? field.value : field.value ? [field.value] : [];
              
              const addAnswer = () => {
                field.onChange([...answers, '']);
              };
              
              const removeAnswer = (index: number) => {
                const newAnswers = [...answers];
                newAnswers.splice(index, 1);
                field.onChange(newAnswers.length ? newAnswers : '');
              };
              
              const updateAnswer = (index: number, value: string) => {
                const newAnswers = [...answers];
                newAnswers[index] = value;
                field.onChange(newAnswers);
              };
              
              return (
                <FormItem className="mb-6">
                  <FormLabel className="text-white">
                    {question.question}
                    {question.required && <span className="text-destructive ml-1">*</span>}
                  </FormLabel>
                  <div className="space-y-2">
                    {answers.length === 0 ? (
                      <div className="flex">
                        <FormControl>
                          <Textarea 
                            placeholder="Your answer" 
                            className="bg-slate-900 border-slate-700"
                            value=""
                            onChange={(e) => field.onChange([e.target.value])}
                          />
                        </FormControl>
                      </div>
                    ) : (
                      answers.map((answer, index) => (
                        <div key={index} className="flex">
                          <FormControl>
                            <Textarea 
                              placeholder="Your answer" 
                              className="bg-slate-900 border-slate-700"
                              value={answer || ''}
                              onChange={(e) => updateAnswer(index, e.target.value)}
                            />
                          </FormControl>
                          <Button 
                            type="button"
                            variant="outline"
                            className="ml-2 px-2 py-0 h-10"
                            onClick={() => removeAnswer(index)}
                          >
                            &times;
                          </Button>
                        </div>
                      ))
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2"
                      onClick={addAnswer}
                    >
                      + Add Another Answer
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        );
      
      case 'select':
        return (
          <FormField
            key={question.id}
            control={form.control}
            name={fieldName}
            render={({ field }) => {
              // Convert field value to array if not already
              const answers = Array.isArray(field.value) ? field.value : field.value ? [field.value] : [];
              
              const addAnswer = () => {
                if (answers.length === 0) {
                  field.onChange([question.options[0] || '']);
                } else {
                  // Add another select as a new answer
                  field.onChange([...answers, '']);
                }
              };
              
              const removeAnswer = (index: number) => {
                const newAnswers = [...answers];
                newAnswers.splice(index, 1);
                field.onChange(newAnswers.length ? newAnswers : '');
              };
              
              const updateAnswer = (index: number, value: string) => {
                const newAnswers = [...answers];
                newAnswers[index] = value;
                field.onChange(newAnswers);
              };
              
              return (
                <FormItem className="mb-6">
                  <FormLabel className="text-white">
                    {question.question}
                    {question.required && <span className="text-destructive ml-1">*</span>}
                  </FormLabel>
                  <div className="space-y-2">
                    {answers.length === 0 ? (
                      <div className="flex">
                        <Select 
                          value=""
                          onValueChange={(value) => field.onChange([value])}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-slate-900 border-slate-700">
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {question.options.map((option: string, index: number) => (
                              <SelectItem key={index} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      answers.map((answer, index) => (
                        <div key={index} className="flex">
                          <Select 
                            value={answer}
                            onValueChange={(value) => updateAnswer(index, value)}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-slate-900 border-slate-700">
                                <SelectValue placeholder="Select an option" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              {question.options.map((option: string, index: number) => (
                                <SelectItem key={index} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button 
                            type="button"
                            variant="outline"
                            className="ml-2 px-2 py-0"
                            onClick={() => removeAnswer(index)}
                          >
                            &times;
                          </Button>
                        </div>
                      ))
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2"
                      onClick={addAnswer}
                    >
                      + Add Another Answer
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        );
      
      case 'multiselect':
      case 'checkbox':
        return (
          <FormField
            key={question.id}
            control={form.control}
            name={fieldName}
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel className="text-white">
                  {question.question}
                  {question.required && <span className="text-destructive ml-1">*</span>}
                </FormLabel>
                <div className="space-y-2">
                  {question.options.map((option: string, index: number) => (
                    <div className="flex items-center space-x-2" key={index}>
                      <Checkbox
                        id={`${fieldName}-${index}`}
                        checked={field.value?.includes(option)}
                        onCheckedChange={(checked) => {
                          const currentValues = Array.isArray(field.value) ? field.value : [];
                          if (checked) {
                            field.onChange([...currentValues, option]);
                          } else {
                            field.onChange(currentValues.filter(value => value !== option));
                          }
                        }}
                      />
                      <Label
                        htmlFor={`${fieldName}-${index}`}
                        className="text-sm font-normal text-slate-200"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case 'radio':
        return (
          <FormField
            key={question.id}
            control={form.control}
            name={fieldName}
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel className="text-white">
                  {question.question}
                  {question.required && <span className="text-destructive ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="space-y-2"
                  >
                    {question.options.map((option: string, index: number) => (
                      <div className="flex items-center space-x-2" key={index}>
                        <RadioGroupItem
                          value={option}
                          id={`${fieldName}-${index}`}
                        />
                        <Label
                          htmlFor={`${fieldName}-${index}`}
                          className="text-sm font-normal text-slate-200"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      default:
        return <p key={question.id}>Unsupported question type: {question.type}</p>;
    }
  };

  // Skip this step if there are no questions
  useEffect(() => {
    if (!isLoading && (!questions || questions.length === 0)) {
      onNext();
    }
  }, [isLoading, questions, onNext]);

  // If no questions and still loading, show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>Loading custom questions...</p>
      </div>
    );
  }

  // If no questions after loading, just show a simple message
  if (!questions || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Box className="h-12 w-12 text-slate-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Custom Questions</h2>
        <p className="text-slate-400 mb-4">There are no custom questions for this assessment.</p>
        <Button onClick={onNext} className="bg-primary-600 hover:bg-primary-700">
          Continue <FileText className="h-4 w-4 ml-2" />
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="bg-slate-800 border-slate-700 mb-6">
        <CardHeader>
          <div className="flex items-center">
            <ClipboardList className="h-6 w-6 mr-2 text-primary" />
            <div>
              <CardTitle className="text-white">Custom Questions</CardTitle>
              <CardDescription>
                Please answer the following custom questions for this assessment
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} id="custom-questions-form">
              {questions.map(renderQuestionField)}
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            disabled={isSubmitting}
          >
            Previous
          </Button>
          <Button
            type="submit"
            form="custom-questions-form"
            disabled={isSubmitting}
            className="bg-primary-600 hover:bg-primary-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <FileText className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CustomQuestionsStep;