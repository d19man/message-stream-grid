import { Badge } from "@/components/ui/badge";
import { NotificationDropdown } from "./NotificationDropdown";
import { SearchDialog } from "./SearchDialog";
import { SettingsDropdown } from "./SettingsDropdown";

const Topbar = () => {
  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm px-6 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-foreground">WhatsApp Suite Dashboard</h1>
        <Badge variant="secondary" className="bg-gradient-primary text-primary-foreground">
          Pro
        </Badge>
      </div>

      <div className="flex items-center space-x-2">
        <NotificationDropdown />
        <SearchDialog />
        <div className="hidden md:flex items-center space-x-1 text-xs text-muted-foreground">
          <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl</kbd>
          <span>+</span>
          <kbd className="px-2 py-1 bg-muted rounded text-xs">K</kbd>
        </div>
        <SettingsDropdown />
      </div>
    </header>
  );
};

export default Topbar;