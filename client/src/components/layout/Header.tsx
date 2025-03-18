import { Link } from "wouter";
import { Shield } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-slate-800 border-b border-slate-700">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/">
          <a className="flex items-center space-x-2">
            <Shield className="text-primary-500 h-6 w-6" />
            <span className="text-xl font-semibold">Entourage Sentry</span>
          </a>
        </Link>
        <div className="flex items-center space-x-4">
          <button className="text-slate-300 hover:text-white focus:outline-none">
            <span className="sr-only">Help</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="h-5 w-5"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>
          <div className="relative">
            <button className="flex items-center space-x-2 text-slate-300 hover:text-white focus:outline-none">
              <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center">
                <span className="text-sm font-medium">MS</span>
              </div>
              <span className="hidden md:inline-block">MSP Admin</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
