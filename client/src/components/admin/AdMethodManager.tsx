import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Trash2 } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdMethodManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMethodName, setNewMethodName] = useState("");
  const [editedMethodName, setEditedMethodName] = useState("");
  const [editingMethodId, setEditingMethodId] = useState<number | null>(null);
  const [deletingMethodId, setDeletingMethodId] = useState<number | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch ad methods
  const { data: adMethods, isLoading } = useQuery({
    queryKey: ['/api/ad-methods'],
  });

  // Create ad method mutation
  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest("POST", "/api/ad-methods", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ad-methods'] });
      setNewMethodName("");
      toast({
        title: "Method added",
        description: "Advertisement method has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add method: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update ad method mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      return await apiRequest("PUT", `/api/ad-methods/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ad-methods'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Method updated",
        description: "Advertisement method has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update method: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete ad method mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/ad-methods/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ad-methods'] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Method deleted",
        description: "Advertisement method has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete method: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleAddMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMethodName.trim()) {
      createMutation.mutate(newMethodName.trim());
    }
  };

  const handleEditClick = (id: number, name: string) => {
    setEditingMethodId(id);
    setEditedMethodName(name);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (editingMethodId && editedMethodName.trim()) {
      updateMutation.mutate({
        id: editingMethodId,
        name: editedMethodName.trim()
      });
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeletingMethodId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingMethodId) {
      deleteMutation.mutate(deletingMethodId);
    }
  };

  return (
    <Card className="bg-white mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Advertisement Methods</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Configure the advertisement methods available to business owners in the application.
        </p>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-md font-medium">Current Methods</h4>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="link" className="text-sm text-primary">
                  Add New Method
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Advertisement Method</DialogTitle>
                  <DialogDescription>
                    Enter the name of the new advertisement method to add.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddMethod}>
                  <Input
                    value={newMethodName}
                    onChange={(e) => setNewMethodName(e.target.value)}
                    placeholder="Enter method name"
                    className="mb-4"
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Adding..." : "Add Method"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          {isLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : !adMethods?.length ? (
            <div className="text-center py-4 text-gray-500">No methods found</div>
          ) : (
            <ul className="border rounded-lg overflow-hidden">
              {adMethods.map((method) => (
                <li 
                  key={method.id} 
                  className="flex items-center justify-between p-3 border-b border-gray-200 last:border-b-0"
                >
                  <span>{method.name}</span>
                  <div className="flex items-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEditClick(method.id, method.name)}
                      className="text-gray-600 mr-1"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteClick(method.id)}
                      className="text-gray-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div>
          <h4 className="text-md font-medium mb-2">Add New Advertisement Method</h4>
          <form onSubmit={handleAddMethod} className="flex">
            <Input
              value={newMethodName}
              onChange={(e) => setNewMethodName(e.target.value)}
              placeholder="Enter method name"
              className="flex-grow rounded-r-none"
            />
            <Button 
              type="submit" 
              className="rounded-l-none"
              disabled={createMutation.isPending || !newMethodName.trim()}
            >
              Add
            </Button>
          </form>
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Advertisement Method</DialogTitle>
            <DialogDescription>
              Update the name of the advertisement method.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={editedMethodName}
            onChange={(e) => setEditedMethodName(e.target.value)}
            placeholder="Enter method name"
            className="mb-4"
          />
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditSubmit} 
              disabled={updateMutation.isPending || !editedMethodName.trim()}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the advertisement method. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
