import { useState } from "react";
import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  MessageSquare,
  Send,
  FileText,
  Users2,
  Shield,
  Settings,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Zap,
  User,
  LogOut,
  Moon,
  Sun,
  CreditCard,
  HelpCircle,
  Bell,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Sessions", href: "/sessions", icon: Smartphone },
  { name: "Pool Sessions", href: "/pool-sessions", icon: Shield },
  { name: "Inbox", href: "/inbox", icon: MessageSquare },
  { name: "Broadcast", href: "/broadcast", icon: Send },
  { name: "Templates", href: "/templates", icon: FileText },
  { name: "Contacts", href: "/contacts", icon: Users2 },
  { name: "Users", href: "/users", icon: Users2 },
  { name: "Roles", href: "/roles", icon: Shield },
  { name: "Settings", href: "/settings", icon: Settings },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
  });
  const { toast } = useToast();
  const { 
    signOut, 
    profile,
    canAccessDashboard,
    canManageSessions,
    canAccessPoolSessions,
    canViewInbox,
    canManageBroadcast,
    canManageTemplates,
    canManageContacts,
    canManageUsers,
    canManageRoles,
    canAccessSettings
  } = useAuth();

  // Filter navigation based on user permissions
  const getFilteredNavigation = () => {
    return navigation.filter(item => {
      switch (item.href) {
        case "/":
          return canAccessDashboard();
        case "/sessions":
          return canManageSessions();
        case "/pool-sessions":
          return canAccessPoolSessions();
        case "/inbox":
          return canViewInbox();
        case "/broadcast":
          return canManageBroadcast();
        case "/templates":
          return canManageTemplates();
        case "/contacts":
          return canManageContacts();
        case "/users":
          return canManageUsers();
        case "/roles":
          return canManageRoles();
        case "/settings":
          return canAccessSettings();
        default:
          return false;
      }
    });
  };

  const filteredNavigation = getFilteredNavigation();

  // Use real profile data instead of hardcoded dummy data
  const [profileData, setProfileData] = useState({
    name: profile?.full_name || "",
    email: profile?.email || "",
    phone: "+1 234 567 8900", // This can remain as placeholder since it's not in auth
    company: "WhatsApp Suite Ltd", // This can remain as placeholder
  });

  // Update profile data when auth profile changes
  React.useEffect(() => {
    if (profile) {
      setProfileData(prev => ({
        ...prev,
        name: profile.full_name || "",
        email: profile.email || ""
      }));
    }
  }, [profile]);

  const handleThemeToggle = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    
    toast({
      title: "Theme Updated",
      description: `Switched to ${newTheme ? "dark" : "light"} mode`,
    });
  };

  const handleProfileSave = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.name.trim()
          // Email is not updated as it's tied to authentication
        })
        .eq('id', profile?.id);

      if (error) {
        toast({
          title: "Error",
          description: `Failed to update profile: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Profile Updated", 
        description: "Your profile information has been saved successfully",
      });
      setProfileDialogOpen(false);
      
      // Refresh the page to show updated data
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Unexpected error: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const handleNotificationSave = () => {
    toast({
      title: "Notification Settings Updated",
      description: "Your notification preferences have been saved",
    });
    setNotificationDialogOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Berhasil Logout",
        description: "Anda telah berhasil keluar dari sistem",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal logout. Silakan coba lagi.",
        variant: "destructive",
      });
    }
  };

  return (
    <div
      className={cn(
        "bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-sidebar-foreground">WA Suite</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {filteredNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive && "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm",
                collapsed && "justify-center"
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start p-2 h-auto hover:bg-sidebar-accent",
                collapsed && "justify-center px-2"
              )}
            >
              <div className={cn("flex items-center", collapsed ? "justify-center" : "space-x-3 w-full")}>
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-primary-foreground">
                    {(profile?.full_name || profile?.email || "U").charAt(0).toUpperCase()}
                  </span>
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {profile?.full_name || "Loading..."}
                    </p>
                    <div className="flex items-center space-x-2">
                      <p className="text-xs text-sidebar-foreground/60 truncate capitalize">
                        {profile?.role || "User"}
                      </p>
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        {profile?.role === 'superadmin' ? 'Super Admin' : 'Pro'}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent 
            align="end" 
            side={collapsed ? "right" : "top"}
            className="w-64 mb-2"
          >
            <DropdownMenuLabel>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary-foreground">
                    {(profile?.full_name || profile?.email || "U").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{profile?.full_name || "Loading..."}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email || "Loading..."}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => setProfileDialogOpen(true)}>
              <User className="h-4 w-4 mr-2" />
              Profile Settings
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => setBillingDialogOpen(true)}>
              <CreditCard className="h-4 w-4 mr-2" />
              Billing & Subscription
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => setNotificationDialogOpen(true)}>
              <Bell className="h-4 w-4 mr-2" />
              Notification Settings
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleThemeToggle}>
              {darkMode ? (
                <Sun className="h-4 w-4 mr-2" />
              ) : (
                <Moon className="h-4 w-4 mr-2" />
              )}
              {darkMode ? "Light Mode" : "Dark Mode"}
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => setHelpDialogOpen(true)}>
              <HelpCircle className="h-4 w-4 mr-2" />
              Help & Support
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <div className="p-2">
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Storage:</span>
                  <span>2.4GB / 10GB</span>
                </div>
                <div className="flex justify-between">
                  <span>Plan:</span>
                  <Badge variant="outline" className="text-xs">Pro Plan</Badge>
                </div>
              </div>
            </div>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile Settings Dialog */}
        <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Profile Settings</DialogTitle>
              <DialogDescription>
                Update your profile information and preferences.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  disabled={true}
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed as it's linked to your authentication
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={profileData.company}
                  onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setProfileDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleProfileSave}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Billing & Subscription Dialog */}
        <Dialog open={billingDialogOpen} onOpenChange={setBillingDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Billing & Subscription</DialogTitle>
              <DialogDescription>
                Manage your subscription and billing information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Current Plan</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="default" className="mb-1">Pro Plan</Badge>
                    <p className="text-sm text-muted-foreground">$29/month • Renews Jan 31, 2025</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">$29.00</p>
                    <p className="text-xs text-muted-foreground">per month</p>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Usage</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Storage Used</span>
                    <span>2.4GB / 10GB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Messages Sent</span>
                    <span>1,234 / 5,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Active Sessions</span>
                    <span>3 / 10</span>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Payment Method</h3>
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4" />
                  <span className="text-sm">**** **** **** 4242</span>
                  <Badge variant="outline" className="text-xs">Visa</Badge>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBillingDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={() => {
                toast({
                  title: "Manage Billing",
                  description: "Redirecting to billing portal...",
                });
              }}>
                Manage Billing
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Notification Settings Dialog */}
        <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Notification Settings</DialogTitle>
              <DialogDescription>
                Choose how you want to be notified about important events.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  checked={notifications.emailNotifications}
                  onCheckedChange={(checked) => 
                    setNotifications({...notifications, emailNotifications: checked})
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
                </div>
                <Switch
                  checked={notifications.pushNotifications}
                  onCheckedChange={(checked) => 
                    setNotifications({...notifications, pushNotifications: checked})
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive important alerts via SMS</p>
                </div>
                <Switch
                  checked={notifications.smsNotifications}
                  onCheckedChange={(checked) => 
                    setNotifications({...notifications, smsNotifications: checked})
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">Receive product updates and tips</p>
                </div>
                <Switch
                  checked={notifications.marketingEmails}
                  onCheckedChange={(checked) => 
                    setNotifications({...notifications, marketingEmails: checked})
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNotificationDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleNotificationSave}>Save Preferences</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Help & Support Dialog */}
        <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Help & Support</DialogTitle>
              <DialogDescription>
                Get help and support for WhatsApp Suite.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-auto flex flex-col items-center p-4 space-y-2"
                  onClick={() => {
                    window.open("https://docs.whatsappsuite.com", "_blank");
                    toast({ title: "Opening Documentation" });
                  }}
                >
                  <FileText className="h-8 w-8" />
                  <span>Documentation</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-auto flex flex-col items-center p-4 space-y-2"
                  onClick={() => {
                    window.open("mailto:support@whatsappsuite.com", "_blank");
                    toast({ title: "Opening Email Client" });
                  }}
                >
                  <Bell className="h-8 w-8" />
                  <span>Contact Support</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-auto flex flex-col items-center p-4 space-y-2"
                  onClick={() => {
                    window.open("https://community.whatsappsuite.com", "_blank");
                    toast({ title: "Opening Community" });
                  }}
                >
                  <Users2 className="h-8 w-8" />
                  <span>Community</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-auto flex flex-col items-center p-4 space-y-2"
                  onClick={() => {
                    toast({
                      title: "Feature Request Submitted",
                      description: "Thank you for your feedback!",
                    });
                  }}
                >
                  <ExternalLink className="h-8 w-8" />
                  <span>Feature Request</span>
                </Button>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Quick Links</h4>
                <div className="space-y-1 text-sm">
                  <p className="flex justify-between">
                    <span>Version:</span>
                    <span>v2.1.0</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Support Hours:</span>
                    <span>24/7</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Response Time:</span>
                    <span>&lt; 2 hours</span>
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setHelpDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Sidebar;