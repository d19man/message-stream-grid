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
import { useAuth } from "@/contexts/AuthContext";

export const SettingsDropdown = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [autoConnect, setAutoConnect] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut } = useAuth();

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    setDarkMode(theme === "dark");
    
    // Apply theme to document
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // System theme
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (systemDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    
    // Save theme preference
    localStorage.setItem("theme", theme);
    
    toast({
      title: "Theme Updated",
      description: `Switched to ${theme} theme`,
    });
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

  const handleExportData = () => {
    const data = {
      settings: { darkMode, notifications, sounds, autoConnect },
      exportDate: new Date().toISOString(),
      version: "1.0.0"
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `whatsapp-suite-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Your data has been downloaded",
    });
  };

  const handleImportData = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            if (data.settings) {
              setDarkMode(data.settings.darkMode || false);
              setNotifications(data.settings.notifications || true);
              setSounds(data.settings.sounds || true);
              setAutoConnect(data.settings.autoConnect || true);
            }
            toast({
              title: "Import Successful",
              description: "Your settings have been imported",
            });
          } catch (error) {
            toast({
              title: "Import Failed",
              description: "Invalid file format",
              variant: "destructive",
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
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

        <DropdownMenuItem onClick={() => navigate("/change-password")}>
          <Shield className="h-4 w-4 mr-2" />
          Ubah Password
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