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
} from "lucide-react";

const Dashboard = () => {
  const stats = {
    sessions: { total: 12, connected: 8, crm: 3, blaster: 4, warmup: 1 },
    messages: { today: 1247, thisWeek: 8932, thisMonth: 32145 },
    broadcasts: { active: 3, completed: 28, failed: 2 },
    contacts: { total: 15420, optedOut: 234 },
  };

  const quickActions = [
    { name: "Add Session", icon: Plus, color: "bg-gradient-primary", href: "/sessions" },
    { name: "New Broadcast", icon: Send, color: "bg-gradient-accent", href: "/broadcast" },
    { name: "Import Contacts", icon: Users2, color: "bg-gradient-hero", href: "/contacts" },
    { name: "Create Template", icon: MessageSquare, color: "bg-gradient-primary", href: "/templates" },
  ];

  const recentActivity = [
    { id: 1, type: "broadcast", message: "Broadcast 'Summer Sale' completed", time: "2 min ago", status: "success" },
    { id: 2, type: "session", message: "Session 'CRM-01' connected", time: "5 min ago", status: "success" },
    { id: 3, type: "message", message: "247 messages sent in last hour", time: "10 min ago", status: "info" },
    { id: 4, type: "error", message: "Session 'BLAST-03' disconnected", time: "15 min ago", status: "error" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your WhatsApp operations</p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90">
          <Activity className="h-4 w-4 mr-2" />
          Live View
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card">
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

        <Card className="shadow-card">
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

        <Card className="shadow-card">
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

        <Card className="shadow-card">
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
                onClick={() => window.location.href = action.href}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
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