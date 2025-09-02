import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionInfo {
  isActive: boolean;
  type: string | null;
  startDate: string | null;
  endDate: string | null;
  isExpired: boolean;
  daysRemaining: number | null;
}

export const useSubscription = () => {
  const { user, profile } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    isActive: false,
    type: null,
    startDate: null,
    endDate: null,
    isExpired: false,
    daysRemaining: null
  });
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    if (!user?.id) {
      setSubscription({
        isActive: false,
        type: null,
        startDate: null,
        endDate: null,
        isExpired: false,
        daysRemaining: null
      });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_type, subscription_start, subscription_end, subscription_active')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching subscription:', error);
        setLoading(false);
        return;
      }

      const now = new Date();
      const endDate = data.subscription_end ? new Date(data.subscription_end) : null;
      const isExpired = endDate ? now > endDate : false;
      const daysRemaining = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

      setSubscription({
        isActive: data.subscription_active && !isExpired,
        type: data.subscription_type,
        startDate: data.subscription_start,
        endDate: data.subscription_end,
        isExpired,
        daysRemaining: daysRemaining && daysRemaining > 0 ? daysRemaining : null
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [user?.id, profile]);

  return {
    subscription,
    loading,
    refetch: checkSubscription
  };
};