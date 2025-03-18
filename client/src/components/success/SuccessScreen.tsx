import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { CheckCircle2, FileText, PlusCircle, Mail, Users, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuccessScreenProps {
  referenceCode?: string;
}

const SuccessScreen = ({ referenceCode = "ESNT-" + new Date().toISOString().split('T')[0].replace(/-/g, '') + "-" + Math.floor(Math.random() * 1000).toString().padStart(3, '0') }: SuccessScreenProps) => {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const handleStartNewAssessment = () => {
    // Clear any cached assessment data
    queryClient.invalidateQueries({ queryKey: [`/api/assessments`] });
    setLocation('/assessment');
  };
  
  return (
    <div className="p-8 text-center">
      <div className="w-16 h-16 bg-success-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
        <CheckCircle2 className="text-success-500 text-3xl" size={32} />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Assessment Complete!</h2>
      <p className="text-slate-400 mb-6">Thank you for completing the client assessment. The information will help us provide tailored solutions.</p>
      
      <div className="mb-8 max-w-md mx-auto">
        <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg mb-4">
          <h3 className="text-sm font-medium text-slate-300 mb-2">Reference Code</h3>
          <div className="bg-slate-900 p-2 rounded-md text-center">
            <span className="font-mono text-lg">{referenceCode}</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Use this code if you need to reference this assessment.</p>
        </div>
        
        <div className="text-left mb-6">
          <h3 className="text-sm font-medium text-slate-300 mb-2">Next Steps</h3>
          <ul className="text-sm text-slate-400 space-y-2">
            <li className="flex items-start">
              <Mail className="text-primary-500 mr-2 mt-0.5" size={16} />
              <span>You'll receive a confirmation email with assessment summary</span>
            </li>
            <li className="flex items-start">
              <Users className="text-primary-500 mr-2 mt-0.5" size={16} />
              <span>Our team will review your information within 1-2 business days</span>
            </li>
            <li className="flex items-start">
              <Phone className="text-primary-500 mr-2 mt-0.5" size={16} />
              <span>A consultant will contact you to discuss the next steps</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Button
          variant="outline"
          className="bg-slate-800 hover:bg-slate-700 border-slate-700"
          asChild
        >
          <Link href="/">
            <FileText className="mr-2" size={16} />
            <span>View Assessments</span>
          </Link>
        </Button>
        <Button
          className="bg-primary-600 hover:bg-primary-700"
          onClick={handleStartNewAssessment}
        >
          <PlusCircle className="mr-2" size={16} />
          <span>New Assessment</span>
        </Button>
      </div>
    </div>
  );
};

export default SuccessScreen;
