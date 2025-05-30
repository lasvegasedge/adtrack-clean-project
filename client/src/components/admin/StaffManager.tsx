import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Users, 
  Search, 
  UserPlus, 
  Edit, 
  Key, 
  ShieldCheck, 
  Mail,
  Pencil,
  UserCog,
  Loader2
} from "lucide-react";
import { UserRole } from "@shared/schema";

// Define form schemas
const createStaffSchema = z.object({
  username: z.string().email("Username must be a valid email"),
  email: z.string().email("Email must be valid"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum([
    UserRole.PLATFORM_ADMIN,
    UserRole.BUSINESS_ADMIN,
    UserRole.BILLING_MANAGER,
    UserRole.MARKETING_USER,
    UserRole.GENERAL_USER
  ])
});

const updatePasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters")
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type StaffUser = {
  id: number;
  username: string;
  email?: string;
  isAdmin?: boolean;
  role?: string;
  status?: string;
};

export default function StaffManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredStaff, setFilteredStaff] = useState<StaffUser[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Create staff form
  const createForm = useForm<z.infer<typeof createStaffSchema>>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      role: UserRole.PLATFORM_ADMIN
    }
  });

  // Password update form
  const passwordForm = useForm<z.infer<typeof updatePasswordSchema>>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: ""
    }
  });

  // Edit user form
  type EditFormValues = {
    role: UserRole;
    status: string;
  };
  
  const editForm = useForm<EditFormValues>({
    defaultValues: {
      role: UserRole.PLATFORM_ADMIN,
      status: "Active"
    }
  });

  // Fetch staff members
  const { data: staffMembers, isLoading: isLoadingStaff, refetch } = useQuery<StaffUser[]>({
    queryKey: ['/api/admin/staff'],
    queryFn: async () => {
      const response = await fetch('/api/admin/staff');
      if (!response.ok) throw new Error('Failed to fetch staff members');
      return response.json();
    }
  });

  // Filter staff based on search query
  useEffect(() => {
    if (!staffMembers) return;
    
    const query = searchQuery.toLowerCase();
    if (!query) {
      setFilteredStaff(staffMembers);
      return;
    }
    
    setFilteredStaff(staffMembers.filter(user => 
      user.username.toLowerCase().includes(query) || 
      (user.email && user.email.toLowerCase().includes(query))
    ));
  }, [searchQuery, staffMembers]);

  // Mutation for creating staff
  const createStaffMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createStaffSchema>) => {
      const response = await apiRequest('POST', '/api/admin/staff', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Staff member created",
        description: "New staff member has been added successfully.",
      });
      createForm.reset();
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create staff member",
        variant: "destructive"
      });
    }
  });

  // Mutation for updating password
  const updatePasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: number, newPassword: string }) => {
      const response = await apiRequest('PUT', `/api/admin/users/${userId}/password`, { newPassword });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "User password has been updated successfully.",
      });
      passwordForm.reset();
      setIsPasswordDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive"
      });
    }
  });

  // Mutation for updating user role
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, role, status }: { userId: number, role?: string, status?: string }) => {
      const response = await apiRequest('PUT', `/api/admin/users/${userId}`, { 
        role, 
        status,
        isAdmin: role === UserRole.PLATFORM_ADMIN // Set isAdmin based on role
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User updated",
        description: "User information has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive"
      });
    }
  });

  // Handle staff creation
  const onSubmitCreateStaff = (data: z.infer<typeof createStaffSchema>) => {
    createStaffMutation.mutate(data);
  };

  // Handle password update
  const onSubmitPasswordUpdate = (data: z.infer<typeof updatePasswordSchema>) => {
    if (!selectedUserId) return;
    updatePasswordMutation.mutate({ userId: selectedUserId, newPassword: data.newPassword });
  };

  // Handle edit user
  const onSubmitEditUser = (data: any) => {
    if (!selectedUserId) return;
    updateUserMutation.mutate({ 
      userId: selectedUserId, 
      role: data.role as UserRole,
      status: data.status
    });
  };

  // Open password dialog for a user
  const handlePasswordUpdate = (userId: number) => {
    setSelectedUserId(userId);
    passwordForm.reset();
    setIsPasswordDialogOpen(true);
  };

  // Open edit dialog for a user
  const handleEditUser = (user: StaffUser) => {
    setSelectedUserId(user.id);
    editForm.reset({
      role: (user.role as UserRole) || UserRole.GENERAL_USER,
      status: user.status || "Active"
    });
    setIsEditDialogOpen(true);
  };

  // Get role badge color
  const getRoleBadge = (role?: string) => {
    if (!role) return <Badge variant="outline">Unknown</Badge>;
    
    switch (role) {
      case UserRole.PLATFORM_ADMIN:
        return <Badge className="bg-purple-600">Platform Admin</Badge>;
      case UserRole.BUSINESS_ADMIN:
        return <Badge className="bg-blue-600">Business Admin</Badge>;
      case UserRole.BILLING_MANAGER:
        return <Badge className="bg-green-600">Billing Manager</Badge>;
      case UserRole.MARKETING_USER:
        return <Badge className="bg-amber-600">Marketing User</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  // Get status badge color
  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'suspended':
        return <Badge className="bg-orange-500">Suspended</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="bg-white mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <UserCog className="mr-2 h-5 w-5" />
          AdTrack Staff Management
        </CardTitle>
        <CardDescription>
          Manage internal AdTrack employee accounts, roles and permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search and Create Staff */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative flex-1 max-w-sm">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-gray-500" />
            </div>
            <Input
              type="text"
              placeholder="Search by username or email..."
              className="pl-10 bg-gray-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Staff Member</DialogTitle>
                <DialogDescription>
                  Add a new internal AdTrack employee with appropriate role and permissions.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onSubmitCreateStaff)} className="space-y-4 py-4">
                  <FormField
                    control={createForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username (Email)</FormLabel>
                        <FormControl>
                          <Input placeholder="staff@adtrack.online" {...field} />
                        </FormControl>
                        <FormDescription>This will be used for login.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="staff@adtrack.online" {...field} />
                        </FormControl>
                        <FormDescription>For notifications and communication.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormDescription>Minimum 6 characters.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Staff Role</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <div className="px-2 py-1.5 text-sm font-semibold text-primary">
                              AdTrack Staff Roles
                            </div>
                            <SelectItem value={UserRole.PLATFORM_ADMIN}>Platform Admin</SelectItem>
                            
                            <div className="h-px my-2 bg-muted" />
                            
                            <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                              Business User Roles (Testing Only)
                            </div>
                            <SelectItem value={UserRole.BUSINESS_ADMIN}>Business Admin</SelectItem>
                            <SelectItem value={UserRole.BILLING_MANAGER}>Billing Manager</SelectItem>
                            <SelectItem value={UserRole.MARKETING_USER}>Marketing User</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-amber-600 font-medium">
                          Platform Admin has full system access. Use with caution.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createStaffMutation.isPending}>
                      {createStaffMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Staff
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Staff Table */}
        {isLoadingStaff ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !filteredStaff || filteredStaff.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? "No staff members match your search" : "No staff members found"}
          </div>
        ) : (
          <Table>
            <TableCaption>List of AdTrack internal staff members</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email || "-"}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center"
                        onClick={() => handleEditUser(user)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center"
                        onClick={() => handlePasswordUpdate(user.id)}
                      >
                        <Key className="h-3.5 w-3.5 mr-1" />
                        Password
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        
        {/* Password Update Dialog */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Update Password</DialogTitle>
              <DialogDescription>
                Set a new password for this staff member.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onSubmitPasswordUpdate)} className="space-y-4 py-4">
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updatePasswordMutation.isPending}>
                    {updatePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Password
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Staff Member</DialogTitle>
              <DialogDescription>
                Update role and status for this staff member.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={editForm.handleSubmit(onSubmitEditUser)} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  onValueChange={(value) => editForm.setValue('role', value as UserRole)}
                  defaultValue={editForm.getValues().role}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1.5 text-sm font-semibold text-primary">
                      AdTrack Staff Roles
                    </div>
                    <SelectItem value={UserRole.PLATFORM_ADMIN}>Platform Admin</SelectItem>
                    
                    <div className="h-px my-2 bg-muted" />
                    
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                      Business User Roles (Testing Only)
                    </div>
                    <SelectItem value={UserRole.BUSINESS_ADMIN}>Business Admin</SelectItem>
                    <SelectItem value={UserRole.BILLING_MANAGER}>Billing Manager</SelectItem>
                    <SelectItem value={UserRole.MARKETING_USER}>Marketing User</SelectItem>
                    <SelectItem value={UserRole.GENERAL_USER}>General User</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs mt-1 text-amber-600">Warning: Platform Admin has full system access. Use with caution.</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  onValueChange={(value) => editForm.setValue('status', value)}
                  defaultValue={editForm.getValues().status}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}