import { useState } from "react";

interface MultiStepFormOptions {
  steps: number;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  validateStep?: (step: number) => boolean | Promise<boolean>;
}

/**
 * A hook for managing multi-step forms
 * 
 * @param options Configuration options for the multi-step form
 * @returns Object with form state and navigation methods
 */
export function useMultiStepForm({
  steps,
  initialStep = 1,
  onStepChange,
  validateStep,
}: MultiStepFormOptions) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [history, setHistory] = useState<number[]>([initialStep]);
  
  /**
   * Go to a specific step
   * 
   * @param step The step number to navigate to
   * @param skipValidation Whether to skip validation
   */
  const goToStep = async (step: number, skipValidation = false) => {
    if (step < 1 || step > steps) {
      return;
    }
    
    // If we're moving forward, validate the current step
    if (!skipValidation && step > currentStep && validateStep) {
      const isValid = await validateStep(currentStep);
      if (!isValid) {
        return;
      }
    }
    
    setCurrentStep(step);
    
    // Update history for back/forward navigation
    if (step > currentStep) {
      setHistory([...history, step]);
    }
    
    // Call the onStepChange callback if provided
    if (onStepChange) {
      onStepChange(step);
    }
  };
  
  /**
   * Go to the next step
   */
  const nextStep = async () => {
    await goToStep(currentStep + 1);
  };
  
  /**
   * Go back to the previous step
   */
  const prevStep = () => {
    // Calculate the previous step based on history
    let prevStep = currentStep - 1;
    
    // Remove current step from history
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      setHistory(newHistory);
      prevStep = newHistory[newHistory.length - 1];
    }
    
    // Go to previous step, skip validation since we're going back
    goToStep(prevStep, true);
  };
  
  /**
   * Submit the form
   */
  const submit = async () => {
    // Validate the final step if validator provided
    if (validateStep) {
      setIsSubmitting(true);
      const isValid = await validateStep(currentStep);
      setIsSubmitting(false);
      
      if (!isValid) {
        return;
      }
    }
    
    setIsComplete(true);
  };
  
  /**
   * Reset the form to the initial state
   */
  const reset = () => {
    setCurrentStep(initialStep);
    setHistory([initialStep]);
    setIsComplete(false);
  };
  
  return {
    currentStep,
    totalSteps: steps,
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === steps,
    isSubmitting,
    isComplete,
    goToStep,
    nextStep,
    prevStep,
    submit,
    reset,
  };
}

export default useMultiStepForm;
