import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  ArrowRight,
  Info,
  AlertTriangle,
  Check,
  UploadCloud,
  Radar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getDeviceInformation, detectNetworkInfo } from "@/lib/networkUtils";

const manualNetworkSchema = z.object({
  method: z.enum(['browser', 'downloadable', 'manual']),
  isp: z.string().optional(),
  connectionType: z.string().optional(),
  bandwidth: z.number().optional(),
  bandwidthUnit: z.string().optional(),
  routerModel: z.string().optional(),
  topology: z.string().optional(),
  deviceCounts: z.object({
    workstations: z.number().optional(),
    servers: z.number().optional(),
    other: z.number().optional(),
  }).optional(),
  notes: z.string().optional(),
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
  const [assessmentMethod, setAssessmentMethod] = useState<'browser' | 'downloadable' | 'manual'>(
    defaultValues.method || 'browser'
  );
  const [scanInProgress, setScanInProgress] = useState(false);
  const [scanResults, setScanResults] = useState<any>(null);
  
  const form = useForm<NetworkFormValues>({
    resolver: zodResolver(manualNetworkSchema),
    defaultValues: {
      method: defaultValues.method || 'browser',
      isp: '',
      connectionType: '',
      bandwidth: undefined,
      bandwidthUnit: 'mbps',
      routerModel: '',
      topology: '',
      deviceCounts: {
        workstations: 0,
        servers: 0,
        other: 0,
      },
      notes: '',
      ...defaultValues
    },
  });
  
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
  
  const handleMethodChange = (value: 'browser' | 'downloadable' | 'manual') => {
    setAssessmentMethod(value);
    form.setValue('method', value);
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
  
  const handleDownloadScanner = () => {
    toast({
      title: "Scanner download",
      description: "Network scanner download initiated. Please run the scanner and upload results when complete.",
    });
    // In a real implementation, this would trigger an actual download
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // In a real implementation, this would process the upload
    toast({
      title: "File received",
      description: "Your network scan results file has been uploaded.",
    });
  };
  
  const handleSubmit = () => {
    const values = form.getValues();
    
    // Prepare data based on assessment method
    let networkData: any;
    
    if (assessmentMethod === 'browser' && scanResults) {
      networkData = {
        method: 'browser',
        ipAddress: scanResults.ipAddress,
        isp: scanResults.isp,
        connectionType: scanResults.connectionType,
        hostname: scanResults.hostname,
        userAgent: scanResults.userAgent,
        operatingSystem: scanResults.operatingSystem,
      };
    } else if (assessmentMethod === 'manual') {
      networkData = {
        method: 'manual',
        isp: values.isp,
        connectionType: values.connectionType,
        bandwidth: values.bandwidth,
        bandwidthUnit: values.bandwidthUnit,
        routerModel: values.routerModel,
        topology: values.topology,
        deviceCounts: values.deviceCounts,
        notes: values.notes,
      };
    } else if (assessmentMethod === 'downloadable') {
      // For downloadable option, this would typically include uploaded scan data
      networkData = {
        method: 'downloadable',
        // scanData would be populated from the file upload in a real implementation
        scanData: { scanned: true, timestamp: new Date().toISOString() },
      };
    } else {
      toast({
        title: "Missing data",
        description: "Please complete the network assessment before continuing.",
        variant: "destructive",
      });
      return;
    }
    
    networkAssessmentMutation.mutate(networkData);
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
        
        {/* Network Assessment Options */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-white mb-3">Choose Assessment Method</h3>
          <RadioGroup 
            value={assessmentMethod} 
            onValueChange={(value) => handleMethodChange(value as 'browser' | 'downloadable' | 'manual')}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className={`relative bg-slate-800 border ${assessmentMethod === 'browser' ? 'border-primary-500' : 'border-slate-700'} hover:border-primary-500 rounded-lg p-4 cursor-pointer`}>
              <RadioGroupItem value="browser" id="browser" className="sr-only" />
              <Label htmlFor="browser" className="cursor-pointer">
                <div className="text-center">
                  <div className="w-12 h-12 bg-slate-700 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="text-2xl text-primary-500 h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="4" />
                      <line x1="21.17" y1="8" x2="12" y2="8" />
                      <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
                      <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-medium text-white mb-1">Browser Scan</h4>
                  <p className="text-xs text-slate-400">Basic network information using browser capabilities</p>
                </div>
                <div className={`absolute top-2 right-2 w-4 h-4 border-2 ${assessmentMethod === 'browser' ? 'border-primary-500' : 'border-slate-500'} rounded-full flex items-center justify-center`}>
                  {assessmentMethod === 'browser' && <div className="w-2 h-2 bg-primary-500 rounded-full"></div>}
                </div>
              </Label>
            </div>
            
            <div className={`relative bg-slate-800 border ${assessmentMethod === 'downloadable' ? 'border-primary-500' : 'border-slate-700'} hover:border-primary-500 rounded-lg p-4 cursor-pointer`}>
              <RadioGroupItem value="downloadable" id="downloadable" className="sr-only" />
              <Label htmlFor="downloadable" className="cursor-pointer">
                <div className="text-center">
                  <div className="w-12 h-12 bg-slate-700 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <UploadCloud className="text-2xl text-slate-300 h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-medium text-white mb-1">Network Scanner</h4>
                  <p className="text-xs text-slate-400">Comprehensive network analysis with our secure tool</p>
                </div>
                <div className={`absolute top-2 right-2 w-4 h-4 border-2 ${assessmentMethod === 'downloadable' ? 'border-primary-500' : 'border-slate-500'} rounded-full flex items-center justify-center`}>
                  {assessmentMethod === 'downloadable' && <div className="w-2 h-2 bg-primary-500 rounded-full"></div>}
                </div>
              </Label>
            </div>
            
            <div className={`relative bg-slate-800 border ${assessmentMethod === 'manual' ? 'border-primary-500' : 'border-slate-700'} hover:border-primary-500 rounded-lg p-4 cursor-pointer`}>
              <RadioGroupItem value="manual" id="manual" className="sr-only" />
              <Label htmlFor="manual" className="cursor-pointer">
                <div className="text-center">
                  <div className="w-12 h-12 bg-slate-700 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="text-2xl text-slate-300 h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-medium text-white mb-1">Manual Entry</h4>
                  <p className="text-xs text-slate-400">Security-conscious option with guided manual entry</p>
                </div>
                <div className={`absolute top-2 right-2 w-4 h-4 border-2 ${assessmentMethod === 'manual' ? 'border-primary-500' : 'border-slate-500'} rounded-full flex items-center justify-center`}>
                  {assessmentMethod === 'manual' && <div className="w-2 h-2 bg-primary-500 rounded-full"></div>}
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        {/* Browser Scan Section */}
        {assessmentMethod === 'browser' && (
          <div className="space-y-6">
            <div className="p-4 bg-primary-900/20 border border-primary-700/30 rounded-lg flex items-center">
              <Info className="text-primary-400 text-xl mr-3" />
              <div>
                <h4 className="text-sm font-medium text-primary-400">Browser-based Scan</h4>
                <p className="text-xs text-slate-400">This scan collects basic network information using your browser. For a more comprehensive assessment, use our Network Scanner.</p>
              </div>
            </div>
            
            {!scanResults && !scanInProgress && (
              <div>
                <Button 
                  onClick={startBrowserScan} 
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700"
                >
                  <Radar className="mr-2 h-4 w-4" />
                  <span>Start Browser Scan</span>
                </Button>
              </div>
            )}
            
            {/* Scan in Progress */}
            {scanInProgress && (
              <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-white">Scan in Progress</h4>
                  <span className="text-xs text-slate-400">65%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-primary-500 h-2 rounded-full animate-pulse" style={{width: '65%'}}></div>
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  Detecting IP address, hostname, and connection information...
                </div>
              </div>
            )}
            
            {/* Scan Results */}
            {scanResults && (
              <div className="space-y-4">
                <h3 className="text-md font-medium text-white">Network Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-md">
                    <h4 className="text-xs font-medium text-slate-400 mb-1">Public IP Address</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white">{scanResults.ipAddress}</span>
                      <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">IPv4</span>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-md">
                    <h4 className="text-xs font-medium text-slate-400 mb-1">ISP</h4>
                    <span className="text-sm text-white">{scanResults.isp}</span>
                  </div>
                  
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-md">
                    <h4 className="text-xs font-medium text-slate-400 mb-1">Connection Type</h4>
                    <span className="text-sm text-white">{scanResults.connectionType}</span>
                  </div>
                  
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-md">
                    <h4 className="text-xs font-medium text-slate-400 mb-1">Hostname</h4>
                    <span className="text-sm text-white">{scanResults.hostname}</span>
                  </div>
                </div>
                
                <h3 className="text-md font-medium text-white mt-6">Browser Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-md">
                    <h4 className="text-xs font-medium text-slate-400 mb-1">User Agent</h4>
                    <span className="text-sm text-white">{scanResults.userAgent}</span>
                  </div>
                  
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-md">
                    <h4 className="text-xs font-medium text-slate-400 mb-1">Operating System</h4>
                    <span className="text-sm text-white">{scanResults.operatingSystem}</span>
                  </div>
                </div>
                
                <div className="p-4 bg-amber-900/20 border border-amber-700/30 rounded-lg mt-6">
                  <div className="flex items-center">
                    <AlertTriangle className="text-amber-400 text-xl mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-amber-400">Limited Information</h4>
                      <p className="text-xs text-slate-400">Browser scanning provides limited network information. For detailed assessment including device discovery, consider using our Network Scanner tool.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Network Scanner Option */}
        {assessmentMethod === 'downloadable' && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
              <h3 className="text-md font-medium text-white mb-3">Network Scanner Tool</h3>
              <p className="text-sm text-slate-400 mb-4">Our secure network scanner provides comprehensive discovery of devices, operating systems, and services.</p>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium text-white mb-2">Features:</h4>
                <ul className="text-sm text-slate-400 space-y-1 ml-5 list-disc">
                  <li>Complete device inventory</li>
                  <li>Operating system detection</li>
                  <li>Port scanning for common services</li>
                  <li>Printer and networked device discovery</li>
                  <li>Basic vulnerability assessment</li>
                </ul>
              </div>
              
              <div className="flex justify-center">
                <Button 
                  onClick={handleDownloadScanner}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700"
                >
                  <UploadCloud className="mr-2 h-4 w-4" />
                  <span>Download Scanner</span>
                </Button>
              </div>
            </div>
            
            <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
              <h3 className="text-md font-medium text-white mb-3">Upload Results</h3>
              <p className="text-sm text-slate-400 mb-4">After running the scanner, upload the results file here to complete your assessment.</p>
              
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer bg-slate-900/50 hover:bg-slate-900 hover:border-primary-500 transition-all">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="text-2xl text-slate-400 mb-2" />
                    <p className="mb-1 text-sm text-slate-400">Click to upload scan results</p>
                    <p className="text-xs text-slate-500">JSON or XML file (Max 10MB)</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden"
                    accept=".json,.xml"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>
          </div>
        )}
        
        {/* Manual Entry Option */}
        {assessmentMethod === 'manual' && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
              <h3 className="text-md font-medium text-white mb-3">Manual Network Information</h3>
              <p className="text-sm text-slate-400 mb-4">Please provide the following information about the network infrastructure.</p>
              
              <Form {...form}>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="isp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Internet Service Provider</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
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
                          <FormLabel>Connection Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                <SelectValue placeholder="Select connection type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                              <SelectItem value="_none">Select connection type</SelectItem>
                              <SelectItem value="fiber">Fiber</SelectItem>
                              <SelectItem value="cable">Cable</SelectItem>
                              <SelectItem value="dsl">DSL</SelectItem>
                              <SelectItem value="wireless">Fixed Wireless</SelectItem>
                              <SelectItem value="satellite">Satellite</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bandwidth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bandwidth</FormLabel>
                          <div className="flex">
                            <FormControl>
                              <Input 
                                type="number"
                                min={1}
                                {...field}
                                value={field.value || ''}
                                onChange={e => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                                className="w-full rounded-r-none bg-slate-700 border-slate-600 text-white"
                              />
                            </FormControl>
                            <Select
                              value={form.watch('bandwidthUnit') || 'mbps'}
                              onValueChange={value => form.setValue('bandwidthUnit', value)}
                            >
                              <SelectTrigger className="w-[80px] rounded-l-none bg-slate-700 border-slate-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                <SelectItem value="mbps">Mbps</SelectItem>
                                <SelectItem value="gbps">Gbps</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="routerModel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Router/Firewall Model</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              className="bg-slate-700 border-slate-600 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="topology"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Network Topology</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                              <SelectValue placeholder="Select network topology" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-800 border-slate-700 text-white">
                            <SelectItem value="_none">Select network topology</SelectItem>
                            <SelectItem value="star">Star</SelectItem>
                            <SelectItem value="mesh">Mesh</SelectItem>
                            <SelectItem value="bus">Bus</SelectItem>
                            <SelectItem value="ring">Ring</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                            <SelectItem value="unknown">Unknown</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <FormLabel className="block text-sm font-medium text-slate-300 mb-1">Approximate Device Count</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="deviceCounts.workstations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-slate-400">Workstations/Laptops</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                min={0}
                                {...field}
                                value={field.value || 0}
                                onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
                                className="bg-slate-700 border-slate-600 text-white"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="deviceCounts.servers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-slate-400">Servers</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                min={0}
                                {...field}
                                value={field.value || 0}
                                onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
                                className="bg-slate-700 border-slate-600 text-white"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="deviceCounts.other"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-slate-400">Other Devices</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                min={0}
                                {...field}
                                value={field.value || 0}
                                onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
                                className="bg-slate-700 border-slate-600 text-white"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Network Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field}
                            rows={3}
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </div>
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
          Previous
        </Button>
        <Button 
          type="button" 
          className="bg-primary-600 hover:bg-primary-700"
          onClick={handleSubmit}
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
      </div>
    </div>
  );
};

export default NetworkAssessmentStep;
