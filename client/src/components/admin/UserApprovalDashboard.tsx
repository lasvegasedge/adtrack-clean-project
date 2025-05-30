import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle, XCircle, UserPlus, RefreshCw, Phone, Mail, MoreHorizontal, Check, X, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// User approval dashboard component
export default function UserApprovalDashboard() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  
  // Fetch pending users
  const { data: pendingUsers, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/pending-users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/pending-users");
      return response.json();
    }
  });
  
  // Approve user mutation
  const approveMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("POST", "/api/admin/approve-user", { userId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Approved",
        description: "User has been approved successfully",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Reject user mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: number; reason: string }) => {
      const response = await apiRequest("POST", "/api/admin/reject-user", { userId, reason });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Rejected",
        description: "User has been rejected successfully",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-users"] });
      setIsRejectionDialogOpen(false);
      setRejectionReason("");
    },
    onError: (error: Error) => {
      toast({
        title: "Rejection Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Open rejection dialog
  const handleOpenRejectDialog = (userId: number) => {
    setSelectedUserId(userId);
    setIsRejectionDialogOpen(true);
  };
  
  // Handle user rejection
  const handleRejectUser = () => {
    if (selectedUserId) {
      rejectMutation.mutate({ userId: selectedUserId, reason: rejectionReason });
    }
  };
  
  // Handle user approval
  const handleApproveUser = (userId: number) => {
    approveMutation.mutate(userId);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
        <XCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold">Error Loading Pending Users</h3>
        <p className="text-muted-foreground mb-4">There was a problem loading the pending user requests.</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Approval Dashboard</h2>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>
      
      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">
            Pending Approvals 
            {pendingUsers?.length > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingUsers.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          {pendingUsers?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8">
                <CheckCircle className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-lg font-semibold">No Pending Requests</h3>
                <p className="text-muted-foreground">All user accounts have been processed.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingUsers?.map((user: any) => (
                <Card key={user.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/50">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Pending</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <CardTitle className="mt-2">{user.username}</CardTitle>
                    <CardDescription>
                      Business: {user.businessName || "Not specified"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{user.email || user.username}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{user.phoneNumber || "No phone number"}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <UserPlus className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>Verified: {user.isVerified ? "Yes" : "No"}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => {
                          window.location.href = `/admin?tab=users&user=${user.id}`;
                        }}
                        title="View Details"
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={() => handleOpenRejectDialog(user.id)}
                        disabled={rejectMutation.isPending}
                      >
                        {rejectMutation.isPending && selectedUserId === user.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="mr-2 h-4 w-4" />
                        )}
                        Reject
                      </Button>
                      <Button 
                        variant="default" 
                        onClick={() => handleApproveUser(user.id)}
                        disabled={approveMutation.isPending}
                      >
                        {approveMutation.isPending && selectedUserId === user.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        Approve
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="recent">
          <Card>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingUsers?.length > 0 ? pendingUsers.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email || user.username}</TableCell>
                      <TableCell>
                        <Badge variant={user.isVerified ? 'default' : 'outline'}>
                          {user.isVerified ? 'Verified' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Button 
                                variant="ghost" 
                                className="w-full justify-start" 
                                onClick={() => {
                                  window.location.href = `/admin?tab=users&user=${user.id}`;
                                }}
                              >
                                <Users className="mr-2 h-4 w-4" />
                                <span>View Details</span>
                              </Button>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Button 
                                variant="ghost" 
                                className="w-full justify-start" 
                                onClick={() => handleApproveUser(user.id)}
                              >
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span>Approve</span>
                              </Button>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Button 
                                variant="ghost" 
                                className="w-full justify-start" 
                                onClick={() => handleOpenRejectDialog(user.id)}
                              >
                                <X className="mr-2 h-4 w-4 text-red-500" />
                                <span>Reject</span>
                              </Button>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                        No pending approval requests found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Rejection reason dialog */}
      <Dialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject User Account</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this account. This will be included in the notification email sent to the user.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rejectionReason">Rejection Reason</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectionDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectUser}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}