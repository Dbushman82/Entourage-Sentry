import { Shield, Building, FileText, AppWindow, Router, DollarSign, CheckSquare } from "lucide-react";

interface ProgressTrackerProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressTracker = ({ currentStep, totalSteps = 7 }: ProgressTrackerProps) => {
  // Define the steps and their corresponding icons
  const steps = [
    { name: 'Contact', icon: <Shield className="h-3 w-3" /> },
    { name: 'Company', icon: <Building className="h-3 w-3" /> },
    { name: 'Profile', icon: <FileText className="h-3 w-3" /> },
    { name: 'Expenses', icon: <DollarSign className="h-3 w-3" /> },
    { name: 'Network', icon: <Router className="h-3 w-3" /> },
    { name: 'Security', icon: <AppWindow className="h-3 w-3" /> },
    { name: 'Needs', icon: <CheckSquare className="h-3 w-3" /> },
  ];

  // Calculate progress percentage
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-slate-400">Progress</span>
        <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2.5">
        <div 
          className="bg-primary-500 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <div className="flex justify-between mt-4 text-xs text-slate-400 overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center min-w-[60px]">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 
              ${index + 1 === currentStep 
                ? 'bg-primary-500 ring-2 ring-primary-300 text-white' 
                : index + 1 < currentStep 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-slate-700 text-slate-400'
              }`}>
              {step.icon}
            </div>
            <span className={index + 1 === currentStep ? 'font-medium text-primary-300' : ''}>{step.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressTracker;
