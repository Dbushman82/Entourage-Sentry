import { Shield } from "lucide-react";
import { Link } from "wouter";

const Footer = () => {
  return (
    <footer className="bg-slate-800 border-t border-slate-700 py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Shield className="text-primary-500 h-5 w-5" />
            <span className="text-lg font-semibold">Entourage Sentry</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link href="#" className="text-sm text-slate-400 hover:text-white">
              Privacy Policy
            </Link>
            <Link href="#" className="text-sm text-slate-400 hover:text-white">
              Terms of Service
            </Link>
            <Link href="#" className="text-sm text-slate-400 hover:text-white">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
