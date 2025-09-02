import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'superadmin' | 'admin' | 'user' | 'crm' | 'blaster' | 'warmup';
  admin_id: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  changePassword: (newPassword: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasRole: (role: string) => boolean;
  canManageUsers: () => boolean;
  canManageSubscriptions: () => boolean;
  canAccessDashboard: () => boolean;
  canManageSessions: () => boolean;
  canManageBroadcast: () => boolean;
  canManageTemplates: () => boolean;
  canManageContacts: () => boolean;
  canViewInbox: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  useEffect(() => {
    console.log('AuthContext: Setting up auth listener');
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('AuthContext: Auth state changed', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('AuthContext: User logged in, fetching profile...');
          // Fetch profile data when user logs in - use setTimeout to prevent deadlock
          setTimeout(async () => {
            try {
              const profileData = await fetchProfile(session.user.id);
              console.log('AuthContext: Profile fetched', profileData);
              setProfile(profileData);
            } catch (error) {
              console.error('AuthContext: Profile fetch error', error);
              setProfile(null);
            }
          }, 0);
        } else {
          console.log('AuthContext: User logged out');
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('AuthContext: Initial session check', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          const profileData = await fetchProfile(session.user.id);
          console.log('AuthContext: Initial profile fetched', profileData);
          setProfile(profileData);
        } catch (error) {
          console.error('AuthContext: Initial profile fetch error', error);
          setProfile(null);
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    // First, attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { error };
    }

    // Check subscription status after successful login
    if (data.user) {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('subscription_type, subscription_end, subscription_active, role, admin_id, email')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          return { error: profileError };
        }

        // Check if user has superadmin role (only superadmin bypasses subscription check)
        if (profileData.role === 'superadmin') {
          return { error: null };
        }

        // For admin role, check their own subscription
        // For CRM/Blaster/Warmup roles, check their admin's subscription
        let subscriptionData = {
          subscription_type: profileData.subscription_type,
          subscription_end: profileData.subscription_end,
          subscription_active: profileData.subscription_active
        };
        
        if (['crm', 'blaster', 'warmup'].includes(profileData.role) && profileData.admin_id) {
          // Get admin's subscription info using service role to bypass RLS
          console.log('Checking admin subscription for user:', {
            userEmail: profileData.email,
            userRole: profileData.role,
            adminId: profileData.admin_id
          });
          
          // Use service role client to bypass RLS restrictions
          const serviceRoleClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );
          
          const { data: adminProfile, error: adminError } = await serviceRoleClient
            .from('profiles')
            .select('subscription_type, subscription_end, subscription_active, email, full_name')
            .eq('id', profileData.admin_id)
            .single();
          
          if (adminError) {
            console.error('Error fetching admin profile:', adminError);
            console.log('Admin ID being searched:', profileData.admin_id);
            await supabase.auth.signOut();
            return { 
              error: { 
                message: 'Unable to verify admin subscription status. Please contact your administrator.' 
              } 
            };
          }
          
          console.log('Admin subscription data:', adminProfile);
          subscriptionData = {
            subscription_type: adminProfile.subscription_type,
            subscription_end: adminProfile.subscription_end,
            subscription_active: adminProfile.subscription_active
          };
        }

        // Check subscription status
        const now = new Date();
        const isLifetime = subscriptionData.subscription_type === 'lifetime';
        const isExpired = subscriptionData.subscription_end ? now > new Date(subscriptionData.subscription_end) : true;
        const hasActiveSubscription = subscriptionData.subscription_active && (isLifetime || !isExpired);

        if (!hasActiveSubscription) {
          // Sign out the user immediately
          await supabase.auth.signOut();
          const roleMessage = ['crm', 'blaster', 'warmup'].includes(profileData.role) 
            ? 'Your admin\'s subscription has expired. Please contact your administrator.' 
            : 'Your subscription has expired. Please contact your administrator to renew your subscription.';
          return { 
            error: { 
              message: roleMessage
            } 
          };
        }
      } catch (err) {
        console.error('Error checking subscription:', err);
        await supabase.auth.signOut();
        return { 
          error: { 
            message: 'Unable to verify subscription status. Please try again.' 
          } 
        };
      }
    }

    return { error: null };
  };

  const changePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const hasRole = (role: string) => {
    if (!profile) return false;
    
    // Exact role match
    if (profile.role === role) return true;
    
    // Hierarchy-based permissions
    if (profile.role === 'superadmin') {
      // Superadmin has all permissions
      return ['admin', 'user', 'crm', 'blaster', 'warmup'].includes(role);
    }
    
    if (profile.role === 'admin') {
      // Admin can manage their sub-users
      return ['crm', 'blaster', 'warmup'].includes(role);
    }
    
    return false;
  };

  const canManageUsers = () => {
    return profile?.role === 'superadmin' || profile?.role === 'admin';
  };

  const canManageSubscriptions = () => {
    return profile?.role === 'superadmin';
  };

  const canAccessDashboard = () => {
    return profile?.role === 'superadmin' || profile?.role === 'admin';
  };

  const canManageSessions = () => {
    return ['superadmin', 'admin', 'crm', 'blaster', 'warmup'].includes(profile?.role || '');
  };

  const canManageBroadcast = () => {
    return ['superadmin', 'admin', 'blaster'].includes(profile?.role || '');
  };

  const canManageTemplates = () => {
    return ['superadmin', 'admin', 'crm', 'blaster'].includes(profile?.role || '');
  };

  const canManageContacts = () => {
    return ['superadmin', 'admin', 'crm'].includes(profile?.role || '');
  };

  const canViewInbox = () => {
    return ['superadmin', 'admin', 'crm'].includes(profile?.role || '');
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    changePassword,
    signOut,
    hasRole,
    canManageUsers,
    canManageSubscriptions,
    canAccessDashboard,
    canManageSessions,
    canManageBroadcast,
    canManageTemplates,
    canManageContacts,
    canViewInbox
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};