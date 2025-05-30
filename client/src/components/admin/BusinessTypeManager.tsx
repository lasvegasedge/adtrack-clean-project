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

export default function BusinessTypeManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newTypeName, setNewTypeName] = useState("");
  const [editedTypeName, setEditedTypeName] = useState("");
  const [editingTypeId, setEditingTypeId] = useState<number | null>(null);
  const [deletingTypeId, setDeletingTypeId] = useState<number | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch business types
  const { data: businessTypes, isLoading } = useQuery({
    queryKey: ['/api/business-types'],
  });

  // Create business type mutation
  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest("POST", "/api/business-types", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-types'] });
      setNewTypeName("");
      toast({
        title: "Type added",
        description: "Business type has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add type: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update business type mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      return await apiRequest("PUT", `/api/business-types/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-types'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Type updated",
        description: "Business type has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update type: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete business type mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/business-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-types'] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Type deleted",
        description: "Business type has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete type: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleAddType = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTypeName.trim()) {
      createMutation.mutate(newTypeName.trim());
    }
  };

  const handleEditClick = (id: number, name: string) => {
    setEditingTypeId(id);
    setEditedTypeName(name);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (editingTypeId && editedTypeName.trim()) {
      updateMutation.mutate({
        id: editingTypeId,
        name: editedTypeName.trim()
      });
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeletingTypeId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingTypeId) {
      deleteMutation.mutate(deletingTypeId);
    }
  };

  return (
    <Card className="bg-white mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Business Types</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Configure the business types available during sign up.
        </p>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-md font-medium">Current Business Types</h4>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="link" className="text-sm text-primary">
                  Add New Type
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Business Type</DialogTitle>
                  <DialogDescription>
                    Enter the name of the new business type to add.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddType}>
                  <Input
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="Enter business type"
                    className="mb-4"
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Adding..." : "Add Type"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          {isLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : !businessTypes?.length ? (
            <div className="text-center py-4 text-gray-500">No business types found</div>
          ) : (
            <ul className="border rounded-lg overflow-hidden">
              {businessTypes.map((type) => (
                <li 
                  key={type.id} 
                  className="flex items-center justify-between p-3 border-b border-gray-200 last:border-b-0"
                >
                  <span>{type.name}</span>
                  <div className="flex items-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEditClick(type.id, type.name)}
                      className="text-gray-600 mr-1"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteClick(type.id)}
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
          <h4 className="text-md font-medium mb-2">Add New Business Type</h4>
          <form onSubmit={handleAddType} className="flex">
            <Input
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="Enter business type"
              className="flex-grow rounded-r-none"
            />
            <Button 
              type="submit" 
              className="rounded-l-none"
              disabled={createMutation.isPending || !newTypeName.trim()}
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
            <DialogTitle>Edit Business Type</DialogTitle>
            <DialogDescription>
              Update the name of the business type.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={editedTypeName}
            onChange={(e) => setEditedTypeName(e.target.value)}
            placeholder="Enter business type"
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
              disabled={updateMutation.isPending || !editedTypeName.trim()}
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
              This will permanently delete the business type. This action cannot be undone.
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
