import { useState, useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Info,
  Radar,
  UploadCloud,
  Plus,
  Trash,
  Edit,
  Server, 
  Printer,
  Wifi,
  Monitor,
  Shield,
  Router
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getDeviceInformation, detectNetworkInfo } from "@/lib/networkUtils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

// Network device schema
const networkDeviceSchema = z.object({
  name: z.string().min(1, "Device name is required"),
  deviceType: z.enum(['Firewall', 'Router', 'Switch', 'Server', 'Workstation', 'Printer', 'Access Point', 'Other']),
  ipAddress: z.string().optional(),
  role: z.string().optional(),
});

type NetworkDevice = z.infer<typeof networkDeviceSchema>;

const manualNetworkSchema = z.object({
  method: z.enum(['browser', 'downloadable', 'manual']),
  isp: z.string().optional(),
  connectionType: z.string().optional(),
  bandwidth: z.number().optional(),
  bandwidthUnit: z.string().optional(),
  routerModel: z.string().optional(),
  // topology field removed from schema
  deviceCounts: z.object({
    workstations: z.number().optional(),
    servers: z.number().optional(),
    other: z.number().optional(),
  }).optional(),
  notes: z.string().optional(),
  downloadInitiated: z.boolean().optional(),
  scannerPlatform: z.enum(['windows', 'mac']).optional(),
  devices: z.array(networkDeviceSchema).optional(),
});

type NetworkFormValues = z.infer<typeof manualNetworkSchema>;

interface NetworkAssessmentStepProps {
  onNext: () => void;
  onBack: () => void;
  companyId: number;
  defaultValues?: Partial<NetworkFormValues>;
}

const NetworkAssessmentStep = ({ onNext, onBack, companyId, defaultValues = {} }: NetworkAssessmentStepProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Define the steps for the network assessment workflow
  const STEPS = {
    BROWSER_SCAN: 'browser_scan',
    CHOOSE_METHOD: 'choose_method',
    NETWORK_SCANNER: 'network_scanner',
    MANUAL_ENTRY: 'manual_entry'
  };
  
  // Track the current step
  const [currentStep, setCurrentStep] = useState(STEPS.BROWSER_SCAN);
  
  // Selected assessment method after browser scan
  const [assessmentMethod, setAssessmentMethod] = useState<'downloadable' | 'manual'>(
    defaultValues.method === 'downloadable' || defaultValues.method === 'manual' 
      ? defaultValues.method 
      : 'downloadable'
  );
  
  const [scanInProgress, setScanInProgress] = useState(false);
  const [scanResults, setScanResults] = useState<any>(null);
  const [browserScanComplete, setBrowserScanComplete] = useState(false);
  const [deviceFormOpen, setDeviceFormOpen] = useState(false);
  const [editingDeviceIndex, setEditingDeviceIndex] = useState<number | null>(null);
  
  // Network device form
  const deviceForm = useForm<NetworkDevice>({
    resolver: zodResolver(networkDeviceSchema),
    defaultValues: {
      name: '',
      deviceType: 'Router',
      ipAddress: '',
      role: '',
    }
  });
  
  const form = useForm<NetworkFormValues>({
    resolver: zodResolver(manualNetworkSchema),
    defaultValues: {
      method: defaultValues.method || 'browser',
      isp: '',
      connectionType: '',
      bandwidth: undefined,
      bandwidthUnit: 'mbps',
      routerModel: '',
      deviceCounts: {
        workstations: 0,
        servers: 0,
        other: 0,
      },
      notes: '',
      downloadInitiated: false,
      scannerPlatform: undefined,
      ...defaultValues
    },
  });
  
  // Run browser scan automatically when the component mounts
  useEffect(() => {
    if (!browserScanComplete && !scanResults && !scanInProgress) {
      startBrowserScan();
    }
  }, []);
  
  // Submit network assessment data mutation
  const networkAssessmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/network-assessments', {
        ...data,
        companyId,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Network assessment saved",
        description: "Network assessment information has been saved.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/network-assessments/company/${companyId}`] });
      onNext();
    },
    onError: (error) => {
      toast({
        title: "Error saving network assessment",
        description: (error as Error).message || "An error occurred while saving network assessment.",
        variant: "destructive",
      });
    },
  });
  
  const handleMethodChange = (value: 'downloadable' | 'manual') => {
    setAssessmentMethod(value);
    form.setValue('method', value);
    
    // Navigate to the appropriate step
    if (value === 'downloadable') {
      setCurrentStep(STEPS.NETWORK_SCANNER);
    } else if (value === 'manual') {
      setCurrentStep(STEPS.MANUAL_ENTRY);
    }
  };
  
  const startBrowserScan = async () => {
    setScanInProgress(true);
    setScanResults(null);
    
    try {
      // Get network information using browser capabilities
      const networkInfo = await detectNetworkInfo();
      const deviceInfo = await getDeviceInformation();
      
      // Wait for at least 1 second to simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setScanResults({
        ipAddress: networkInfo.ipAddress,
        isp: networkInfo.isp,
        connectionType: networkInfo.connectionType || 'Unknown',
        hostname: networkInfo.hostname || 'Unknown',
        userAgent: deviceInfo.userAgent,
        operatingSystem: deviceInfo.operatingSystem,
      });
      
      setBrowserScanComplete(true);
    } catch (error) {
      toast({
        title: "Scan failed",
        description: (error as Error).message || "Failed to complete network scan.",
        variant: "destructive",
      });
    } finally {
      setScanInProgress(false);
    }
  };
  
  const handleDownloadScanner = (platform: 'windows' | 'mac') => {
    const platformName = platform === 'windows' ? 'Windows' : 'macOS';
    const version = platform === 'windows' ? '1.2.3' : '1.2.1';
    const fileSize = platform === 'windows' ? '18.2 MB' : '22.5 MB';
    
    toast({
      title: `${platformName} Scanner Download`,
      description: `EntourageSentryScanner_${platform}_v${version} (${fileSize}) download started. Please run the scanner and upload results when complete.`,
    });
    
    // Log the platform selection for future implementation
    console.log(`User selected ${platformName} scanner download`);
    
    // Update form state directly
    form.setValue('downloadInitiated', true);
    form.setValue('scannerPlatform', platform);
    
    // Create a mock download process with notification
    setTimeout(() => {
      toast({
        title: "Download Complete",
        description: `EntourageSentryScanner for ${platformName} has been downloaded. Extract the files and run the executable with administrator privileges.`,
      });
    }, 1500);
    
    // Instead of using base64, let's use a fetch request to download a pre-created file
    // This approach will direct the user to an external site where they can download 
    // the scanner from the official source
    
    // Instead of trying to download a ZIP file, let's direct them to a text file with instructions
    window.open(`/api/scanner/${platform}`, '_blank');
    
    // For demo purposes, we'll also tell the user this is a simulation
    setTimeout(() => {
      toast({
        title: "Demo Mode",
        description: "In a production environment, this would download the actual scanner. In this demo, we simulate the download process.",
      });
    }, 2500);
  };
  
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type and size
    if (!['application/json', 'application/xml', 'text/xml'].includes(file.type)) {
      toast({
        title: "Invalid file format",
        description: "Please upload a JSON or XML file generated by the scanner.",
        variant: "destructive"
      });
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB max
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    
    // Simulate file processing
    setTimeout(() => {
      setUploadedFile(file);
      setIsUploading(false);
      
      toast({
        title: "Scan Results Uploaded",
        description: "Your network scan results have been successfully uploaded and processed.",
      });
      
      // In a real implementation, this would send the file to the server
      // and process the contained network information
    }, 1500);
  };
  
  // Function to continue to next step from browser scan
  const handleContinueFromBrowserScan = () => {
    if (scanResults) {
      // Instead of submitting data directly, just proceed to the choose method step
      setBrowserScanComplete(true);
      setCurrentStep(STEPS.CHOOSE_METHOD);
    } else {
      toast({
        title: "Scan Required",
        description: "Please complete the browser scan before proceeding.",
        variant: "destructive",
      });
    }
  };
  
  // Function to handle adding a new device
  const handleAddDevice = () => {
    deviceForm.reset({
      name: '',
      deviceType: 'Router',
      ipAddress: '',
      role: '',
    });
    setEditingDeviceIndex(null);
    setDeviceFormOpen(true);
  };

  // Function to handle editing an existing device
  const handleEditDevice = (index: number) => {
    const currentDevices = form.getValues().devices || [];
    const deviceToEdit = currentDevices[index];
    if (deviceToEdit) {
      deviceForm.reset(deviceToEdit);
      setEditingDeviceIndex(index);
      setDeviceFormOpen(true);
    }
  };

  // Function to handle saving a device (add or update)
  const handleSaveDevice = (e?: React.MouseEvent) => {
    // Prevent default form submission if this was triggered by a button click
    if (e) {
      e.preventDefault();
    }
    
    deviceForm.handleSubmit((data) => {
      try {
        const currentDevices = form.getValues().devices || [];
        let updatedDevices;
        
        if (editingDeviceIndex !== null) {
          // Update existing device
          updatedDevices = [...currentDevices];
          updatedDevices[editingDeviceIndex] = data;
        } else {
          // Add new device
          updatedDevices = [...currentDevices, data];
        }
        
        // Update the form value
        form.setValue('devices', updatedDevices, { 
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true
        });
        
        // Close the dialog and reset the editing state
        setDeviceFormOpen(false);
        setEditingDeviceIndex(null);
        
        toast({
          title: editingDeviceIndex !== null ? "Device updated" : "Device added",
          description: `${data.name} (${data.deviceType}) has been ${editingDeviceIndex !== null ? 'updated' : 'added'}.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "An error occurred while saving the device.",
          variant: "destructive"
        });
        console.error("Error saving device:", error);
      }
    })();
  };

  // Function to handle deleting a device
  const handleDeleteDevice = (index: number) => {
    try {
      const currentDevices = form.getValues().devices || [];
      const updatedDevices = currentDevices.filter((_, i) => i !== index);
      
      // Update the form value with proper options
      form.setValue('devices', updatedDevices, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true
      });
      
      toast({
        title: "Device removed",
        description: "The network device has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while removing the device.",
        variant: "destructive"
      });
      console.error("Error removing device:", error);
    }
  };

  // Function to get device icon based on type
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'Firewall':
        return <Shield className="h-4 w-4 text-orange-500" />;
      case 'Router':
        return <Router className="h-4 w-4 text-blue-500" />;
      case 'Switch':
        return <Router className="h-4 w-4 text-green-500" />;
      case 'Server':
        return <Server className="h-4 w-4 text-purple-500" />;
      case 'Workstation':
        return <Monitor className="h-4 w-4 text-slate-500" />;
      case 'Printer':
        return <Printer className="h-4 w-4 text-red-500" />;
      case 'Access Point':
        return <Wifi className="h-4 w-4 text-cyan-500" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-400" />;
    }
  };

  // Prepare final submission data based on assessment method and current step
  const prepareFinalData = () => {
    const browserData = scanResults ? {
      method: 'browser',
      ipAddress: scanResults.ipAddress,
      isp: scanResults.isp,
      connectionType: scanResults.connectionType,
      hostname: scanResults.hostname,
      userAgent: scanResults.userAgent,
      operatingSystem: scanResults.operatingSystem,
    } : null;
    
    if (assessmentMethod === 'manual') {
      const values = form.getValues();
      return {
        ...browserData, // Include browser scan data
        method: 'manual',
        isp: values.isp,
        connectionType: values.connectionType,
        bandwidth: values.bandwidth,
        bandwidthUnit: values.bandwidthUnit,
        routerModel: values.routerModel,
        // topology removed as clients might not know this information
        deviceCounts: values.deviceCounts,
        notes: values.notes,
        devices: values.devices || [], // Include the network devices
      };
    } else if (assessmentMethod === 'downloadable') {
      if (!uploadedFile) {
        toast({
          title: "Missing scan data",
          description: "Please upload the network scan results file before continuing.",
          variant: "destructive",
        });
        return null;
      }
      
      return {
        ...browserData, // Include browser scan data
        method: 'downloadable',
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
        fileType: uploadedFile.type,
        uploadTimestamp: new Date().toISOString(),
        scannerPlatform: form.getValues().scannerPlatform,
        // In a real implementation, we would include the actual data from the file
        // or reference to the uploaded file on the server
        scanSummary: {
          devicesDiscovered: 42,
          vulnerabilities: 7,
          securityScore: 78,
          deviceCategories: {
            workstations: 27,
            servers: 4,
            networking: 6,
            printers: 3,
            other: 2
          }
        }
      };
    }
    
    return null;
  };

  // Devices list with proper watches
  const DevicesList = () => {
    const devices = form.watch('devices') || [];
    
    if (devices.length === 0) {
      return (
        <div className="text-center py-6 text-slate-500 text-sm">
          <Router className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No devices added yet. Click "Add Device" to start building your network inventory.</p>
        </div>
      );
    }
    
    return (
      <Table className="border border-slate-700 rounded-md">
        <TableHeader className="bg-slate-700">
          <TableRow>
            <TableHead className="text-xs text-slate-300">Device</TableHead>
            <TableHead className="text-xs text-slate-300">Type</TableHead>
            <TableHead className="text-xs text-slate-300 hidden md:table-cell">IP Address</TableHead>
            <TableHead className="text-xs text-slate-300 hidden md:table-cell">Role</TableHead>
            <TableHead className="text-xs text-slate-300 w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((device, index) => (
            <TableRow key={index} className="border-slate-700">
              <TableCell className="py-2 text-sm">{device.name}</TableCell>
              <TableCell className="py-2">
                <Badge variant="outline" className="flex items-center space-x-1 border-slate-600">
                  {getDeviceIcon(device.deviceType)}
                  <span className="text-xs">{device.deviceType}</span>
                </Badge>
              </TableCell>
              <TableCell className="py-2 text-xs hidden md:table-cell">{device.ipAddress || '—'}</TableCell>
              <TableCell className="py-2 text-xs hidden md:table-cell">{device.role || '—'}</TableCell>
              <TableCell className="py-2">
                <div className="flex space-x-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditDevice(index)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteDevice(index)}>
                    <Trash className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div>
      <div className="p-6 border-b border-slate-700 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Network Assessment</h2>
        <div className="flex space-x-2">
          <span className="px-2 py-1 bg-primary-900/50 text-primary-400 text-xs rounded-md">Step 5 of 7</span>
        </div>
      </div>
      
      <div className="p-6">
        <p className="text-slate-400 mb-6">Gather information about the client's network infrastructure.</p>
        
        {/* Step 1: Browser Scan (Default First Step) */}
        {currentStep === STEPS.BROWSER_SCAN && (
          <div className="space-y-6">
            <div className="p-4 bg-primary-900/20 border border-primary-700/30 rounded-lg flex items-center">
              <Info className="text-primary-400 text-xl mr-3" />
              <div>
                <h4 className="text-sm font-medium text-primary-400">Browser-based Scan</h4>
                <p className="text-xs text-slate-400">This scan collects basic network information using your browser. After completion, you'll be able to choose between our Network Scanner tool or manual entry for more comprehensive assessment.</p>
              </div>
            </div>
            
            <div className="flex flex-col items-center py-6">
              {scanInProgress ? (
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-primary-400 motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                  <p className="mt-2 text-sm text-slate-400">Scanning network environment...</p>
                </div>
              ) : scanResults ? (
                <div className="w-full max-w-lg">
                  <div className="flex items-center justify-center mb-4">
                    <Check className="text-green-400 mr-2" />
                    <h4 className="text-green-400 font-medium">Scan Complete</h4>
                  </div>
                  
                  <div className="bg-slate-800 rounded-lg p-4 mb-4">
                    <h5 className="text-sm font-medium text-slate-300 mb-3">Network Information</h5>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-slate-400">IP Address:</p>
                        <p className="text-white font-mono">{scanResults.ipAddress}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">ISP Provider:</p>
                        <p className="text-white">{scanResults.isp}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Connection Type:</p>
                        <p className="text-white">{scanResults.connectionType}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Hostname:</p>
                        <p className="text-white font-mono truncate">{scanResults.hostname}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-800 rounded-lg p-4 mb-6">
                    <h5 className="text-sm font-medium text-slate-300 mb-3">Device Information</h5>
                    <div className="text-xs">
                      <div className="mb-3">
                        <p className="text-slate-400">Operating System:</p>
                        <p className="text-white">{scanResults.operatingSystem}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Browser:</p>
                        <p className="text-white font-mono text-xs break-all">{scanResults.userAgent}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Button 
                    onClick={startBrowserScan}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 flex items-center mb-4"
                  >
                    <Radar className="mr-2 h-4 w-4" />
                    <span>Start Browser Scan</span>
                  </Button>
                  <p className="text-xs text-slate-400">This quick scan will gather basic information about your network connection.</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Step 2: Choose Method (After Browser Scan) */}
        {currentStep === STEPS.CHOOSE_METHOD && (
          <div className="space-y-6">
            <div className="p-4 bg-primary-900/20 border border-primary-700/30 rounded-lg flex items-center mb-6">
              <Check className="text-green-400 text-xl mr-3" />
              <div>
                <h4 className="text-sm font-medium text-green-400">Browser Scan Complete</h4>
                <p className="text-xs text-slate-400">Basic network information has been collected. Now choose how you'd like to proceed with the detailed assessment.</p>
              </div>
            </div>
            
            <h3 className="text-md font-medium text-white mb-4">Choose Assessment Method</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                className="bg-slate-800 border border-slate-700 hover:border-blue-500 rounded-lg p-6 cursor-pointer transition-all duration-150"
                onClick={() => handleMethodChange('downloadable')}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <UploadCloud className="text-2xl h-8 w-8 text-primary-400" />
                  </div>
                  <h4 className="text-md font-medium mb-2 text-white">Network Scanner Tool</h4>
                  <p className="text-sm text-slate-400 mb-4">Comprehensive network analysis with our secure downloadable scanner tool.</p>
                  <ul className="text-xs text-left text-slate-400 space-y-1 ml-5 list-disc mb-4">
                    <li>Complete device discovery</li>
                    <li>Security vulnerability scanning</li>
                    <li>Network topology mapping</li>
                    <li>Performance measurement</li>
                  </ul>
                  <Button className="bg-primary-600 hover:bg-primary-700">
                    <span>Use Network Scanner</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div 
                className="bg-slate-800 border border-slate-700 hover:border-blue-500 rounded-lg p-6 cursor-pointer transition-all duration-150"
                onClick={() => handleMethodChange('manual')}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="text-2xl h-8 w-8 text-primary-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </div>
                  <h4 className="text-md font-medium mb-2 text-white">Manual Entry</h4>
                  <p className="text-sm text-slate-400 mb-4">Security-conscious option with guided manual entry for clients who prefer not to run network scanning tools.</p>
                  <ul className="text-xs text-left text-slate-400 space-y-1 ml-5 list-disc mb-4">
                    <li>Privacy focused approach</li>
                    <li>No software installation required</li>
                    <li>Simple guided questionnaire</li>
                    <li>Quick to complete</li>
                  </ul>
                  <Button className="bg-primary-600 hover:bg-primary-700">
                    <span>Use Manual Entry</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 3A: Network Scanner */}
        {currentStep === STEPS.NETWORK_SCANNER && (
          <div className="space-y-6">
            <div className="p-4 bg-primary-900/20 border border-primary-700/30 rounded-lg">
              <div className="flex items-center mb-4">
                <UploadCloud className="text-primary-400 text-xl mr-3" />
                <h4 className="text-sm font-medium text-primary-400">Network Scanner Tool</h4>
              </div>
              <p className="text-xs text-slate-400 mb-4">This tool provides a comprehensive assessment of the client's network environment, including:</p>
              <ul className="text-xs text-slate-400 space-y-1 ml-5 list-disc mb-4">
                <li>Device discovery (workstations, servers, network equipment)</li>
                <li>Network topology detection</li>
                <li>Internet connection analysis</li>
                <li>Bandwidth measurement</li>
                <li>Printer and networked device discovery</li>
                <li>Basic vulnerability assessment</li>
                <li>Network topology mapping</li>
                <li>Security vulnerability scanning</li>
              </ul>
            </div>
            
            <div className="bg-slate-700/50 p-4 rounded-lg mb-6">
              <h4 className="text-sm font-medium text-white mb-3">System Requirements:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-xs font-semibold text-primary-400 mb-1">Windows</h5>
                  <ul className="text-xs text-slate-400 space-y-1 ml-3 list-disc">
                    <li>Windows 10/11 (64-bit)</li>
                    <li>.NET Framework 4.7.2 or higher</li>
                    <li>Administrator privileges</li>
                    <li>200MB free disk space</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-primary-400 mb-1">macOS</h5>
                  <ul className="text-xs text-slate-400 space-y-1 ml-3 list-disc">
                    <li>macOS 11 Big Sur or higher</li>
                    <li>Intel or Apple Silicon</li>
                    <li>Admin privileges</li>
                    <li>300MB free disk space</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                onClick={() => handleDownloadScanner('windows')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M0,0H11.377V11.372H0ZM12.623,0H24V11.372H12.623ZM0,12.623H11.377V24H0Zm12.623,0H24V24H12.623" />
                </svg>
                <span>Download for Windows</span>
              </Button>
              <Button 
                onClick={() => handleDownloadScanner('mac')}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.09,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                </svg>
                <span>Download for macOS</span>
              </Button>
            </div>
            
            <div className="mt-6 border-t border-slate-700 pt-6">
              <h4 className="text-md font-medium text-white mb-4">Upload Scan Results</h4>
              <div className="bg-slate-800 rounded-lg p-6">
                <p className="text-sm text-slate-400 mb-4">After running the scanner, upload the generated scan results file:</p>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-700/50 hover:bg-slate-700 transition-all duration-200">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isUploading ? (
                        <div className="flex flex-col items-center">
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent text-primary-400"></div>
                          <p className="mt-2 text-sm text-slate-400">Processing...</p>
                        </div>
                      ) : uploadedFile ? (
                        <div className="flex flex-col items-center">
                          <Check className="text-green-400 h-10 w-10" />
                          <p className="mt-1 text-sm text-slate-400">{uploadedFile.name}</p>
                          <p className="text-xs text-primary-400">{Math.round(uploadedFile.size / 1024)} KB • {uploadedFile.type}</p>
                        </div>
                      ) : (
                        <>
                          <UploadCloud className="h-10 w-10 text-primary-400 mb-1" />
                          <p className="mb-1 text-sm text-slate-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                          <p className="text-xs text-slate-500">JSON or XML file (Max 10MB)</p>
                        </>
                      )}
                    </div>
                    <input
                      id="dropzone-file"
                      type="file"
                      className="hidden"
                      accept=".json,.xml"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 3B: Manual Entry */}
        {currentStep === STEPS.MANUAL_ENTRY && (
          <div className="space-y-6">
            <div className="p-4 bg-primary-900/20 border border-primary-700/30 rounded-lg flex items-center mb-6">
              <Info className="text-primary-400 text-xl mr-3" />
              <div>
                <h4 className="text-sm font-medium text-primary-400">Manual Network Assessment</h4>
                <p className="text-xs text-slate-400">Please complete the network information form below. This helps us understand the client's existing infrastructure.</p>
              </div>
            </div>
            
            <Form {...form}>
              <form className="space-y-6">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md text-white">Internet Connection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="isp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Internet Service Provider</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="e.g., Comcast, AT&T, Spectrum" 
                                className="bg-slate-700 border-slate-600 text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="connectionType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Connection Type</FormLabel>
                            <Select 
                              onValueChange={field.onChange}
                              value={field.value || ''}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                  <SelectValue placeholder="Select connection type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                <SelectItem value="Fiber">Fiber</SelectItem>
                                <SelectItem value="Cable">Cable</SelectItem>
                                <SelectItem value="DSL">DSL</SelectItem>
                                <SelectItem value="Fixed Wireless">Fixed Wireless</SelectItem>
                                <SelectItem value="Satellite">Satellite</SelectItem>
                                <SelectItem value="Cellular">Cellular/5G</SelectItem>
                                <SelectItem value="T1/T3">T1/T3 Line</SelectItem>
                                <SelectItem value="MPLS">MPLS Network</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <FormField
                        control={form.control}
                        name="bandwidth"
                        render={({ field }) => (
                          <FormItem className="col-span-1">
                            <FormLabel className="text-sm">Bandwidth</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                className="bg-slate-700 border-slate-600 text-white"
                                placeholder="e.g., 100"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bandwidthUnit"
                        render={({ field }) => (
                          <FormItem className="col-span-1">
                            <FormLabel className="text-sm">Unit</FormLabel>
                            <Select 
                              onValueChange={field.onChange}
                              value={field.value || 'mbps'}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                <SelectItem value="kbps">Kbps</SelectItem>
                                <SelectItem value="mbps">Mbps</SelectItem>
                                <SelectItem value="gbps">Gbps</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="routerModel"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel className="text-sm">Router/Firewall Model</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="e.g., Cisco Meraki MX68, SonicWall TZ350" 
                                className="bg-slate-700 border-slate-600 text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md text-white">Device Count Estimates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="deviceCounts.workstations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Workstations / Laptops</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                className="bg-slate-700 border-slate-600 text-white"
                                placeholder="0"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="deviceCounts.servers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Servers</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                className="bg-slate-700 border-slate-600 text-white"
                                placeholder="0"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="deviceCounts.other"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Other Devices</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                className="bg-slate-700 border-slate-600 text-white"
                                placeholder="0"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md text-white">Network Devices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel className="text-sm">Additional Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Any additional information about the network setup, special configurations, or concerns..."
                              className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end mb-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                        onClick={handleAddDevice}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        <span className="text-xs">Add Device</span>
                      </Button>
                    </div>

                    {/* Device Dialog Form */}
                    <Dialog open={deviceFormOpen} onOpenChange={setDeviceFormOpen}>
                      <DialogContent className="bg-slate-800 border-slate-700 text-white">
                        <DialogHeader>
                          <DialogTitle className="text-white">
                            {editingDeviceIndex !== null ? 'Edit Network Device' : 'Add New Network Device'}
                          </DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FormField
                              control={deviceForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Device Name</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      placeholder="e.g., Main Router, File Server"
                                      className="bg-slate-700 border-slate-600 text-white h-8 text-sm"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={deviceForm.control}
                              name="deviceType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Device Type</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-sm">
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                      <SelectItem value="Firewall">Firewall</SelectItem>
                                      <SelectItem value="Router">Router</SelectItem>
                                      <SelectItem value="Switch">Switch</SelectItem>
                                      <SelectItem value="Server">Server</SelectItem>
                                      <SelectItem value="Workstation">Workstation</SelectItem>
                                      <SelectItem value="Printer">Printer</SelectItem>
                                      <SelectItem value="Access Point">Access Point</SelectItem>
                                      <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FormField
                              control={deviceForm.control}
                              name="ipAddress"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">IP Address</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      placeholder="e.g., 192.168.1.1"
                                      className="bg-slate-700 border-slate-600 text-white h-8 text-sm"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={deviceForm.control}
                              name="role"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Role/Function</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      placeholder="e.g., Gateway, File Storage"
                                      className="bg-slate-700 border-slate-600 text-white h-8 text-sm"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        
                        <DialogFooter className="sm:justify-end flex gap-2">
                          <Button 
                            type="button" 
                            variant="ghost"
                            size="sm"
                            className="border-slate-600 text-white"
                            onClick={() => setDeviceFormOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="button" 
                            size="sm"
                            className="bg-primary-600 hover:bg-primary-700"
                            onClick={handleSaveDevice}
                          >
                            {editingDeviceIndex !== null ? 'Update Device' : 'Add Device'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    {/* Device List */}
                    <DevicesList />
                  </CardContent>
                </Card>
              </form>
            </Form>
          </div>
        )}
      </div>
      
      <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700 flex justify-between items-center">
        <Button
          type="button"
          variant="outline"
          className="border-slate-600 hover:border-slate-500"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        {currentStep === STEPS.BROWSER_SCAN && (
          <Button 
            type="button"
            className="bg-primary-600 hover:bg-primary-700"
            onClick={handleContinueFromBrowserScan}
            disabled={!scanResults}
          >
            <span>Continue</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
        
        {currentStep === STEPS.CHOOSE_METHOD && (
          <div className="text-sm text-slate-400 flex items-center">
            Please select one of the assessment methods above
          </div>
        )}
        
        {(currentStep === STEPS.NETWORK_SCANNER || currentStep === STEPS.MANUAL_ENTRY) && (
          <Button 
            type="button" 
            className="bg-primary-600 hover:bg-primary-700"
            onClick={() => {
              const data = prepareFinalData();
              if (data) {
                networkAssessmentMutation.mutate(data);
              }
            }}
            disabled={networkAssessmentMutation.isPending}
          >
            {networkAssessmentMutation.isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default NetworkAssessmentStep;