import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Send,
  Plus,
  Play,
  Pause,
  Square,
  RotateCcw,
  TrendingUp,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  XCircle,
  Edit,
  Trash2,
} from "lucide-react";
import { CampaignDialog } from "@/components/broadcast/CampaignDialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { BroadcastJob, BroadcastStatus, PoolType } from "@/types";

const Broadcast = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  
  // Mock data - initialize first
  const initialJobs: BroadcastJob[] = [
    {
      id: "1",
      name: "Summer Sale Campaign",
      pool: "BLASTER",
      templateId: "template1",
      targetContacts: Array(1500).fill("").map((_, i) => `contact${i}`),
      status: "running",
      planJson: {
        delayMin: 30,
        delayMax: 120,
        sessions: ["session1", "session2", "session3"],
        schedule: {
          startAt: "2024-01-15T09:00:00Z",
          endAt: "2024-01-15T18:00:00Z",
          quietHours: [22, 23, 0, 1, 2, 3, 4, 5, 6, 7],
        },
      },
      stats: {
        total: 1500,
        sent: 847,
        failed: 23,
        pending: 630,
      },
      userId: "user1",
      createdAt: "2024-01-15T08:00:00Z",
      updatedAt: "2024-01-15T08:00:00Z",
      startedAt: "2024-01-15T09:00:00Z",
    },
    {
      id: "2",
      name: "Product Launch Notification",
      pool: "CRM",
      templateId: "template2",
      targetContacts: Array(250).fill("").map((_, i) => `contact${i + 1500}`),
      status: "completed",
      planJson: {
        delayMin: 60,
        delayMax: 300,
        sessions: ["session4"],
        schedule: {
          startAt: "2024-01-14T10:00:00Z",
          endAt: "2024-01-14T17:00:00Z",
        },
      },
      stats: {
        total: 250,
        sent: 248,
        failed: 2,
        pending: 0,
      },
      userId: "user1",
      createdAt: "2024-01-14T09:00:00Z",
      updatedAt: "2024-01-14T09:00:00Z",
      startedAt: "2024-01-14T10:00:00Z",
      completedAt: "2024-01-14T16:45:00Z",
    },
    {
      id: "3",
      name: "Weekly Newsletter",
      pool: "WARMUP",
      templateId: "template3",
      targetContacts: Array(50).fill("").map((_, i) => `contact${i + 1750}`),
      status: "paused",
      planJson: {
        delayMin: 300,
        delayMax: 600,
        sessions: ["session5"],
      },
      stats: {
        total: 50,
        sent: 12,
        failed: 1,
        pending: 37,
      },
      userId: "user1",
      createdAt: "2024-01-15T06:00:00Z",
      updatedAt: "2024-01-15T06:00:00Z",
      startedAt: "2024-01-15T07:00:00Z",
    },
  ];

  const [jobs, setJobs] = useState<BroadcastJob[]>(initialJobs);
  const [editingCampaign, setEditingCampaign] = useState<BroadcastJob | null>(null);
  const [deletingCampaignId, setDeletingCampaignId] = useState<string | null>(null);

  // Filter available pools based on user role
  const getAvailablePools = (): PoolType[] => {
    if (!profile?.role) return ["CRM"];
    
    switch (profile.role) {
      case 'crm':
        return ["CRM"];
      case 'blaster':
        return ["BLASTER"];
      case 'warmup':
        return ["WARMUP"];
      case 'admin':
      case 'superadmin':
        return ["CRM", "BLASTER", "WARMUP"];
      default:
        return ["CRM"];
    }
  };

  const availablePools = getAvailablePools();

  // Filter jobs based on user role
  const getFilteredJobs = () => {
    if (!profile?.role) return [];
    
    if (profile.role === 'superadmin' || profile.role === 'admin') {
      return jobs; // Admins see all campaigns
    }
    
    // Regular users only see campaigns from their pool
    return jobs.filter(job => availablePools.includes(job.pool));
  };

  const filteredJobs = getFilteredJobs();

  const handleSaveCampaign = (campaignData: Partial<BroadcastJob>) => {
    if (editingCampaign) {
      // Update existing campaign
      setJobs(prev => prev.map(job => 
        job.id === editingCampaign.id 
          ? { ...job, ...campaignData, updatedAt: new Date().toISOString() }
          : job
      ));
      setEditingCampaign(null);
      toast({
        title: "Success",
        description: "Campaign updated successfully!",
      });
    } else {
      // Create new campaign
      const newCampaign: BroadcastJob = {
        id: Date.now().toString(),
        name: campaignData.name!,
        pool: campaignData.pool!,
        templateId: campaignData.templateId!,
        targetContacts: campaignData.targetContacts!,
        status: campaignData.status!,
        planJson: campaignData.planJson!,
        stats: campaignData.stats!,
        userId: "user1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setJobs(prev => [...prev, newCampaign]);
      toast({
        title: "Success",
        description: "Campaign created successfully!",
      });
    }
  };

  const handleEditCampaign = (job: BroadcastJob) => {
    setEditingCampaign(job);
  };

  const handleDeleteCampaign = (jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId));
    setDeletingCampaignId(null);
    toast({
      title: "Success",
      description: "Campaign deleted successfully!",
    });
  };

  const handleCampaignAction = (jobId: string, action: string) => {
    setJobs(prev => prev.map(job => {
      if (job.id === jobId) {
        let newStatus = job.status;
        switch (action) {
          case "pause":
            newStatus = "paused";
            break;
          case "resume":
            newStatus = "running";
            break;
          case "retry":
            newStatus = "queued";
            break;
          case "start":
            newStatus = "running";
            break;
        }
        
        return {
          ...job,
          status: newStatus as BroadcastStatus,
          updatedAt: new Date().toISOString(),
          ...(action === "start" && { startedAt: new Date().toISOString() })
        };
      }
      return job;
    }));

    // Toast after state update
    toast({
      title: "Success",
      description: `Campaign ${action}ed successfully!`,
    });
  };

  const getStatusIcon = (status: BroadcastStatus) => {
    switch (status) {
      case "running":
        return <Play className="h-4 w-4 text-success" />;
      case "paused":
        return <Pause className="h-4 w-4 text-warning" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "queued":
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Square className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: BroadcastStatus) => {
    const statusConfig = {
      draft: { variant: "secondary" as const, className: "" },
      queued: { variant: "secondary" as const, className: "bg-muted text-muted-foreground" },
      running: { variant: "default" as const, className: "bg-success text-success-foreground" },
      paused: { variant: "secondary" as const, className: "bg-warning text-warning-foreground" },
      completed: { variant: "default" as const, className: "bg-success text-success-foreground" },
      failed: { variant: "destructive" as const, className: "" },
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getProgress = (job: BroadcastJob) => {
    return Math.round((job.stats.sent / job.stats.total) * 100);
  };

  // Calculate stats based on filtered jobs (role-based)
  const totalStats = filteredJobs.reduce(
    (acc, job) => ({
      total: acc.total + job.stats.total,
      sent: acc.sent + job.stats.sent,
      failed: acc.failed + job.stats.failed,
      pending: acc.pending + job.stats.pending,
    }),
    { total: 0, sent: 0, failed: 0, pending: 0 }
  );

  // Calculate success and failure rates safely
  const successRate = totalStats.total > 0 ? Math.round((totalStats.sent / totalStats.total) * 100) : 0;
  const failureRate = totalStats.total > 0 ? Math.round((totalStats.failed / totalStats.total) * 100) : 0;
  const completionRate = totalStats.total > 0 ? Math.round(((totalStats.sent + totalStats.failed) / totalStats.total) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Broadcast</h1>
          <p className="text-muted-foreground">
            {profile?.role === 'superadmin' 
              ? 'Manage all broadcast campaigns across pools'
              : profile?.role === 'admin'
              ? 'Manage broadcast campaigns for your teams'  
              : `Manage your ${availablePools.join(', ')} broadcast campaigns`
            }
          </p>
        </div>
        <CampaignDialog 
          onSave={handleSaveCampaign} 
          editingCampaign={editingCampaign}
          onEditCancel={() => setEditingCampaign(null)}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <Send className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {filteredJobs.length} campaign{filteredJobs.length !== 1 ? 's' : ''} • {availablePools.join(', ')} pool{availablePools.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{totalStats.sent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {successRate}% success rate • {completionRate}% completed
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{totalStats.pending.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totalStats.total > 0 ? Math.round((totalStats.pending / totalStats.total) * 100) : 0}% remaining
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalStats.failed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {failureRate}% failure rate • {totalStats.failed > 0 ? 'Needs attention' : 'All good'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign List */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Send className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Campaigns Yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first {availablePools.join(' or ')} campaign to start broadcasting
              </p>
              <CampaignDialog 
                onSave={handleSaveCampaign} 
                editingCampaign={editingCampaign}
                onEditCancel={() => setEditingCampaign(null)}
                trigger={
                  <Button className="bg-gradient-primary hover:opacity-90">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Campaign
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          filteredJobs.map((job) => (
            <Card key={job.id} className="shadow-card hover:shadow-elegant transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <CardTitle className="text-lg">{job.name}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        {getStatusBadge(job.status)}
                        <Badge variant="outline" className="text-xs">
                          {job.pool}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEditCampaign(job)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setDeletingCampaignId(job.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                    {job.status === "draft" && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCampaignAction(job.id, "start")}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Start
                      </Button>
                    )}
                    {job.status === "running" && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCampaignAction(job.id, "pause")}
                      >
                        <Pause className="h-3 w-3 mr-1" />
                        Pause
                      </Button>
                    )}
                    {job.status === "paused" && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCampaignAction(job.id, "resume")}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Resume
                      </Button>
                    )}
                    {job.status === "failed" && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCampaignAction(job.id, "retry")}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Retry
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Stats
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-muted-foreground">{getProgress(job)}%</span>
                    </div>
                    <Progress value={getProgress(job)} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{job.stats.sent} sent</span>
                      <span>{job.stats.total} total</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-success">{job.stats.sent}</div>
                      <div className="text-xs text-muted-foreground">Sent</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-warning">{job.stats.pending}</div>
                      <div className="text-xs text-muted-foreground">Pending</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-destructive">{job.stats.failed}</div>
                      <div className="text-xs text-muted-foreground">Failed</div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Sessions:</span>
                      <span>{job.planJson.sessions.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Delay:</span>
                      <span>{job.planJson.delayMin}-{job.planJson.delayMax}s</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Started:</span>
                      <span>{job.startedAt ? new Date(job.startedAt).toLocaleTimeString() : "Not started"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingCampaignId} onOpenChange={(open) => !open && setDeletingCampaignId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this campaign? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingCampaignId && handleDeleteCampaign(deletingCampaignId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Broadcast;