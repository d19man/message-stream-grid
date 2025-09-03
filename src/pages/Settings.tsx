import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Bot,
  Clock,
  Database,
  Zap,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Settings as SettingsIcon,
  Key,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import type { PoolType, AIAgentSetting, WarmingPolicy } from "@/types";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("ai");
  const { settings: notificationSettings, updateSettings: updateNotificationSettings, testNotification } = useNotifications();

  // API Keys state
  const [apiKeys, setApiKeys] = useState({
    openai: "",
  });

  const [apiKeySaved, setApiKeySaved] = useState({
    openai: false,
  });

  // Real AI Agent Settings will come from backend
  const [aiSettings, setAiSettings] = useState<Record<PoolType, AIAgentSetting>>({
    CRM: {
      id: "ai-crm",
      pool: "CRM",
      isEnabled: true,
      schedule: {
        activeHours: [9, 10, 11, 12, 13, 14, 15, 16, 17],
        quietHours: [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7, 8],
        timezone: "America/New_York",
      },
      knowledgeBase: `Welcome to our customer support! I can help you with:

1. Order tracking and status
2. Product information and specifications  
3. Billing and payment questions
4. Account management
5. Technical support

Please describe your issue and I'll assist you right away.`,
      rateLimit: {
        maxRepliesPerContact: 5,
        timeWindowHours: 24,
      },
      userId: "user1",
      updatedAt: "2024-01-15T10:00:00Z",
    },
    BLASTER: {
      id: "ai-blaster",
      pool: "BLASTER",
      isEnabled: false,
      schedule: {
        activeHours: [],
        quietHours: Array.from({ length: 24 }, (_, i) => i),
        timezone: "America/New_York",
      },
      knowledgeBase: "",
      rateLimit: {
        maxRepliesPerContact: 0,
        timeWindowHours: 24,
      },
      userId: "user1",
      updatedAt: "2024-01-15T10:00:00Z",
    },
    WARMUP: {
      id: "ai-warmup",
      pool: "WARMUP",
      isEnabled: true,
      schedule: {
        activeHours: [10, 11, 12, 13, 14, 15, 16],
        quietHours: [17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        timezone: "America/New_York",
      },
      knowledgeBase: `Natural conversation starters and responses for warming up accounts:

- Friendly greetings and small talk
- Weather comments and local events  
- Light business updates and news
- Casual check-ins with contacts
- Simple questions about their day

Keep responses natural, brief, and engaging.`,
      rateLimit: {
        maxRepliesPerContact: 2,
        timeWindowHours: 24,
      },
      userId: "user1",
      updatedAt: "2024-01-15T10:00:00Z",
    },
  });

  // Real Warming Policy will come from backend  
  const [warmingPolicy, setWarmingPolicy] = useState<WarmingPolicy>({
    id: "warming-policy",
    curve: [
      { hour: 9, maxMessages: 5 },
      { hour: 10, maxMessages: 8 },
      { hour: 11, maxMessages: 12 },
      { hour: 12, maxMessages: 15 },
      { hour: 13, maxMessages: 12 },
      { hour: 14, maxMessages: 10 },
      { hour: 15, maxMessages: 8 },
      { hour: 16, maxMessages: 5 },
    ],
    quietHours: [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7, 8],
    mediaRatio: {
      text: 70,
      emoji: 20,
      image: 10,
    },
    maxPerHour: 15,
    updatedAt: new Date().toISOString(),
  });

  const handleAISettingChange = (pool: PoolType, field: string, value: any) => {
    setAiSettings(prev => ({
      ...prev,
      [pool]: {
        ...prev[pool],
        [field]: value,
      },
    }));
  };

  const handleSaveApiKey = async (provider: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('save-api-key', {
        body: {
          provider,
          apiKey: apiKeys[provider as keyof typeof apiKeys],
        },
      });

      if (error) {
        throw error;
      }

      setApiKeySaved(prev => ({ ...prev, [provider]: true }));
      setTimeout(() => {
        setApiKeySaved(prev => ({ ...prev, [provider]: false }));
      }, 3000);
    } catch (error) {
      console.error("Failed to save API key:", error);
    }
  };

  const formatHour = (hour: number) => {
    return new Date(2024, 0, 1, hour).toLocaleTimeString([], { 
      hour: 'numeric', 
      hour12: true 
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Configure AI agents and system policies</p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90">
          <Save className="h-4 w-4 mr-2" />
          Save All Changes
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ai" className="flex items-center space-x-2">
            <Bot className="h-4 w-4" />
            <span>AI Agents</span>
          </TabsTrigger>
          <TabsTrigger value="warming" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Warming Policy</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="flex items-center space-x-2">
            <Key className="h-4 w-4" />
            <span>API Keys</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center space-x-2">
            <SettingsIcon className="h-4 w-4" />
            <span>System</span>
          </TabsTrigger>
        </TabsList>

        {/* AI Agents Tab */}
        <TabsContent value="ai" className="space-y-6">
          {(["CRM", "BLASTER", "WARMUP"] as PoolType[]).map((pool) => (
            <Card key={pool} className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <span>{pool} AI Agent</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={aiSettings[pool].isEnabled}
                      onCheckedChange={(checked) => 
                        handleAISettingChange(pool, "isEnabled", checked)
                      }
                    />
                    <Label className="text-sm">
                      {aiSettings[pool].isEnabled ? "Enabled" : "Disabled"}
                    </Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {aiSettings[pool].isEnabled && (
                  <>
                    {/* Active Hours */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Active Hours</Label>
                      <div className="grid grid-cols-6 gap-2">
                        {Array.from({ length: 24 }, (_, hour) => (
                          <Button
                            key={hour}
                            variant={
                              aiSettings[pool].schedule.activeHours.includes(hour)
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            className={`text-xs ${
                              aiSettings[pool].schedule.activeHours.includes(hour)
                                ? "bg-success text-success-foreground"
                                : ""
                            }`}
                            onClick={() => {
                              const activeHours = aiSettings[pool].schedule.activeHours;
                              const newActiveHours = activeHours.includes(hour)
                                ? activeHours.filter(h => h !== hour)
                                : [...activeHours, hour].sort((a, b) => a - b);
                              
                              handleAISettingChange(pool, "schedule", {
                                ...aiSettings[pool].schedule,
                                activeHours: newActiveHours,
                              });
                            }}
                          >
                            {formatHour(hour)}
                          </Button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        AI will only respond during these hours
                      </p>
                    </div>

                    {/* Rate Limits */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`max-replies-${pool}`} className="text-sm font-medium">
                          Max Replies per Contact
                        </Label>
                        <Input
                          id={`max-replies-${pool}`}
                          type="number"
                          min="0"
                          max="10"
                          value={aiSettings[pool].rateLimit.maxRepliesPerContact}
                          onChange={(e) =>
                            handleAISettingChange(pool, "rateLimit", {
                              ...aiSettings[pool].rateLimit,
                              maxRepliesPerContact: parseInt(e.target.value) || 0,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`time-window-${pool}`} className="text-sm font-medium">
                          Time Window (hours)
                        </Label>
                        <Input
                          id={`time-window-${pool}`}
                          type="number"
                          min="1"
                          max="168"
                          value={aiSettings[pool].rateLimit.timeWindowHours}
                          onChange={(e) =>
                            handleAISettingChange(pool, "rateLimit", {
                              ...aiSettings[pool].rateLimit,
                              timeWindowHours: parseInt(e.target.value) || 24,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Knowledge Base */}
                    <div>
                      <Label htmlFor={`kb-${pool}`} className="text-sm font-medium">
                        Knowledge Base
                      </Label>
                      <Textarea
                        id={`kb-${pool}`}
                        placeholder="Enter the knowledge base content for this AI agent..."
                        value={aiSettings[pool].knowledgeBase}
                        onChange={(e) =>
                          handleAISettingChange(pool, "knowledgeBase", e.target.value)
                        }
                        className="mt-1 min-h-[200px]"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        This content will guide the AI's responses
                      </p>
                    </div>

                    {/* Test Button */}
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Test AI Response
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Warming Policy Tab */}
        <TabsContent value="warming" className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-primary" />
                <span>Daily Message Curve</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  {warmingPolicy.curve.map((point, index) => (
                    <div key={point.hour} className="space-y-2">
                      <Label className="text-xs">{formatHour(point.hour)}</Label>
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        value={point.maxMessages}
                        onChange={(e) => {
                          const newCurve = [...warmingPolicy.curve];
                          newCurve[index] = {
                            ...point,
                            maxMessages: parseInt(e.target.value) || 0,
                          };
                          setWarmingPolicy(prev => ({ ...prev, curve: newCurve }));
                        }}
                        className="text-xs"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Maximum messages to send per hour during warming
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>Media Ratio & Limits</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Content Distribution</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <Label className="text-sm">Text Messages</Label>
                        <span className="text-sm">{warmingPolicy.mediaRatio.text}%</span>
                      </div>
                      <Input
                        type="range"
                        min="0"
                        max="100"
                        value={warmingPolicy.mediaRatio.text}
                        onChange={(e) =>
                          setWarmingPolicy(prev => ({
                            ...prev,
                            mediaRatio: {
                              ...prev.mediaRatio,
                              text: parseInt(e.target.value),
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <Label className="text-sm">Emoji/Reactions</Label>
                        <span className="text-sm">{warmingPolicy.mediaRatio.emoji}%</span>
                      </div>
                      <Input
                        type="range"
                        min="0"
                        max="100"
                        value={warmingPolicy.mediaRatio.emoji}
                        onChange={(e) =>
                          setWarmingPolicy(prev => ({
                            ...prev,
                            mediaRatio: {
                              ...prev.mediaRatio,
                              emoji: parseInt(e.target.value),
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <Label className="text-sm">Images/Media</Label>
                        <span className="text-sm">{warmingPolicy.mediaRatio.image}%</span>
                      </div>
                      <Input
                        type="range"
                        min="0"
                        max="100"
                        value={warmingPolicy.mediaRatio.image}
                        onChange={(e) =>
                          setWarmingPolicy(prev => ({
                            ...prev,
                            mediaRatio: {
                              ...prev.mediaRatio,
                              image: parseInt(e.target.value),
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Rate Limits</h4>
                  <div>
                    <Label htmlFor="max-per-hour" className="text-sm">
                      Maximum Messages Per Hour
                    </Label>
                    <Input
                      id="max-per-hour"
                      type="number"
                      min="1"
                      max="100"
                      value={warmingPolicy.maxPerHour}
                      onChange={(e) =>
                        setWarmingPolicy(prev => ({
                          ...prev,
                          maxPerHour: parseInt(e.target.value) || 15,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5 text-primary" />
                <span>API Integrations</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* OpenAI API Key */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">OpenAI API Key</Label>
                    <p className="text-xs text-muted-foreground">Required for ChatGPT integration and AI responses</p>
                  </div>
                  {apiKeySaved.openai && (
                    <div className="flex items-center space-x-2 text-success">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Saved</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <Input
                    type="password"
                    placeholder="sk-..."
                    value={apiKeys.openai}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, openai: e.target.value }))}
                    className="font-mono text-sm"
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      Get your API key from{" "}
                      <a 
                        href="https://platform.openai.com/api-keys" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        OpenAI Platform
                      </a>
                    </p>
                    <Button 
                      size="sm" 
                      onClick={() => handleSaveApiKey("openai")}
                      disabled={!apiKeys.openai.trim()}
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Save Key
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Security Notice</h4>
                      <p className="text-xs text-muted-foreground">
                        API keys are encrypted and stored securely. They are only used for AI integrations and are never shared or logged.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          {(["CRM", "BLASTER", "WARMUP"] as PoolType[]).map((pool) => (
            <Card key={pool} className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <span>{pool} Notifications</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Enable Notifications</Label>
                    <p className="text-xs text-muted-foreground">Show notifications for new {pool} messages</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Notification Sound</Label>
                    <Select defaultValue={`${pool.toLowerCase()}-notification.mp3`}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={`${pool.toLowerCase()}-notification.mp3`}>Default {pool} Sound</SelectItem>
                        <SelectItem value="notification-1.mp3">Notification Bell</SelectItem>
                        <SelectItem value="notification-2.mp3">Message Ping</SelectItem>
                        <SelectItem value="notification-3.mp3">Soft Chime</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label className="text-sm font-medium">Volume</Label>
                      <span className="text-sm text-muted-foreground">70%</span>
                    </div>
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      defaultValue="70"
                      className="w-full"
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => testNotification(pool)}>
                      <Bell className="h-3 w-3 mr-1" />
                      Test Notification
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-primary" />
                <span>System Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database Connection</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm text-success">Connected</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Redis Cache</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm text-success">Online</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Queue System</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm text-success">Processing</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Socket.IO Server</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm text-success">Active</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">File Storage</span>
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <span className="text-sm text-warning">85% Full</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Rate Limit</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm text-success">Normal</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Maintenance Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear Cache
                </Button>
                <Button variant="outline">
                  <Database className="h-4 w-4 mr-2" />
                  Backup Database
                </Button>
                <Button variant="outline">
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Export Config
                </Button>
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Restart Services
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;