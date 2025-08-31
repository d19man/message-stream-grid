import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  User, 
  Moon, 
  Sun, 
  Monitor, 
  Bell, 
  Shield, 
  Database, 
  Download, 
  Upload,
  LogOut,
  Palette,
  Volume2,
  VolumeX,
  Wifi,
  HardDrive
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export const SettingsDropdown = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [autoConnect, setAutoConnect] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    setDarkMode(theme === "dark");
    toast({
      title: "Theme Updated",
      description: `Switched to ${theme} theme`,
    });
  };

  const handleLogout = () => {
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
    // In real app, this would clear auth tokens and redirect
    console.log("Logout functionality");
  };

  const handleExportData = () => {
    toast({
      title: "Export Started",
      description: "Your data export will be ready shortly",
    });
  };

  const handleImportData = () => {
    toast({
      title: "Import Ready",
      description: "Please select a file to import",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center space-x-2">
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Profile */}
        <DropdownMenuItem onClick={() => navigate("/users")}>
          <User className="h-4 w-4 mr-2" />
          Profile Settings
        </DropdownMenuItem>

        {/* Theme */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette className="h-4 w-4 mr-2" />
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleThemeChange("light")}>
                <Sun className="h-4 w-4 mr-2" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleThemeChange("system")}>
                <Monitor className="h-4 w-4 mr-2" />
                System
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Quick Settings */}
        <div className="p-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span className="text-sm">Notifications</span>
            </div>
            <Switch
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {sounds ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              <span className="text-sm">Sound Effects</span>
            </div>
            <Switch
              checked={sounds}
              onCheckedChange={setSounds}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wifi className="h-4 w-4" />
              <span className="text-sm">Auto Connect</span>
            </div>
            <Switch
              checked={autoConnect}
              onCheckedChange={setAutoConnect}
            />
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Advanced Settings */}
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <Shield className="h-4 w-4 mr-2" />
          Security & Privacy
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <Database className="h-4 w-4 mr-2" />
          Data Management
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Data Operations */}
        <DropdownMenuItem onClick={handleExportData}>
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleImportData}>
          <Upload className="h-4 w-4 mr-2" />
          Import Data
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* System Info */}
        <div className="p-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Version</span>
            <Badge variant="outline" className="text-xs">v1.0.0</Badge>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
            <span>Storage</span>
            <div className="flex items-center space-x-1">
              <HardDrive className="h-3 w-3" />
              <span>2.4GB / 10GB</span>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem onClick={handleLogout} className="text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};