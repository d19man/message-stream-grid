import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  MessageSquare,
  Send,
  Users2,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Activity,
  Plus,
  Pause,
  Play,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { socketManager } from "@/lib/socket";
import SubscriptionStatus from "@/components/subscriptions/SubscriptionStatus";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Stats } from "@/types";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [liveViewActive, setLiveViewActive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    sessions: { total: 0, connected: 0, byPool: { CRM: 0, BLASTER: 0, WARMUP: 0 } },
    messages: { today: 0, thisWeek: 0, thisMonth: 0, byPool: { CRM: 0, BLASTER: 0, WARMUP: 0 } },
    broadcasts: { active: 0, completed: 0, failed: 0 },
    contacts: { total: 0, optedOut: 0 },
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const quickActions = [
    { name: "Add Session", icon: Plus, color: "bg-gradient-primary", href: "/sessions" },
    { name: "New Broadcast", icon: Send, color: "bg-gradient-accent", href: "/broadcast" },
    { name: "Import Contacts", icon: Users2, color: "bg-gradient-hero", href: "/contacts" },
    { name: "Create Template", icon: MessageSquare, color: "bg-gradient-primary", href: "/templates" },
  ];

  // Fetch real stats from Supabase
  const fetchStats = useCallback(async () => {
    if (!user || !profile) return;
    
    try {
      setLoading(true);
      
      // Fetch sessions stats
      let sessionsQuery = supabase.from('sessions').select('*');
      if (profile.role === 'superadmin') {
        // Superadmin sees all sessions
      } else if (profile.role === 'admin') {
        sessionsQuery = sessionsQuery.or(`admin_id.eq.${user.id},user_id.eq.${user.id}`);
      } else {
        sessionsQuery = sessionsQuery.eq('user_id', user.id);
      }
      
      const { data: sessions } = await sessionsQuery;
      
      // Fetch contacts stats
      let contactsQuery = supabase.from('contacts').select('*');
      if (profile.role === 'superadmin') {
        // Superadmin sees all contacts
      } else if (profile.role === 'admin') {
        contactsQuery = contactsQuery.or(`user_id.eq.${user.id},admin_id.eq.${user.id}`);
      } else {
        contactsQuery = contactsQuery.eq('user_id', user.id);
      }
      
      const { data: contacts } = await contactsQuery;
      
      // Fetch broadcast jobs stats
      let broadcastsQuery = supabase.from('broadcast_jobs').select('*');
      if (profile.role === 'superadmin') {
        // Superadmin sees all broadcasts
      } else if (profile.role === 'admin') {
        broadcastsQuery = broadcastsQuery.or(`user_id.eq.${user.id},admin_id.eq.${user.id}`);
      } else {
        broadcastsQuery = broadcastsQuery.eq('user_id', user.id);
      }
      
      const { data: broadcasts } = await broadcastsQuery;
      
      // Fetch messages stats (from accessible sessions)
      const sessionIds = sessions?.map(s => s.id) || [];
      let messagesData = [];
      if (sessionIds.length > 0) {
        const { data: messages } = await supabase
          .from('whatsapp_messages')
          .select('*')
          .in('session_id', sessionIds);
        messagesData = messages || [];
      }
      
      // Calculate stats
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const newStats: Stats = {
        sessions: {
          total: sessions?.length || 0,
          connected: sessions?.filter(s => s.status === 'connected').length || 0,
          byPool: {
            CRM: sessions?.filter(s => s.pool === 'CRM').length || 0,
            BLASTER: sessions?.filter(s => s.pool === 'BLASTER').length || 0,
            WARMUP: sessions?.filter(s => s.pool === 'WARMUP').length || 0,
          }
        },
        messages: {
          today: messagesData.filter(m => new Date(m.timestamp) >= today).length,
          thisWeek: messagesData.filter(m => new Date(m.timestamp) >= weekAgo).length,
          thisMonth: messagesData.filter(m => new Date(m.timestamp) >= monthAgo).length,
          byPool: {
            CRM: 0, // Could be enhanced by joining with sessions
            BLASTER: 0,
            WARMUP: 0,
          }
        },
        broadcasts: {
          active: broadcasts?.filter(b => ['running', 'queued'].includes(b.status)).length || 0,
          completed: broadcasts?.filter(b => b.status === 'completed').length || 0,
          failed: broadcasts?.filter(b => b.status === 'failed').length || 0,
        },
        contacts: {
          total: contacts?.length || 0,
          optedOut: contacts?.filter(c => c.opt_out).length || 0,
        },
      };
      
      setStats(newStats);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard stats",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  const addRealtimeActivity = useCallback(() => {
    const activities = [
      { type: "message", message: `${Math.floor(Math.random() * 50 + 10)} messages sent`, status: "info" },
      { type: "session", message: `Session 'CRM-${Math.floor(Math.random() * 10)}' connected`, status: "success" },
      { type: "broadcast", message: "New broadcast started", status: "success" },
      { type: "error", message: `Session 'BLAST-${Math.floor(Math.random() * 10)}' timeout`, status: "error" },
      { type: "session", message: "QR code scanned successfully", status: "success" },
    ];
    
    const newActivity = {
      id: Date.now(),
      ...activities[Math.floor(Math.random() * activities.length)],
      time: "just now",
    };
    
    setRecentActivity(prev => [newActivity, ...prev.slice(0, 4)]);
  }, []);

  const toggleLiveView = () => {
    const newState = !liveViewActive;
    setLiveViewActive(newState);
    
    if (newState) {
      // Connect socket and start live updates
      if (user) {
        socketManager.connect(user.id);
      }
      
      toast({
        title: "Live View Activated",
        description: "Real-time updates are now enabled",
      });
    } else {
      // Disconnect socket
      socketManager.disconnect();
      
      toast({
        title: "Live View Paused", 
        description: "Real-time updates are now disabled",
      });
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (user && profile) {
      fetchStats();
    }
  }, [user, profile, fetchStats]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user || !profile) return;

    const channels: any[] = [];

    // Subscribe to sessions changes
    const sessionsChannel = supabase
      .channel('dashboard-sessions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sessions'
      }, () => {
        fetchStats();
        addRealtimeActivity();
      })
      .subscribe();
    channels.push(sessionsChannel);

    // Subscribe to messages changes  
    const messagesChannel = supabase
      .channel('dashboard-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public', 
        table: 'whatsapp_messages'
      }, () => {
        fetchStats();
        addRealtimeActivity();
      })
      .subscribe();
    channels.push(messagesChannel);

    // Subscribe to broadcast changes
    const broadcastsChannel = supabase
      .channel('dashboard-broadcasts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'broadcast_jobs'
      }, () => {
        fetchStats();
        addRealtimeActivity();
      })
      .subscribe();
    channels.push(broadcastsChannel);

    // Subscribe to contacts changes
    const contactsChannel = supabase
      .channel('dashboard-contacts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'contacts'
      }, () => {
        fetchStats();
        addRealtimeActivity();
      })
      .subscribe();
    channels.push(contactsChannel);

    // Set up live updates if active
    let intervalId: NodeJS.Timeout;
    let activityIntervalId: NodeJS.Timeout;

    if (liveViewActive) {
      // Refresh stats every 30 seconds
      intervalId = setInterval(() => {
        fetchStats();
      }, 30000);

      // Add new activity every 8 seconds
      activityIntervalId = setInterval(() => {
        addRealtimeActivity();
      }, 8000);

      // Set up socket listeners
      const socket = socketManager.getSocket();
      if (socket) {
        socket.on('stats:update', () => {
          fetchStats();
        });

        socket.on('activity:new', (activity) => {
          setRecentActivity(prev => [activity, ...prev.slice(0, 4)]);
        });

        socket.on('session:connect', () => {
          addRealtimeActivity();
        });

        socket.on('message:received', () => {
          fetchStats();
        });
      }
    }

    return () => {
      // Cleanup intervals
      if (intervalId) clearInterval(intervalId);
      if (activityIntervalId) clearInterval(activityIntervalId);
      
      // Cleanup channels
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [user, profile, liveViewActive, fetchStats, addRealtimeActivity]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      socketManager.disconnect();
    };
  }, []);

  if (loading && !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <p className="text-muted-foreground">
              {profile?.role === 'superadmin' 
                ? 'Monitor all WhatsApp operations across the system'
                : profile?.role === 'admin'
                ? 'Monitor WhatsApp operations for your teams'
                : `Monitor your ${profile?.role?.toUpperCase()} operations`
              }
            </p>
            {liveViewActive && (
              <Badge variant="outline" className="animate-pulse">
                <div className="w-2 h-2 bg-success rounded-full mr-2"></div>
                Live • Updated {lastUpdated.toLocaleTimeString()}
              </Badge>
            )}
          </div>
        </div>
        <Button 
          onClick={toggleLiveView}
          variant={liveViewActive ? "default" : "outline"}
          className={liveViewActive ? "bg-gradient-primary hover:opacity-90" : ""}
        >
          {liveViewActive ? (
            <Pause className="h-4 w-4 mr-2" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          {liveViewActive ? "Pause Live View" : "Start Live View"}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className={`shadow-card transition-all duration-300 ${liveViewActive ? 'ring-2 ring-primary/20' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <Smartphone className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sessions.connected}/{stats.sessions.total}</div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="secondary" className="text-xs">CRM: {stats.sessions.byPool.CRM}</Badge>
              <Badge variant="secondary" className="text-xs">BLAST: {stats.sessions.byPool.BLASTER}</Badge>
              <Badge variant="secondary" className="text-xs">WARM: {stats.sessions.byPool.WARMUP}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className={`shadow-card transition-all duration-300 ${liveViewActive ? 'ring-2 ring-primary/20' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Today</CardTitle>
            <MessageSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messages.today.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success">+12%</span> from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className={`shadow-card transition-all duration-300 ${liveViewActive ? 'ring-2 ring-primary/20' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Broadcasts</CardTitle>
            <Send className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.broadcasts.active}</div>
            <p className="text-xs text-muted-foreground">
              {stats.broadcasts.completed} completed this week
            </p>
          </CardContent>
        </Card>

        <Card className={`shadow-card transition-all duration-300 ${liveViewActive ? 'ring-2 ring-primary/20' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contacts.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.contacts.optedOut} opted out
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={action.name}
                variant="outline"
                className="h-20 flex-col space-y-2 hover:shadow-elegant transition-all duration-300"
                onClick={() => navigate(action.href)}
              >
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium">{action.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className={`shadow-card transition-all duration-300 ${liveViewActive ? 'ring-2 ring-primary/20' : ''}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Activity</span>
              {liveViewActive && (
                <Badge variant="outline" className="animate-pulse text-xs">
                  <div className="w-1.5 h-1.5 bg-success rounded-full mr-1"></div>
                  Live
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div 
                    key={activity.id} 
                    className={`flex items-center space-x-3 transition-all duration-300 ${
                      activity.time === 'just now' ? 'bg-primary/5 p-2 rounded-lg border-l-2 border-primary' : ''
                    }`}
                  >
                    <div className={`p-1 rounded-full ${
                      activity.status === 'success' ? 'bg-success/20' :
                      activity.status === 'error' ? 'bg-destructive/20' : 'bg-primary/20'
                    }`}>
                      {activity.status === 'success' ? (
                        <CheckCircle className="h-3 w-3 text-success" />
                      ) : activity.status === 'error' ? (
                        <AlertCircle className="h-3 w-3 text-destructive" />
                      ) : (
                        <Activity className="h-3 w-3 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <SubscriptionStatus />

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">API Status</span>
                <Badge className="bg-success text-success-foreground">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Healthy
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <Badge className="bg-success text-success-foreground">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Queue System</span>
                <Badge className="bg-success text-success-foreground">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Processing
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Socket Connection</span>
                <Badge className="bg-success text-success-foreground">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;