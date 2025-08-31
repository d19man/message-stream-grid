import { useState } from "react";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Sessions", href: "/sessions", icon: Smartphone },
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
  const { toast } = useToast();

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

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
    
    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
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
        {navigation.map((item) => (
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
                  <span className="text-xs font-semibold text-primary-foreground">JS</span>
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">John Smith</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-xs text-sidebar-foreground/60 truncate">Admin</p>
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">Pro</Badge>
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
                  <span className="text-sm font-semibold text-primary-foreground">JS</span>
                </div>
                <div>
                  <p className="font-medium">John Smith</p>
                  <p className="text-xs text-muted-foreground">john@whatsappsuite.com</p>
                </div>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem>
              <User className="h-4 w-4 mr-2" />
              Profile Settings
            </DropdownMenuItem>
            
            <DropdownMenuItem>
              <CreditCard className="h-4 w-4 mr-2" />
              Billing & Subscription
            </DropdownMenuItem>
            
            <DropdownMenuItem>
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
            
            <DropdownMenuItem>
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
      </div>
    </div>
  );
};

export default Sidebar;