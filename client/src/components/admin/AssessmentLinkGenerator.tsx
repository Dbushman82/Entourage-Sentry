import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Clipboard, RefreshCw } from "lucide-react";

interface AssessmentLinkGeneratorProps {
  assessmentId: number;
  referenceCode: string;
  linkToken?: string | null;
  linkExpiration?: Date | null;
}

const AssessmentLinkGenerator: React.FC<AssessmentLinkGeneratorProps> = ({
  assessmentId,
  referenceCode,
  linkToken,
  linkExpiration
}) => {
  const { toast } = useToast();
  const [expirationDuration, setExpirationDuration] = useState('7d');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(linkExpiration ? new Date(linkExpiration) : null);

  // Mutation for generating a new link
  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/assessments/${assessmentId}/link`, {
        expirationDuration
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedLink(data.url);
      setExpiresAt(new Date(data.expiration));
      toast({
        title: "Link Generated Successfully",
        description: "The assessment link has been created and is ready to share.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Generating Link",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for renewing an existing link
  const renewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/assessments/${assessmentId}/link/renew`, {
        expirationDuration
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedLink(data.url);
      setExpiresAt(new Date(data.expiration));
      toast({
        title: "Link Renewed Successfully",
        description: "The assessment link has been renewed with a new expiration date.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Renewing Link",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper to format the expiration date
  const formatExpiration = (date: Date | null) => {
    if (!date) return 'Not set';
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  // Copy the link to clipboard
  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast({
        title: "Copied to Clipboard",
        description: "Assessment link copied to clipboard.",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Assessment Link Generator</CardTitle>
        <CardDescription>
          Create a secure, time-limited link for clients to access this assessment without authentication.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiration">Link Expiration</Label>
            <Select
              value={expirationDuration}
              onValueChange={setExpirationDuration}
            >
              <SelectTrigger id="expiration">
                <SelectValue placeholder="Select expiration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">1 Day</SelectItem>
                <SelectItem value="3d">3 Days</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="14d">14 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Reference Code</Label>
            <Input value={referenceCode} readOnly />
          </div>
        </div>

        {linkToken && expiresAt && (
          <div className="border p-3 rounded-md bg-muted/30">
            <p className="text-sm font-medium mb-1">Current Link Status</p>
            <p className="text-sm text-muted-foreground">
              Expires: {formatExpiration(expiresAt)}
            </p>
          </div>
        )}

        {generatedLink && (
          <div className="space-y-2">
            <Label htmlFor="link">Generated Link</Label>
            <div className="flex">
              <Input id="link" value={generatedLink} readOnly className="flex-1" />
              <Button 
                variant="outline" 
                className="ml-2" 
                onClick={copyToClipboard}
                title="Copy to clipboard"
              >
                <Clipboard className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              This link will expire on {formatExpiration(expiresAt)}.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        {linkToken ? (
          <Button 
            variant="outline" 
            onClick={() => renewMutation.mutate()}
            disabled={renewMutation.isPending}
          >
            {renewMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Renew Link
          </Button>
        ) : null}
        <Button 
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending ? 'Generating...' : 'Generate New Link'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AssessmentLinkGenerator;