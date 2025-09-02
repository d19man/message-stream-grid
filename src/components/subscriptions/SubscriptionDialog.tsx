import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: 'superadmin' | 'admin' | 'user';
  subscription_type: string | null;
  subscription_start: string | null;
  subscription_end: string | null;
  subscription_active: boolean;
}

interface SubscriptionDialogProps {
  user: User;
  trigger?: React.ReactNode;
  onSuccess: () => void;
}

type SubscriptionType = 'lifetime' | 'trial_1_day' | 'trial_3_days' | 'trial_5_days' | '1_month' | '2_months' | '3_months' | '6_months' | '1_year';

const subscriptionOptions = [
  { value: 'lifetime', label: 'Lifetime', duration: null },
  { value: 'trial_1_day', label: 'Trial 1 Day', duration: 1 },
  { value: 'trial_3_days', label: 'Trial 3 Days', duration: 3 },
  { value: 'trial_5_days', label: 'Trial 5 Days', duration: 5 },
  { value: '1_month', label: '1 Month', duration: 30 },
  { value: '2_months', label: '2 Months', duration: 60 },
  { value: '3_months', label: '3 Months', duration: 90 },
  { value: '6_months', label: '6 Months', duration: 180 },
  { value: '1_year', label: '1 Year', duration: 365 },
];

const SubscriptionDialog: React.FC<SubscriptionDialogProps> = ({ user, trigger, onSuccess }) => {
  const [subscriptionType, setSubscriptionType] = useState<SubscriptionType | ''>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const calculateEndDate = (type: SubscriptionType): Date | null => {
    if (type === 'lifetime') return null;
    
    const option = subscriptionOptions.find(opt => opt.value === type);
    if (!option?.duration) return null;
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + option.duration);
    return endDate;
  };

  const handleAssignSubscription = async () => {
    if (!subscriptionType) {
      setError('Please select a subscription type');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const now = new Date();
      const endDate = calculateEndDate(subscriptionType);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_type: subscriptionType,
          subscription_start: now.toISOString(),
          subscription_end: endDate?.toISOString() || null,
          subscription_active: true
        })
        .eq('id', user.id);

      if (updateError) {
        setError(`Error updating subscription: ${updateError.message}`);
        return;
      }

      setSuccess(`Subscription assigned successfully`);
      toast({
        title: "Subscription Updated",
        description: `${user.email} now has ${subscriptionOptions.find(opt => opt.value === subscriptionType)?.label} subscription`,
      });

      onSuccess();
      
      setTimeout(() => {
        setOpen(false);
        setSuccess('');
        setSubscriptionType('');
      }, 2000);

    } catch (err: any) {
      setError(`Unexpected error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSubscription = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_type: null,
          subscription_start: null,
          subscription_end: null,
          subscription_active: false
        })
        .eq('id', user.id);

      if (updateError) {
        setError(`Error removing subscription: ${updateError.message}`);
        return;
      }

      setSuccess('Subscription removed successfully');
      toast({
        title: "Subscription Removed",
        description: `${user.email} subscription has been removed`,
        variant: "destructive"
      });

      onSuccess();
      
      setTimeout(() => {
        setOpen(false);
        setSuccess('');
      }, 2000);

    } catch (err: any) {
      setError(`Unexpected error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Manage Subscription
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Manage Subscription</span>
          </DialogTitle>
          <DialogDescription>
            Assign or update subscription for {user.email}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current Subscription Status */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Current Status</h4>
            <div className="text-sm text-muted-foreground">
              {user.subscription_type ? (
                <>
                  <p><strong>Type:</strong> {subscriptionOptions.find(opt => opt.value === user.subscription_type)?.label}</p>
                  <p><strong>Active:</strong> {user.subscription_active ? '✅ Yes' : '❌ No'}</p>
                  {user.subscription_end && (
                    <p><strong>Expires:</strong> {new Date(user.subscription_end).toLocaleDateString()}</p>
                  )}
                </>
              ) : (
                <p>No active subscription</p>
              )}
            </div>
          </div>

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
            <Label htmlFor="subscriptionType">Subscription Type</Label>
            <Select value={subscriptionType} onValueChange={(value: SubscriptionType) => setSubscriptionType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select subscription type" />
              </SelectTrigger>
              <SelectContent>
                {subscriptionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-between space-x-2 pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={handleRemoveSubscription}
              disabled={loading || !user.subscription_type}
              size="sm"
            >
              {loading ? 'Processing...' : 'Remove'}
            </Button>
            
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAssignSubscription}
                disabled={loading || !subscriptionType}
              >
                {loading ? 'Assigning...' : 'Assign'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionDialog;