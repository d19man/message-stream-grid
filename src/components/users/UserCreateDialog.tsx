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
import SubscriptionDialog from '@/components/subscriptions/SubscriptionDialog';

interface UserCreateDialogProps {
  trigger?: React.ReactNode;
  onSuccess: () => void;
}

type UserRole = 'user' | 'admin' | 'superadmin';

const UserCreateDialog: React.FC<UserCreateDialogProps> = ({ trigger, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Create the user account using Supabase Admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          full_name: fullName
        },
        email_confirm: true
      });

      if (authError) {
        setError(`Error creating user: ${authError.message}`);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Failed to create user');
        setLoading(false);
        return;
      }

      // Update the profile with the selected role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          role: role,
          full_name: fullName 
        })
        .eq('id', authData.user.id);

      if (profileError) {
        setError(`Error setting user role: ${profileError.message}`);
        setLoading(false);
        return;
      }

      const userData = {
        id: authData.user.id,
        email: email,
        full_name: fullName,
        role: role,
        subscription_type: null,
        subscription_start: null,
        subscription_end: null,
        subscription_active: false,
        created_at: authData.user.created_at,
        updated_at: new Date().toISOString()
      };

      setCreatedUser(userData);
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
    setRole('user');
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
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
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
                <Button
                  type="button"
                  onClick={handleSetSubscription}
                  className="bg-gradient-primary"
                >
                  Set Subscription
                </Button>
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