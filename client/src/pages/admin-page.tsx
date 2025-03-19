import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, Trash2, UserPlus, Edit, Save, X } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  active: boolean;
}

interface ScannerVersion {
  id: number;
  platform: 'windows' | 'mac';
  version: string;
  uploadedAt: string;
  uploadedBy: number;
}

const AdminPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [brandLogo, setBrandLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [windowsScanner, setWindowsScanner] = useState<File | null>(null);
  const [macScanner, setMacScanner] = useState<File | null>(null);

  // Check if the current user has admin privileges
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to access the admin section.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>This area is restricted to administrators only.</p>
          </CardContent>
          <CardFooter>
            <Link href="/">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // User Management Tab
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/admin/users');
        return response.json();
      } catch (error) {
        toast({
          title: "Failed to load users",
          description: "There was an error loading the user list.",
          variant: "destructive"
        });
        return [];
      }
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      const response = await apiRequest('PUT', `/api/admin/users/${userData.id}`, userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setEditingUser(null);
      toast({
        title: "User updated",
        description: "The user has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update user.",
        variant: "destructive"
      });
    }
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      const response = await apiRequest('POST', '/api/admin/users', userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setNewUser({
        username: '',
        email: '',
        password: '',
        role: 'user'
      });
      toast({
        title: "User created",
        description: "The new user has been successfully created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Creation failed",
        description: error.message || "Failed to create user.",
        variant: "destructive"
      });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest('DELETE', `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User deleted",
        description: "The user has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Deletion failed",
        description: error.message || "Failed to delete user.",
        variant: "destructive"
      });
    }
  });

  // Branding Tab
  const uploadLogoMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // The fourth parameter is for FormData, removing the boolean flag
      const response = await apiRequest('POST', '/api/admin/branding/logo', formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Logo updated",
        description: "The company logo has been successfully updated.",
      });
      setBrandLogo(null);
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload logo.",
        variant: "destructive"
      });
    }
  });

  // Scanner Upload Tab
  const { data: scannerVersions, isLoading: isLoadingVersions } = useQuery({
    queryKey: ['/api/admin/scanners'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/admin/scanners');
        return response.json();
      } catch (error) {
        toast({
          title: "Failed to load scanner versions",
          description: "There was an error loading the scanner versions.",
          variant: "destructive"
        });
        return [];
      }
    }
  });

  const uploadScannerMutation = useMutation({
    mutationFn: async ({ platform, file }: { platform: string, file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('platform', platform);
      
      const response = await apiRequest('POST', '/api/admin/scanners', formData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/scanners'] });
      setWindowsScanner(null);
      setMacScanner(null);
      toast({
        title: "Scanner uploaded",
        description: "The scanner file has been successfully uploaded.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload scanner.",
        variant: "destructive"
      });
    }
  });

  const deleteScannerMutation = useMutation({
    mutationFn: async (scannerId: number) => {
      await apiRequest('DELETE', `/api/admin/scanners/${scannerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/scanners'] });
      toast({
        title: "Scanner deleted",
        description: "The scanner has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Deletion failed",
        description: error.message || "Failed to delete scanner.",
        variant: "destructive"
      });
    }
  });

  // File handling functions
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBrandLogo(file);
      
      // Preview the image
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScannerChange = (e: React.ChangeEvent<HTMLInputElement>, platform: 'windows' | 'mac') => {
    if (e.target.files && e.target.files[0]) {
      if (platform === 'windows') {
        setWindowsScanner(e.target.files[0]);
      } else {
        setMacScanner(e.target.files[0]);
      }
    }
  };

  const handleUploadLogo = () => {
    if (brandLogo) {
      const formData = new FormData();
      formData.append('logo', brandLogo);
      uploadLogoMutation.mutate(formData);
    }
  };

  const handleUploadScanner = (platform: 'windows' | 'mac') => {
    const file = platform === 'windows' ? windowsScanner : macScanner;
    if (file) {
      uploadScannerMutation.mutate({ platform, file });
    }
  };

  const handleSaveUser = () => {
    if (editingUser) {
      updateUserMutation.mutate(editingUser);
    }
  };

  const handleCreateUser = () => {
    if (newUser.username && newUser.email && newUser.password) {
      createUserMutation.mutate(newUser);
    } else {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Administration</h1>
        <Link href="/">
          <Button variant="outline">
            Back to Dashboard
          </Button>
        </Link>
      </div>
      
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="scanners">Scanner Tools</TabsTrigger>
        </TabsList>
        
        {/* User Management Tab */}
        <TabsContent value="users">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* User List */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>User List</CardTitle>
                <CardDescription>Manage system users and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableCaption>List of system users</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users && users.length > 0 ? (
                        users.map((user: User) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={
                                user.role === 'admin' ? 'destructive' : 
                                user.role === 'manager' ? 'default' : 'secondary'
                              }>
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {user.active ? (
                                <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-100 text-red-800">Inactive</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setEditingUser(user)}
                              >
                                <Edit className="h-4 w-4 mr-1" /> Edit
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the user
                                      account and remove the data from the server.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deleteUserMutation.mutate(user.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6">
                            No users found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Edit User Form */}
            {editingUser ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Edit User</CardTitle>
                    <CardDescription>Update user details</CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setEditingUser(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-username">Username</Label>
                    <Input 
                      id="edit-username" 
                      value={editingUser.username} 
                      onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input 
                      id="edit-email" 
                      type="email" 
                      value={editingUser.email} 
                      onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-role">Role</Label>
                    <Select 
                      value={editingUser.role} 
                      onValueChange={(value) => setEditingUser({...editingUser, role: value})}
                    >
                      <SelectTrigger id="edit-role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch 
                      id="edit-active" 
                      checked={editingUser.active}
                      onCheckedChange={(checked) => setEditingUser({...editingUser, active: checked})}
                    />
                    <Label htmlFor="edit-active">Active</Label>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button onClick={handleSaveUser}>
                    {updateUserMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving</>
                    ) : (
                      <><Save className="h-4 w-4 mr-2" /> Save Changes</>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Add New User</CardTitle>
                  <CardDescription>Create a new system user</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-username">Username</Label>
                    <Input 
                      id="new-username" 
                      value={newUser.username} 
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-email">Email</Label>
                    <Input 
                      id="new-email" 
                      type="email" 
                      value={newUser.email} 
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Password</Label>
                    <Input 
                      id="new-password" 
                      type="password" 
                      value={newUser.password} 
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-role">Role</Label>
                    <Select 
                      value={newUser.role} 
                      onValueChange={(value) => setNewUser({...newUser, role: value})}
                    >
                      <SelectTrigger id="new-role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={handleCreateUser}
                  >
                    {createUserMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating</>
                    ) : (
                      <><UserPlus className="h-4 w-4 mr-2" /> Create User</>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </TabsContent>
        
        {/* Branding Tab */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Company Branding</CardTitle>
              <CardDescription>Update your company logo and branding settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Logo Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Company Logo</h3>
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="logo-upload" className="block mb-2">Upload Logo</Label>
                    <div className="flex items-start space-x-4">
                      <div className="border border-dashed border-input rounded-lg p-4 w-full">
                        <Input 
                          id="logo-upload" 
                          type="file" 
                          accept="image/*" 
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                        <Label 
                          htmlFor="logo-upload" 
                          className="flex flex-col items-center justify-center py-4 cursor-pointer text-center"
                        >
                          <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                          <span className="text-sm font-medium">Click to upload or drag and drop</span>
                          <span className="text-xs text-muted-foreground mt-1">SVG, PNG, JPG (max. 2MB)</span>
                        </Label>
                      </div>
                    </div>
                    
                    {brandLogo && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-2">Selected file: {brandLogo.name}</p>
                        <Button 
                          onClick={handleUploadLogo}
                          disabled={uploadLogoMutation.isPending}
                        >
                          {uploadLogoMutation.isPending ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading</>
                          ) : (
                            'Upload Logo'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label className="block mb-2">Preview</Label>
                    <div className="border rounded-lg p-4 h-40 flex items-center justify-center bg-card">
                      {logoPreview ? (
                        <img 
                          src={logoPreview} 
                          alt="Logo Preview" 
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <p>No logo selected</p>
                          <p className="text-xs mt-1">Logo will appear here after selection</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Company Colors (future implementation) */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Company Colors</h3>
                <Separator />
                <p className="text-muted-foreground">
                  This feature will be available in a future update. You will be able to customize your company colors for the assessment platform.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Scanner Tools Tab */}
        <TabsContent value="scanners">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Scanner Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Scanner Tools</CardTitle>
                <CardDescription>
                  Upload the latest scanner tools for Windows and macOS
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Windows Scanner */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Windows Scanner</h3>
                  <div className="space-y-2">
                    <Label htmlFor="windows-scanner" className="block">
                      Upload Windows Scanner ZIP
                    </Label>
                    <div className="border border-dashed border-input rounded-lg p-4">
                      <Input
                        id="windows-scanner"
                        type="file"
                        accept=".zip"
                        onChange={(e) => handleScannerChange(e, 'windows')}
                        className="hidden"
                      />
                      <Label
                        htmlFor="windows-scanner"
                        className="flex flex-col items-center justify-center py-4 cursor-pointer text-center"
                      >
                        <Upload className="h-6 w-6 mb-2 text-muted-foreground" />
                        <span className="text-sm font-medium">Click to upload</span>
                        <span className="text-xs text-muted-foreground mt-1">ZIP files only</span>
                      </Label>
                    </div>
                    {windowsScanner && (
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-muted-foreground">
                          {windowsScanner.name} ({(windowsScanner.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleUploadScanner('windows')}
                          disabled={uploadScannerMutation.isPending}
                        >
                          {uploadScannerMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Upload'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Mac Scanner */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">macOS Scanner</h3>
                  <div className="space-y-2">
                    <Label htmlFor="mac-scanner" className="block">
                      Upload macOS Scanner ZIP
                    </Label>
                    <div className="border border-dashed border-input rounded-lg p-4">
                      <Input
                        id="mac-scanner"
                        type="file"
                        accept=".zip"
                        onChange={(e) => handleScannerChange(e, 'mac')}
                        className="hidden"
                      />
                      <Label
                        htmlFor="mac-scanner"
                        className="flex flex-col items-center justify-center py-4 cursor-pointer text-center"
                      >
                        <Upload className="h-6 w-6 mb-2 text-muted-foreground" />
                        <span className="text-sm font-medium">Click to upload</span>
                        <span className="text-xs text-muted-foreground mt-1">ZIP files only</span>
                      </Label>
                    </div>
                    {macScanner && (
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-muted-foreground">
                          {macScanner.name} ({(macScanner.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleUploadScanner('mac')}
                          disabled={uploadScannerMutation.isPending}
                        >
                          {uploadScannerMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Upload'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Scanner Version History */}
            <Card>
              <CardHeader>
                <CardTitle>Scanner Version History</CardTitle>
                <CardDescription>
                  View and manage previously uploaded scanner versions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingVersions ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableCaption>List of uploaded scanner versions</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Platform</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scannerVersions && scannerVersions.length > 0 ? (
                        scannerVersions.map((version: ScannerVersion) => (
                          <TableRow key={version.id}>
                            <TableCell>
                              <Badge variant={version.platform === 'windows' ? 'default' : 'secondary'}>
                                {version.platform === 'windows' ? 'Windows' : 'macOS'}
                              </Badge>
                            </TableCell>
                            <TableCell>{version.version}</TableCell>
                            <TableCell>
                              {new Date(version.uploadedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will delete this scanner version.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteScannerMutation.mutate(version.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6">
                            No scanner versions uploaded yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;