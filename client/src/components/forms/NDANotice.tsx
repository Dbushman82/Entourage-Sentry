import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Lock } from "lucide-react";

interface NDANoticeProps {
  isOpen: boolean;
  onConfirm: () => void;
}

const NDANotice = ({ isOpen, onConfirm }: NDANoticeProps) => {
  const [agreed, setAgreed] = useState(false);

  const handleConfirm = () => {
    if (agreed) {
      onConfirm();
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-xl">
        <DialogHeader>
          <div className="mx-auto bg-primary-800/30 p-3 rounded-full mb-4">
            <Lock className="h-8 w-8 text-primary-500" />
          </div>
          <DialogTitle className="text-2xl text-center">Confidentiality Notice</DialogTitle>
          <DialogDescription className="text-slate-400 text-center">
            Before proceeding with your assessment, please review our confidentiality terms.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-2">
          <div className="bg-slate-700/50 p-4 rounded-md border border-slate-600">
            <p className="text-sm text-slate-300 leading-relaxed">
              All information provided during this assessment will be treated as confidential and will only be used for the purpose of evaluating your technology infrastructure and needs. 
              Entourage IT agrees to maintain the confidentiality of all business information shared during this assessment process.
            </p>
          </div>
          
          <div className="flex items-start space-x-3 p-2">
            <Shield className="h-5 w-5 text-primary-500 mt-0.5" />
            <p className="text-xs text-slate-400">
              Your data is encrypted and securely stored. We do not share your information with third parties without your explicit consent.
            </p>
          </div>
          
          <div className="flex items-start space-x-2 mt-4">
            <Checkbox 
              id="nda-agreement" 
              checked={agreed} 
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
              className="mt-1 data-[state=checked]:bg-primary-600"
            />
            <label htmlFor="nda-agreement" className="text-sm text-slate-300">
              I understand and agree that the information I provide will be treated confidentially according to the terms outlined above.
            </label>
          </div>
        </div>
        
        <DialogFooter className="mt-6">
          <Button 
            onClick={handleConfirm} 
            disabled={!agreed} 
            className="w-full bg-primary-600 hover:bg-primary-700"
          >
            Continue to Assessment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NDANotice;