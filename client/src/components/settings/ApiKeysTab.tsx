import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusIcon, Pencil, Trash2, ExternalLink, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Define the API key type
interface ApiKey {
  id: number;
  name: string;
  key: string;
  documentationUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// Form schema for API key validation
const apiKeySchema = z.object({
  name: z.string().min(1, "Name is required"),
  key: z.string().min(1, "API key is required"),
  documentationUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type ApiKeyFormValues = z.infer<typeof apiKeySchema>;

const ApiKeysTab: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for dialog management
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentApiKey, setCurrentApiKey] = useState<ApiKey | null>(null);

  // Form setup
  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      name: "",
      key: "",
      documentationUrl: "",
    },
  });

  // Fetch API keys
  const { data: apiKeys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/api-keys"],
    staleTime: 60000, // 1 minute
  });

  // Create API key mutation
  const createApiKeyMutation = useMutation({
    mutationFn: async (data: ApiKeyFormValues) => {
      const response = await apiRequest("POST", "/api/api-keys", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "API key created",
        description: "The API key has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create API key",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Edit API key mutation
  const updateApiKeyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ApiKeyFormValues }) => {
      const response = await apiRequest("PUT", `/api/api-keys/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "API key updated",
        description: "The API key has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update API key",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete API key mutation
  const deleteApiKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/api-keys/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "API key deleted",
        description: "The API key has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete API key",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission for creating a new API key
  const onSubmit = (data: ApiKeyFormValues) => {
    if (isEditDialogOpen && currentApiKey) {
      updateApiKeyMutation.mutate({ id: currentApiKey.id, data });
    } else {
      createApiKeyMutation.mutate(data);
    }
  };

  // Handle editing an API key
  const handleEdit = async (apiKey: ApiKey) => {
    // Fetch the full API key details including the actual key value
    try {
      const response = await apiRequest("GET", `/api/api-keys/${apiKey.id}`);
      const fullApiKey = await response.json();
      
      setCurrentApiKey(fullApiKey);
      form.reset({
        name: fullApiKey.name,
        key: fullApiKey.key,
        documentationUrl: fullApiKey.documentationUrl || "",
      });
      setIsEditDialogOpen(true);
    } catch (error) {
      toast({
        title: "Failed to load API key details",
        description: "Could not retrieve the API key details for editing.",
        variant: "destructive",
      });
    }
  };

  // Handle deleting an API key
  const handleDelete = (apiKey: ApiKey) => {
    setCurrentApiKey(apiKey);
    setIsDeleteDialogOpen(true);
  };

  // Handle copying API key to clipboard
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "The API key has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  // Open documentation URL
  const openDocumentation = (url: string) => {
    if (url) {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">API Keys</h2>
        <Button onClick={() => {
          form.reset({
            name: "",
            key: "",
            documentationUrl: "",
          });
          setIsCreateDialogOpen(true);
        }}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add API Key
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (apiKeys as ApiKey[]).length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <p className="text-muted-foreground">No API keys found. Add your first API key to get started.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Documentation</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(apiKeys as ApiKey[]).map((apiKey: ApiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell className="font-medium">{apiKey.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="mr-2">{apiKey.key}</span>
                        <Button variant="ghost" size="icon" onClick={() => handleCopy(apiKey.key)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {apiKey.documentationUrl ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openDocumentation(apiKey.documentationUrl!)}
                          className="flex items-center"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Docs
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">No documentation</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(apiKey.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(apiKey)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(apiKey)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit API Key Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditDialogOpen ? "Edit API Key" : "Add API Key"}</DialogTitle>
            <DialogDescription>
              {isEditDialogOpen ? "Update the API key details below." : "Enter the API key details below."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="People Data Labs API" {...field} />
                    </FormControl>
                    <FormDescription>A descriptive name for the API key</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input placeholder="your-api-key-here" {...field} />
                    </FormControl>
                    <FormDescription>The actual API key value</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="documentationUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Documentation URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://docs.example.com" {...field} />
                    </FormControl>
                    <FormDescription>Optional link to the API documentation</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createApiKeyMutation.isPending || updateApiKeyMutation.isPending}>
                  {(createApiKeyMutation.isPending || updateApiKeyMutation.isPending) ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </div>
                  ) : isEditDialogOpen ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the API key 
              "{currentApiKey?.name}" and remove it from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (currentApiKey) {
                  deleteApiKeyMutation.mutate(currentApiKey.id);
                }
              }}
              disabled={deleteApiKeyMutation.isPending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteApiKeyMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </div>
              ) : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ApiKeysTab;