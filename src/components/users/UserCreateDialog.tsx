import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import SubscriptionDialog from '@/components/subscriptions/SubscriptionDialog';

interface UserCreateDialogProps {
  trigger?: React.ReactNode;
  onSuccess: () => void;
}

type UserRole = 'user' | 'admin' | 'superadmin' | 'crm' | 'blaster' | 'warmup';

const UserCreateDialog: React.FC<UserCreateDialogProps> = ({ trigger, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('crm'); // Default to crm for better UX
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  // Get available roles based on current user
  const getAvailableRoles = (): { value: UserRole; label: string }[] => {
    if (profile?.role === 'superadmin') {
      return [
        { value: 'admin', label: 'Admin' },
        { value: 'user', label: 'User' },
        { value: 'crm', label: 'CRM' },
        { value: 'blaster', label: 'Blaster' },
        { value: 'warmup', label: 'Warmup' }
      ];
    } else if (profile?.role === 'admin') {
      return [
        { value: 'crm', label: 'CRM' },
        { value: 'blaster', label: 'Blaster' },
        { value: 'warmup', label: 'Warmup' }
      ];
    }
    return [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Call the edge function to create user
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email,
          password,
          fullName,
          role
        }
      });

      if (error) {
        setError(`Error creating user: ${error.message}`);
        setLoading(false);
        return;
      }

      if (!data.success) {
        setError(data.error || 'Failed to create user');
        setLoading(false);
        return;
      }

      setCreatedUser(data.user);
      setSuccess(`User created successfully!`);
      
      toast({
        title: "User Created",
        description: `${email} has been created successfully`,
      });

      onSuccess();

    } catch (err: any) {
      setError(`Unexpected error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSetSubscription = () => {
    setShowSubscriptionDialog(true);
  };

  const handleSubscriptionSuccess = () => {
    setShowSubscriptionDialog(false);
    // Reset form and close dialog
    setTimeout(() => {
      setOpen(false);
      resetForm();
    }, 1000);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setRole('crm'); // Reset to default crm
    setError('');
    setSuccess('');
    setCreatedUser(null);
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button className="bg-gradient-primary">
              <UserPlus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <UserPlus className="w-5 h-5" />
              <span>Create New User</span>
            </DialogTitle>
            <DialogDescription>
              Create a new user account and assign permissions.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-success bg-success/10 text-success">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading || Boolean(success)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || Boolean(success)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || Boolean(success)}
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 8 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(value: UserRole) => setRole(value)} disabled={loading || Boolean(success)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableRoles().map((roleOption) => (
                    <SelectItem key={roleOption.value} value={roleOption.value}>
                      {roleOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {!success && (
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            )}

            {success && createdUser && (
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                >
                  Done
                </Button>
                {/* Only superadmin can set subscription */}
                {profile?.role === 'superadmin' && (
                  <Button
                    type="button"
                    onClick={handleSetSubscription}
                    className="bg-gradient-primary"
                  >
                    Set Subscription
                  </Button>
                )}
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* Subscription Dialog */}
      {createdUser && (
        <SubscriptionDialog
          user={createdUser}
          onSuccess={handleSubscriptionSuccess}
          open={showSubscriptionDialog}
          onOpenChange={setShowSubscriptionDialog}
        />
      )}
    </>
  );
};

export default UserCreateDialog;