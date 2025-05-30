import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AdminSwitch } from "@/components/ui/admin-switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogClose,
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  UserCog, 
  Mail, 
  User, 
  AlertCircle, 
  Search, 
  Loader2, 
  ChevronUp, 
  ChevronDown,
  ChevronsUpDown,
  Key,
  KeyRound
} from "lucide-react";
import { User as UserType } from "@shared/schema";

// Helper function to get admin status from a user object
// This handles both isAdmin and is_admin properties
const getAdminStatus = (user: any): boolean => {
  console.log(`Getting admin status for user ${user.id} ${user.username}`);
  console.log(`isAdmin property: ${user.isAdmin}, type: ${typeof user.isAdmin}`);
  console.log(`is_admin property: ${user.is_admin}, type: ${typeof user.is_admin}`);
  
  // Log all user properties to debug what fields are available
  console.log('All user properties:', Object.keys(user));
  
  const status = !!(user.isAdmin || user.is_admin);
  console.log(`Computed admin status: ${status}`);
  return status;
};

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
};

// Password reset schema
const passwordSchema = z.object({
  password: z.string()
    .min(6, { message: "Password must be at least 6 characters long" })
    .max(100, { message: "Password is too long" }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function UserManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'id', direction: 'asc' });
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Keep track of which user toggles are currently being updated
  const [pendingToggles, setPendingToggles] = useState<Record<number, boolean>>({});
  
  // Form for password reset
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  // Fetch all users
  const { data: users, isLoading, refetch } = useQuery<UserType[]>({
    queryKey: ['/api/admin/users'],
  });
  
  // Filter and sort users
  useEffect(() => {
    if (!users || !Array.isArray(users)) {
      setFilteredUsers([]);
      return;
    }
    
    // First, filter users by search query
    const query = searchQuery.toLowerCase().trim();
    let filtered = users;
    if (query) {
      filtered = users.filter((user: UserType) => {
        const username = (user.username || "").toLowerCase();
        const email = (user.email || "").toLowerCase();
        const businessName = ((user as any).businessName || "").toLowerCase();
        
        return username.includes(query) || email.includes(query) || businessName.includes(query);
      });
    }
    
    // Then, sort filtered users
    const sortedUsers = [...filtered].sort((a, b) => {
      if (sortConfig.key === 'username') {
        const aValue = a.username.toLowerCase();
        const bValue = b.username.toLowerCase();
        return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else if (sortConfig.key === 'businessName') {
        const aValue = ((a as any).businessName || '').toLowerCase();
        const bValue = ((b as any).businessName || '').toLowerCase();
        return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else if (sortConfig.key === 'id') {
        return sortConfig.direction === 'asc' ? a.id - b.id : b.id - a.id;
      }
      return 0;
    });
    
    setFilteredUsers(sortedUsers);
    // Reset to first page when filtering or sorting changes
    setCurrentPage(1);
  }, [searchQuery, users, sortConfig]);
  
  // Handle sorting
  const handleSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  // Get current page of users for pagination
  const getCurrentPageUsers = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredUsers.slice(startIndex, endIndex);
  };
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  
  // Display current users based on pagination
  const currentUsers = getCurrentPageUsers();

  // User status options
  const userStatusOptions = [
    { value: "Active", label: "Active" },
    { value: "Suspended Service", label: "Suspended Service" },
    { value: "Deactivated", label: "Deactivated" },
    { value: "Cancelled", label: "Cancelled" },
    { value: "Non renew", label: "Non renew" },
  ];

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ 
      id, 
      isAdmin, 
      status 
    }: { 
      id: number; 
      isAdmin?: boolean;
      status?: string;
    }) => {
      // Mark this user as having a pending toggle if we're changing admin status
      if (isAdmin !== undefined) {
        setPendingToggles(prev => ({
          ...prev,
          [id]: true
        }));
      }
      
      const response = await apiRequest("PUT", `/api/admin/users/${id}`, { isAdmin, status });
      return { response, id, isAdmin, status };
    },
    onSuccess: async (data) => {
      console.log("Update successful, refreshing data from server");
      
      // The best approach is to rely on the server's response rather than client state
      // So we'll do a full refetch of user data
      await refetch();
      
      // Remove from pending toggles
      if (data.isAdmin !== undefined) {
        setPendingToggles(prev => {
          const updated = { ...prev };
          delete updated[data.id];
          return updated;
        });
      }
      
      // If selected user was updated, it will be refreshed via refetch
      // but let's update the selected user object too if needed
      if (selectedUser && selectedUser.id === data.id) {
        // Find the updated user in the refreshed user list
        const updatedUser = users?.find(u => u.id === data.id);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        }
      }
      
      toast({
        title: "User updated",
        description: "User has been updated successfully.",
      });
    },
    onError: (error, variables) => {
      // Remove from pending toggles in case of error
      if (variables.isAdmin !== undefined) {
        setPendingToggles(prev => {
          const updated = { ...prev };
          delete updated[variables.id];
          return updated;
        });
      }
      
      toast({
        title: "Error",
        description: `Failed to update user: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleAdminToggle = (userId: number, newStatus?: boolean) => {
    // If called from the AdminSwitch component, it will provide newStatus
    // If called from elsewhere (like the Details dialog), we need to look up the user and toggle
    const user = filteredUsers.find(u => u.id === userId);
    
    if (!user) {
      console.error(`User with ID ${userId} not found`);
      return;
    }
    
    console.log('handleAdminToggle called for user:', user);
    
    // Skip if this user already has a pending toggle
    if (pendingToggles[user.id]) {
      console.log(`Toggle operation already pending for user ${user.id}, skipping`);
      return;
    }
    
    // Check if user is admin, accounting for both property names
    const currentAdminStatus = getAdminStatus(user);
    console.log(`Current admin status for user ${user.id}: ${currentAdminStatus}`);
    console.log(`Raw values - isAdmin: ${user.isAdmin}, is_admin: ${(user as any).is_admin}`);
    
    // If called from AdminSwitch component, use the provided value
    // Otherwise toggle the current value
    const newAdminStatus = newStatus !== undefined ? newStatus : !currentAdminStatus;
    console.log(`Setting admin status for user ${user.id} to: ${newAdminStatus}`);
    
    updateUserMutation.mutate({
      id: user.id,
      isAdmin: newAdminStatus
    });
  };

  const handleStatusChange = (userId: number, status: string) => {
    updateUserMutation.mutate({
      id: userId,
      status
    });
  };

  const handleViewDetails = (user: UserType) => {
    setSelectedUser(user);
    setIsDetailsDialogOpen(true);
  };
  
  // Handle opening the password reset dialog
  const handleResetPassword = (userId: number) => {
    setPasswordUserId(userId);
    setIsPasswordDialogOpen(true);
  };
  
  // Form reset on dialog close
  useEffect(() => {
    if (!isPasswordDialogOpen) {
      form.reset();
    }
  }, [isPasswordDialogOpen, form]);
  
  // Password reset mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: number; password: string }) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/reset-password`, { password });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Reset",
        description: "Password has been successfully reset.",
      });
      setIsPasswordDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to reset password: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle password reset form submission
  const onPasswordSubmit = (values: PasswordFormValues) => {
    if (!passwordUserId) return;
    
    resetPasswordMutation.mutate({
      userId: passwordUserId,
      password: values.password
    });
  };

  return (
    <Card className="bg-white mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <UserCog className="mr-2 h-5 w-5" />
          User Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Manage user accounts and access permissions across the platform.
        </p>
        
        {/* Search bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-gray-500" />
          </div>
          <Input
            type="text"
            placeholder="Search by username or email..."
            className="pl-10 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-4 w-4 p-0" 
                onClick={() => setSearchQuery("")}
              >
                ×
              </Button>
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="text-center py-4">Loading users...</div>
        ) : !Array.isArray(filteredUsers) || filteredUsers.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            {searchQuery ? "No users match your search query" : "No users found"}
          </div>
        ) : (
          <>
            <Table>
              <TableCaption>
                {searchQuery 
                  ? `Found ${filteredUsers.length} users matching "${searchQuery}"`
                  : "List of all registered users in the system"
                }
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead onClick={() => handleSort('username')} className="cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center">
                      Username
                      {sortConfig.key === 'username' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                      {sortConfig.key !== 'username' && <ChevronsUpDown className="w-4 h-4 ml-1 opacity-50" />}
                    </div>
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead onClick={() => handleSort('businessName')} className="cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center">
                      Business
                      {sortConfig.key === 'businessName' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                      {sortConfig.key !== 'businessName' && <ChevronsUpDown className="w-4 h-4 ml-1 opacity-50" />}
                    </div>
                  </TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentUsers.map((user: UserType) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email || '-'}</TableCell>
                    <TableCell>{(user as any).businessName || '-'}</TableCell>
                    <TableCell>{user.isVerified ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <AdminSwitch
                          id={user.id}
                          initialChecked={!!(user.isAdmin || (user as any).is_admin)}
                          onToggle={handleAdminToggle}
                          isPending={!!pendingToggles[user.id]}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                          user.status === "Active" ? "bg-green-500" : 
                          user.status === "Suspended Service" ? "bg-yellow-500" : 
                          user.status === "Deactivated" ? "bg-red-500" : 
                          user.status === "Cancelled" ? "bg-gray-500" :
                          user.status === "Non renew" ? "bg-purple-500" : 
                          "bg-green-500" // Default to Active
                        }`} />
                        <Select
                          defaultValue={user.status || "Active"}
                          onValueChange={(value) => handleStatusChange(user.id, value)}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {userStatusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewDetails(user)}
                        >
                          Details
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleResetPassword(user.id)}
                          className="flex items-center"
                        >
                          <KeyRound className="mr-1 h-3 w-3" />
                          Reset Password
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Label htmlFor="page-size" className="text-sm text-gray-500">Show</Label>
                <Select 
                  value={pageSize.toString()} 
                  onValueChange={(value) => {
                    setPageSize(parseInt(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[80px]" id="page-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-500">entries per page</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    
                    if (totalPages > 5 && currentPage > 3) {
                      pageNum = currentPage - 2 + i;
                      
                      if (pageNum > totalPages) {
                        pageNum = totalPages - (4 - i);
                      }
                    }
                    
                    return (
                      <Button
                        key={i}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setCurrentPage(pageNum)}
                        disabled={pageNum > totalPages}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
        
        {/* User Details Dialog */}
        {selectedUser && (
          <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>User Analysis & Details</DialogTitle>
                <DialogDescription>
                  Comprehensive analytics and information about the selected user.
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Basic Details</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="activity">Activity & Metrics</TabsTrigger>
                </TabsList>
                
                {/* Basic Details Tab */}
                <TabsContent value="details" className="space-y-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex flex-col space-y-1">
                        <Label className="text-xs font-medium text-gray-500">ID</Label>
                        <p>{selectedUser.id}</p>
                      </div>
                      
                      <div className="flex flex-col space-y-1">
                        <Label className="text-xs font-medium text-gray-500">Username</Label>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          <p>{selectedUser.username}</p>
                        </div>
                      </div>
                      
                      {selectedUser.email && (
                        <div className="flex flex-col space-y-1">
                          <Label className="text-xs font-medium text-gray-500">Email</Label>
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            <p>{selectedUser.email}</p>
                          </div>
                        </div>
                      )}
                      
                      {selectedUser.phoneNumber && (
                        <div className="flex flex-col space-y-1">
                          <Label className="text-xs font-medium text-gray-500">Phone</Label>
                          <div className="flex items-center">
                            <svg className="h-4 w-4 mr-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                            <p>{selectedUser.phoneNumber}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-col space-y-1">
                        <Label className="text-xs font-medium text-gray-500">Role</Label>
                        <div className="flex items-center">
                          <svg className="h-4 w-4 mr-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                          </svg>
                          <p>{selectedUser.role || 'General User'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex flex-col space-y-1">
                        <Label className="text-xs font-medium text-gray-500">Business</Label>
                        <div className="flex items-center">
                          <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <p>{(selectedUser as any).businessName || 'No business associated'}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-1">
                        <Label className="text-xs font-medium text-gray-500">Account Status</Label>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <div className={`h-2 w-2 rounded-full mr-2 ${selectedUser.isVerified ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                            <span>{selectedUser.isVerified ? 'Verified' : 'Unverified'}</span>
                          </div>
                          <div className="flex items-center">
                            <div className={`h-2 w-2 rounded-full mr-2 ${!!(selectedUser.isAdmin || (selectedUser as any).is_admin) ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                            <span>{!!(selectedUser.isAdmin || (selectedUser as any).is_admin) ? 'Admin' : 'Regular User'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-1">
                        <Label className="text-xs font-medium text-gray-500">Approval Status</Label>
                        <div className="flex items-center">
                          <div className={`h-2 w-2 rounded-full mr-2 ${
                            selectedUser.approvalStatus === "APPROVED" ? "bg-green-500" : 
                            selectedUser.approvalStatus === "PENDING" ? "bg-yellow-500" : 
                            "bg-red-500" // REJECTED
                          }`}></div>
                          <span>{selectedUser.approvalStatus || 'PENDING'}</span>
                          
                          {selectedUser.approvalDate && (
                            <span className="ml-2 text-xs text-gray-500">
                              {selectedUser.approvalStatus === "APPROVED" ? "Approved on " : "Rejected on "}
                              {new Date(selectedUser.approvalDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        
                        {selectedUser.rejectionReason && (
                          <div className="mt-1 text-xs text-gray-500 pl-4">
                            Reason: {selectedUser.rejectionReason}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col space-y-1">
                        <Label className="text-xs font-medium text-gray-500">Service Status</Label>
                        <div className="flex flex-col">
                          <div className="flex items-center mb-2">
                            <div className={`h-3 w-3 rounded-full mr-2 ${
                              selectedUser.status === "Active" ? "bg-green-500" : 
                              selectedUser.status === "Suspended Service" ? "bg-yellow-500" : 
                              selectedUser.status === "Deactivated" ? "bg-red-500" : 
                              selectedUser.status === "Cancelled" ? "bg-gray-500" :
                              selectedUser.status === "Non renew" ? "bg-purple-500" : 
                              "bg-green-500" // Default to Active
                            }`} />
                            <span className="text-sm font-medium">{selectedUser.status || "Active"}</span>
                          </div>
                          
                          <Select
                            defaultValue={selectedUser.status || "Active"}
                            onValueChange={(value) => handleStatusChange(selectedUser.id, value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {userStatusOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <div className="mt-2 text-xs text-gray-600 flex items-start">
                            <AlertCircle className="h-3 w-3 mr-1 mt-0.5 text-amber-500 flex-shrink-0" />
                            <span>Changing user status will affect service availability and billing</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Analytics Tab */}
                <TabsContent value="analytics" className="space-y-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg border p-4">
                      <div className="text-sm font-medium text-gray-500 mb-2">Trial Period</div>
                      {selectedUser.isTrialPeriod ? (
                        <div>
                          <div className="flex items-center">
                            <svg className="h-5 w-5 text-amber-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            <span className="font-medium">Trial Active</span>
                          </div>
                          
                          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <div className="text-gray-500">Started</div>
                              <div>{selectedUser.trialStartDate ? new Date(selectedUser.trialStartDate).toLocaleDateString() : 'N/A'}</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Ends</div>
                              <div>{selectedUser.trialEndDate ? new Date(selectedUser.trialEndDate).toLocaleDateString() : 'N/A'}</div>
                            </div>
                          </div>
                          
                          {selectedUser.trialEndDate && (
                            <div className="mt-2">
                              {new Date(selectedUser.trialEndDate) > new Date() ? (
                                <div className="text-sm text-amber-600">
                                  {Math.ceil((new Date(selectedUser.trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining
                                </div>
                              ) : (
                                <div className="text-sm text-red-600">Trial expired</div>
                              )}
                            </div>
                          )}
                          
                          {selectedUser.trialDuration && (
                            <div className="mt-1 text-xs text-gray-500">
                              {selectedUser.trialDuration}-day trial period
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                          <span className="font-medium">Full Account</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-white rounded-lg border p-4">
                      <div className="text-sm font-medium text-gray-500 mb-2">Activity Score</div>
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                        {/* This would use real activity data in production */}
                        <span className="font-medium">{selectedUser.id % 5 === 0 ? 'High' : selectedUser.id % 3 === 0 ? 'Medium' : 'Low'}</span>
                      </div>
                      
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${selectedUser.id % 5 === 0 ? '85%' : selectedUser.id % 3 === 0 ? '50%' : '25%'}` }}
                          ></div>
                        </div>
                        
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Inactive</span>
                          <span>Very Active</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg border p-4">
                      <div className="text-sm font-medium text-gray-500 mb-2">Account Age</div>
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-indigo-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        {/* In production, would calculate from account creation date */}
                        <span className="font-medium">{selectedUser.id * 3} days</span>
                      </div>
                      
                      <div className="mt-3 text-xs text-gray-500">
                        Created on {new Date(Date.now() - (selectedUser.id * 3 * 24 * 60 * 60 * 1000)).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="text-sm font-medium mb-3">Engagement Metrics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-gray-500">Logins (30 days)</div>
                        <div className="text-xl font-semibold">{Math.floor(Math.random() * 20) + 1}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Campaigns Created</div>
                        <div className="text-xl font-semibold">{Math.floor(Math.random() * 10)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Feature Usage</div>
                        <div className="text-xl font-semibold">{Math.floor(Math.random() * 100)}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Reports Generated</div>
                        <div className="text-xl font-semibold">{Math.floor(Math.random() * 15)}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-3">
                      Note: These metrics are based on last 30 days of usage
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="text-sm font-medium mb-3">Recommendations</h3>
                    <div className="space-y-2">
                      {selectedUser.status !== "Active" && (
                        <div className="p-2 bg-amber-50 rounded text-sm">
                          Consider reactivating this user account to improve platform metrics.
                        </div>
                      )}
                      {selectedUser.isTrialPeriod && selectedUser.trialEndDate && new Date(selectedUser.trialEndDate) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) && (
                        <div className="p-2 bg-blue-50 rounded text-sm">
                          Trial period ending soon. Send user a reminder to upgrade their account.
                        </div>
                      )}
                      {!selectedUser.email && (
                        <div className="p-2 bg-green-50 rounded text-sm">
                          User has no email on file. Suggest updating profile for better communication.
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                {/* Activity Tab */}
                <TabsContent value="activity" className="space-y-4 py-4">
                  <div className="bg-white rounded-lg border p-4 mb-4">
                    <h3 className="text-sm font-medium mb-3">Recent Activity</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Action</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* In production, this would display actual activity logs */}
                        <TableRow>
                          <TableCell className="font-medium">Login</TableCell>
                          <TableCell>{new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString()}</TableCell>
                          <TableCell>IP: 192.168.1.{Math.floor(Math.random() * 255)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Campaign Created</TableCell>
                          <TableCell>{new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleString()}</TableCell>
                          <TableCell>Facebook Ads - Summer Promotion</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Report Generated</TableCell>
                          <TableCell>{new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleString()}</TableCell>
                          <TableCell>Monthly ROI Analysis</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Profile Updated</TableCell>
                          <TableCell>{new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toLocaleString()}</TableCell>
                          <TableCell>Changed business information</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                    <div className="text-xs text-gray-500 mt-3">
                      Note: This activity log shows the most recent actions taken by the user.
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg border p-4">
                      <h3 className="text-sm font-medium mb-3">Feature Usage</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-gray-500">Campaign Management</span>
                            <span className="text-xs font-medium">75%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-gray-500">ROI Analytics</span>
                            <span className="text-xs font-medium">90%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '90%' }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-gray-500">Competitor Analysis</span>
                            <span className="text-xs font-medium">45%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-gray-500">AI Recommendations</span>
                            <span className="text-xs font-medium">30%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg border p-4">
                      <h3 className="text-sm font-medium mb-3">Login History</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <div className="flex items-center">
                            <svg className="h-4 w-4 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                              <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            Today
                          </div>
                          <span className="text-gray-500">2 logins</span>
                        </div>
                        <div className="flex justify-between">
                          <div className="flex items-center">
                            <svg className="h-4 w-4 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                              <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            Last 7 days
                          </div>
                          <span className="text-gray-500">8 logins</span>
                        </div>
                        <div className="flex justify-between">
                          <div className="flex items-center">
                            <svg className="h-4 w-4 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                              <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            Last 30 days
                          </div>
                          <span className="text-gray-500">15 logins</span>
                        </div>
                        <div className="flex justify-between">
                          <div className="flex items-center">
                            <svg className="h-4 w-4 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                              <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            Last login
                          </div>
                          <span className="text-gray-500">{new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                    Close
                  </Button>
                  
                  <Button onClick={() => {
                    handleAdminToggle(selectedUser.id);
                    setIsDetailsDialogOpen(false);
                  }}>
                    {!!(selectedUser.isAdmin || (selectedUser as any).is_admin) ? "Remove Admin" : "Make Admin"}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        
        {/* Password Reset Dialog */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <KeyRound className="mr-2 h-5 w-5" />
                Reset User Password
              </DialogTitle>
              <DialogDescription>
                Set a new password for this user. The change will take effect immediately.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Enter new password" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Password must be at least 6 characters.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Confirm new password" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="mt-6">
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => setIsPasswordDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={resetPasswordMutation.isPending}
                    className="ml-2"
                  >
                    {resetPasswordMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}