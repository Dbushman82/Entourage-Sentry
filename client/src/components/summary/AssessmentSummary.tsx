import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Building2,
  User,
  Network,
  Shield,
  AlertTriangle,
  Banknote,
  Calendar,
  FileDigit,
  ArrowLeft,
  Download,
  Share2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AssessmentSummary = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const { data: assessment, isLoading: isLoadingAssessment } = useQuery({
    queryKey: [`/api/assessments/${id}`],
    enabled: !!id,
  });

  const { data: details, isLoading: isLoadingDetails } = useQuery({
    queryKey: [`/api/assessments/${id}/details`],
    enabled: !!id,
  });

  useEffect(() => {
    // Reset share URL when assessment changes
    setShareUrl(null);
  }, [id]);

  const handleGenerateShareLink = async () => {
    try {
      const response = await fetch(`/api/assessments/${id}/link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expirationDuration: "7d" }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate share link");
      }
      
      const data = await response.json();
      setShareUrl(data.url);
      
      toast({
        title: "Share link generated",
        description: "Link will expire in 7 days",
      });
    } catch (error) {
      toast({
        title: "Error generating share link",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const copyShareLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied",
        description: "Share link copied to clipboard",
      });
    }
  };

  if (isLoadingAssessment || isLoadingDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!assessment || !details) {
    return (
      <div className="container p-6 mx-auto">
        <div className="text-center p-10 border border-dashed rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Assessment Not Found</h2>
          <p className="mb-6">The assessment you're looking for doesn't exist or you don't have access to it.</p>
          <Link href="/">
            <Button className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { 
    company, 
    contact, 
    domainData, 
    networkAssessment, 
    securityAssessment, 
    painPoint, 
    services,
    costs
  } = details;

  return (
    <div className="container p-6 mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{assessment.referenceCode}</h1>
          <p className="text-gray-500">Completed on {new Date(assessment.completedAt).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          {shareUrl ? (
            <Button variant="outline" onClick={copyShareLink} className="flex items-center gap-2">
              <Share2 className="h-4 w-4" /> Copy Link
            </Button>
          ) : (
            <Button variant="outline" onClick={handleGenerateShareLink} className="flex items-center gap-2">
              <Share2 className="h-4 w-4" /> Generate Share Link
            </Button>
          )}
          <Button className="flex items-center gap-2">
            <Download className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Company Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Name</span>
                <p className="font-medium">{company?.name || "Not provided"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Website</span>
                <p className="font-medium">{company?.website || "Not provided"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Industry</span>
                <p className="font-medium">{company?.industry || "Not provided"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Size</span>
                <p className="font-medium">{company?.employeeCount || "Not provided"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Name</span>
                <p className="font-medium">{contact?.firstName} {contact?.lastName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Email</span>
                <p className="font-medium">{contact?.email || "Not provided"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Phone</span>
                <p className="font-medium">{contact?.phone || "Not provided"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FileDigit className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Assessment Overview</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Reference Code</span>
                <p className="font-medium">{assessment.referenceCode}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Status</span>
                <Badge variant={assessment.status === "completed" ? "success" : "secondary"}>
                  {assessment.status}
                </Badge>
              </div>
              <div>
                <span className="text-sm text-gray-500">Created</span>
                <p className="font-medium">{new Date(assessment.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Completed</span>
                <p className="font-medium">
                  {assessment.completedAt ? new Date(assessment.completedAt).toLocaleDateString() : "In progress"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network Assessment */}
      {networkAssessment && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              <CardTitle>Network Assessment</CardTitle>
            </div>
            <CardDescription>Current network infrastructure details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium mb-2">Connection Details</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">ISP</span>
                    <p>{networkAssessment.isp || "Not specified"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Connection Type</span>
                    <p>{networkAssessment.connectionType || "Not specified"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Bandwidth</span>
                    <p>{networkAssessment.bandwidth ? `${networkAssessment.bandwidth} ${networkAssessment.bandwidthUnit || 'Mbps'}` : "Not specified"}</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Hardware Details</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Router Model</span>
                    <p>{networkAssessment.routerModel || "Not specified"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Router Age</span>
                    <p>{networkAssessment.routerAge || "Not specified"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">WiFi Coverage</span>
                    <p>{networkAssessment.wifiCoverage || "Not specified"}</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Additional Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Assessment Method</span>
                    <p>{networkAssessment.method}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Notes</span>
                    <p>{networkAssessment.notes || "No additional notes"}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Assessment */}
      {securityAssessment && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Security Assessment</CardTitle>
            </div>
            <CardDescription>Domain security analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">Security Score</span>
                    <span className={`font-bold ${
                      (securityAssessment.securityScore || 0) >= 80 ? 'text-green-500' : 
                      (securityAssessment.securityScore || 0) >= 60 ? 'text-yellow-500' : 
                      (securityAssessment.securityScore || 0) >= 40 ? 'text-orange-500' : 
                      'text-red-500'
                    }`}>
                      {securityAssessment.securityScore || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div 
                      className={`h-2.5 rounded-full ${
                        (securityAssessment.securityScore || 0) >= 80 ? 'bg-green-500' : 
                        (securityAssessment.securityScore || 0) >= 60 ? 'bg-yellow-500' : 
                        (securityAssessment.securityScore || 0) >= 40 ? 'bg-orange-500' : 
                        'bg-red-500'
                      }`}
                      style={{ width: `${securityAssessment.securityScore || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
                    <span className="text-sm text-gray-500">High Vulnerabilities</span>
                    <p className="text-lg font-semibold text-red-500">{securityAssessment.vulnerabilitiesHigh || 0}</p>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
                    <span className="text-sm text-gray-500">Medium Vulnerabilities</span>
                    <p className="text-lg font-semibold text-orange-500">{securityAssessment.vulnerabilitiesMedium || 0}</p>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
                    <span className="text-sm text-gray-500">Low Vulnerabilities</span>
                    <p className="text-lg font-semibold text-yellow-500">{securityAssessment.vulnerabilitiesLow || 0}</p>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
                    <span className="text-sm text-gray-500">Informational Issues</span>
                    <p className="text-lg font-semibold text-blue-500">{securityAssessment.vulnerabilitiesInfo || 0}</p>
                  </div>
                </div>
              </div>

              <div>
                {securityAssessment.recommendations && securityAssessment.recommendations.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Key Recommendations</h3>
                    <ul className="space-y-1 list-disc pl-5">
                      {(securityAssessment.recommendations as string[]).map((rec, index) => (
                        <li key={index} className="text-sm">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {securityAssessment.technologies && securityAssessment.technologies.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Detected Technologies</h3>
                    <div className="flex flex-wrap gap-2">
                      {(securityAssessment.technologies as string[]).map((tech, index) => (
                        <Badge key={index} variant="outline">{tech}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* IT Costs */}
      {costs && costs.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              <CardTitle>IT Costs</CardTitle>
            </div>
            <CardDescription>Current technology services and costs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3">Service</th>
                    <th scope="col" className="px-6 py-3">Provider</th>
                    <th scope="col" className="px-6 py-3">Monthly Cost</th>
                    <th scope="col" className="px-6 py-3">Users</th>
                    <th scope="col" className="px-6 py-3">Renewal</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {costs.map((cost, index) => (
                    <tr key={index} className="border-b dark:border-gray-700">
                      <td className="px-6 py-4 font-medium">{cost.serviceName}</td>
                      <td className="px-6 py-4">{cost.serviceProvider || "N/A"}</td>
                      <td className="px-6 py-4">${cost.monthlyCost}</td>
                      <td className="px-6 py-4">{cost.userCount || "N/A"}</td>
                      <td className="px-6 py-4">{cost.renewalDate || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold">
                    <td className="px-6 py-3">Total Monthly Cost</td>
                    <td className="px-6 py-3"></td>
                    <td className="px-6 py-3">
                      ${costs.reduce((total, cost) => total + (cost.monthlyCost || 0), 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-3"></td>
                    <td className="px-6 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pain Points */}
      {painPoint && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <CardTitle>Pain Points & Requirements</CardTitle>
            </div>
            <CardDescription>Client issues and proposed solutions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Pain Points</h3>
                <p>{painPoint.description || "No pain points described"}</p>
                
                {painPoint.additionalNotes && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Additional Notes</h3>
                    <p>{painPoint.additionalNotes}</p>
                  </div>
                )}
              </div>
              
              <div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Priority Level</h3>
                    <Badge variant={
                      painPoint.priority === "high" ? "destructive" : 
                      painPoint.priority === "medium" ? "default" : 
                      "secondary"
                    }>
                      {painPoint.priority || "Not specified"}
                    </Badge>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Response Time Expected</h3>
                    <p>{painPoint.responseTime || "Not specified"}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Budget Range</h3>
                    <p>{painPoint.budget || "Not specified"}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Timeline</h3>
                    <p>{painPoint.timeline || "Not specified"}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AssessmentSummary;