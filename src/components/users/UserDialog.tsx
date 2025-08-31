import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, User as UserIcon, Mail, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User, Role } from "@/types";

interface UserDialogProps {
  user?: User;
  roles: Role[];
  trigger?: React.ReactNode;
  onSave?: (user: Partial<User>) => void;
}

export const UserDialog = ({ user, roles, trigger, onSave }: UserDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    roleId: user?.roleId || "",
    isActive: user?.isActive ?? true,
  });
  const { toast } = useToast();

  const isEdit = !!user;

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.email.trim()) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (!formData.roleId) {
      toast({
        title: "Error",
        description: "Please select a role",
        variant: "destructive",
      });
      return;
    }

    const selectedRole = roles.find(r => r.id === formData.roleId);
    onSave?.({
      ...formData,
      role: selectedRole
    });
    
    setOpen(false);
    toast({
      title: "Success",
      description: `User ${isEdit ? 'updated' : 'created'} successfully!`,
    });

    // Reset form if creating new
    if (!isEdit) {
      setFormData({ name: "", email: "", roleId: "", isActive: true });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-primary hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {isEdit ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            <span>{isEdit ? 'Edit User' : 'Add New User'}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Name */}
          <div>
            <Label htmlFor="name" className="flex items-center space-x-1">
              <UserIcon className="h-4 w-4" />
              <span>Full Name *</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter full name"
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" className="flex items-center space-x-1">
              <Mail className="h-4 w-4" />
              <span>Email Address *</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="user@company.com"
              disabled={isEdit} // Don't allow email changes in edit mode
            />
          </div>

          {/* Role */}
          <div>
            <Label className="flex items-center space-x-1">
              <Shield className="h-4 w-4" />
              <span>Role *</span>
            </Label>
            <Select value={formData.roleId} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, roleId: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    <div>
                      <div className="font-medium">{role.name}</div>
                      <div className="text-xs text-muted-foreground">{role.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between">
            <Label htmlFor="isActive" className="flex items-center space-x-1">
              <span>Active User</span>
            </Label>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-gradient-primary hover:opacity-90">
              {isEdit ? 'Update User' : 'Add User'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};