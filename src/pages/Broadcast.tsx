import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
} from "lucide-react";
import type { BroadcastJob, BroadcastStatus } from "@/types";

const Broadcast = () => {
  // Mock data
  const jobs: BroadcastJob[] = [
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

  const totalStats = jobs.reduce(
    (acc, job) => ({
      total: acc.total + job.stats.total,
      sent: acc.sent + job.stats.sent,
      failed: acc.failed + job.stats.failed,
      pending: acc.pending + job.stats.pending,
    }),
    { total: 0, sent: 0, failed: 0, pending: 0 }
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Broadcast</h1>
          <p className="text-muted-foreground">Manage your broadcast campaigns</p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
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
              {jobs.length} active campaigns
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
              {Math.round((totalStats.sent / totalStats.total) * 100)}% success rate
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
              In queue
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
              {Math.round((totalStats.failed / totalStats.total) * 100)}% failure rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign List */}
      <div className="space-y-4">
        {jobs.map((job) => (
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
                  {job.status === "running" && (
                    <Button size="sm" variant="outline">
                      <Pause className="h-3 w-3 mr-1" />
                      Pause
                    </Button>
                  )}
                  {job.status === "paused" && (
                    <Button size="sm" variant="outline">
                      <Play className="h-3 w-3 mr-1" />
                      Resume
                    </Button>
                  )}
                  {job.status === "failed" && (
                    <Button size="sm" variant="outline">
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
        ))}
      </div>
    </div>
  );
};

export default Broadcast;