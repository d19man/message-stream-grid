import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertTriangle, Crown, CheckCircle } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';

const SubscriptionStatus: React.FC = () => {
  const { subscription, loading } = useSubscription();
  const { profile } = useAuth();

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Subscription Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Superadmin has unlimited access
  if (profile?.role === 'superadmin') {
    return (
      <Card className="shadow-card border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-900/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Crown className="w-5 h-5 text-yellow-600" />
            <span>Super Admin Access</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Crown className="w-3 h-3 mr-1" />
            Unlimited Access
          </Badge>
          <p className="text-sm text-muted-foreground mt-2">
            You have full system access as a Super Administrator.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    if (subscription.isActive) return <CheckCircle className="w-5 h-5 text-success" />;
    return <AlertTriangle className="w-5 h-5 text-destructive" />;
  };

  const getStatusBadge = () => {
    if (!subscription.type) {
      return (
        <Badge variant="secondary">
          No Subscription
        </Badge>
      );
    }

    if (subscription.type === 'lifetime') {
      return (
        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Lifetime
        </Badge>
      );
    }

    if (subscription.isExpired) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      );
    }

    if (subscription.isActive) {
      return (
        <Badge className="bg-success text-success-foreground">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    }

    return (
      <Badge variant="secondary">
        Inactive
      </Badge>
    );
  };

  const getSubscriptionTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'trial_1_day': 'Trial 1 Day',
      'trial_3_days': 'Trial 3 Days',
      'trial_5_days': 'Trial 5 Days',
      '1_month': '1 Month',
      '2_months': '2 Months',
      '3_months': '3 Months',
      '6_months': '6 Months',
      '1_year': '1 Year',
      'lifetime': 'Lifetime'
    };
    return typeMap[type] || type;
  };

  const borderColor = subscription.isActive 
    ? 'border-success/20 bg-success/5' 
    : subscription.isExpired 
    ? 'border-destructive/20 bg-destructive/5'
    : 'border-muted';

  return (
    <Card className={`shadow-card ${borderColor}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {getStatusIcon()}
          <span>Subscription Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status:</span>
          {getStatusBadge()}
        </div>

        {subscription.type && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Plan:</span>
            <span className="font-medium">{getSubscriptionTypeLabel(subscription.type)}</span>
          </div>
        )}

        {subscription.endDate && subscription.type !== 'lifetime' && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {subscription.isExpired ? 'Expired:' : 'Expires:'}
            </span>
            <span className={`text-sm font-medium ${subscription.isExpired ? 'text-destructive' : 'text-foreground'}`}>
              {new Date(subscription.endDate).toLocaleDateString()}
            </span>
          </div>
        )}

        {subscription.daysRemaining && !subscription.isExpired && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Days remaining:</span>
            <span className={`font-bold ${
              subscription.daysRemaining <= 3 
                ? 'text-destructive' 
                : subscription.daysRemaining <= 7 
                ? 'text-orange-600' 
                : 'text-success'
            }`}>
              {subscription.daysRemaining} days
            </span>
          </div>
        )}

        {!subscription.isActive && !subscription.isExpired && !subscription.type && (
          <div className="text-sm text-muted-foreground">
            Contact your administrator to get a subscription.
          </div>
        )}

        {subscription.isExpired && (
          <div className="text-sm text-destructive">
            Your subscription has expired. Contact your administrator to renew.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatus;