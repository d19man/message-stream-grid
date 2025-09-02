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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { socketManager } from "@/lib/socket";
import SubscriptionStatus from "@/components/subscriptions/SubscriptionStatus";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [liveViewActive, setLiveViewActive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [stats, setStats] = useState({
    sessions: { total: 12, connected: 8, crm: 3, blaster: 4, warmup: 1 },
    messages: { today: 1247, thisWeek: 8932, thisMonth: 32145 },
    broadcasts: { active: 3, completed: 28, failed: 2 },
    contacts: { total: 15420, optedOut: 234 },
  });
  const [recentActivity, setRecentActivity] = useState([
    { id: 1, type: "broadcast", message: "Broadcast 'Summer Sale' completed", time: "2 min ago", status: "success" },
    { id: 2, type: "session", message: "Session 'CRM-01' connected", time: "5 min ago", status: "success" },
    { id: 3, type: "message", message: "247 messages sent in last hour", time: "10 min ago", status: "info" },
    { id: 4, type: "error", message: "Session 'BLAST-03' disconnected", time: "15 min ago", status: "error" },
  ]);

  const quickActions = [
    { name: "Add Session", icon: Plus, color: "bg-gradient-primary", href: "/sessions" },
    { name: "New Broadcast", icon: Send, color: "bg-gradient-accent", href: "/broadcast" },
    { name: "Import Contacts", icon: Users2, color: "bg-gradient-hero", href: "/contacts" },
    { name: "Create Template", icon: MessageSquare, color: "bg-gradient-primary", href: "/templates" },
  ];

  // Simulate real-time data updates
  const generateRandomStats = useCallback(() => {
    const sessionVariation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
    const messageVariation = Math.floor(Math.random() * 100) - 50; // -50 to 49
    const broadcastVariation = Math.floor(Math.random() * 2); // 0 or 1
    
    setStats(prev => ({
      sessions: {
        ...prev.sessions,
        connected: Math.max(0, Math.min(prev.sessions.total, prev.sessions.connected + sessionVariation)),
      },
      messages: {
        ...prev.messages,
        today: Math.max(0, prev.messages.today + messageVariation),
      },
      broadcasts: {
        ...prev.broadcasts,
        active: Math.max(0, prev.broadcasts.active + (Math.random() > 0.7 ? broadcastVariation : 0)),
      },
      contacts: {
        ...prev.contacts,
        total: prev.contacts.total + Math.floor(Math.random() * 5), // Slight increase
      },
    }));
  }, []);

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
      // Connect socket
      const userId = "current-user-id"; // This should come from auth context
      socketManager.connect(userId);
      
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

  // Set up live updates
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let activityIntervalId: NodeJS.Timeout;

    if (liveViewActive) {
      // Update stats every 3 seconds
      intervalId = setInterval(() => {
        generateRandomStats();
        setLastUpdated(new Date());
      }, 3000);

      // Add new activity every 8 seconds
      activityIntervalId = setInterval(() => {
        addRealtimeActivity();
      }, 8000);

      // Set up socket listeners
      const socket = socketManager.getSocket();
      if (socket) {
        socket.on('stats:update', (newStats) => {
          setStats(newStats);
          setLastUpdated(new Date());
        });

        socket.on('activity:new', (activity) => {
          setRecentActivity(prev => [activity, ...prev.slice(0, 4)]);
        });

        socket.on('session:connect', () => {
          addRealtimeActivity();
        });

        socket.on('message:received', () => {
          generateRandomStats();
        });
      }
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (activityIntervalId) clearInterval(activityIntervalId);
    };
  }, [liveViewActive, generateRandomStats, addRealtimeActivity]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      socketManager.disconnect();
    };
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <p className="text-muted-foreground">Monitor your WhatsApp operations</p>
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
              <Badge variant="secondary" className="text-xs">CRM: {stats.sessions.crm}</Badge>
              <Badge variant="secondary" className="text-xs">BLAST: {stats.sessions.blaster}</Badge>
              <Badge variant="secondary" className="text-xs">WARM: {stats.sessions.warmup}</Badge>
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
              {recentActivity.map((activity) => (
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
              ))}
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