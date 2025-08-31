import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MessageSquare, Users, Send, Phone, FileText, Command } from "lucide-react";

interface SearchResult {
  id: string;
  type: "template" | "contact" | "session" | "campaign" | "page";
  title: string;
  description: string;
  badge?: string;
  action: string;
}

export const SearchDialog = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Mock search results
  const allResults: SearchResult[] = [
    {
      id: "1",
      type: "template",
      title: "Welcome Message",
      description: "Text template for new customers",
      badge: "CRM",
      action: "/templates"
    },
    {
      id: "2",
      type: "contact",
      title: "John Doe",
      description: "+1234567890 • Customer",
      badge: "VIP",
      action: "/contacts"
    },
    {
      id: "3",
      type: "session",
      title: "CRM-Main",
      description: "Connected • Last seen 2 min ago",
      badge: "Connected",
      action: "/sessions"
    },
    {
      id: "4",
      type: "campaign",
      title: "Summer Sale Campaign",
      description: "Running • 847 sent, 630 pending",
      badge: "Running",
      action: "/broadcast"
    },
    {
      id: "5",
      type: "page",
      title: "Dashboard",
      description: "Main dashboard with statistics",
      action: "/"
    },
    {
      id: "6",
      type: "page",
      title: "Users Management",
      description: "Manage system users and roles",
      action: "/users"
    },
    {
      id: "7",
      type: "page",
      title: "Settings",
      description: "Application settings and preferences",
      action: "/settings"
    },
  ];

  const filteredResults = query
    ? allResults.filter(result =>
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.description.toLowerCase().includes(query.toLowerCase())
      )
    : allResults.slice(0, 6);

  const getResultIcon = (type: string) => {
    switch (type) {
      case "template":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "contact":
        return <Users className="h-4 w-4 text-green-500" />;
      case "session":
        return <Phone className="h-4 w-4 text-purple-500" />;
      case "campaign":
        return <Send className="h-4 w-4 text-orange-500" />;
      case "page":
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "Connected":
        return "bg-success text-success-foreground";
      case "Running":
        return "bg-warning text-warning-foreground";
      case "VIP":
        return "bg-gradient-primary text-primary-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const handleResultClick = (result: SearchResult) => {
    window.location.href = result.action;
    setOpen(false);
    setQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Search className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Search</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates, contacts, sessions, campaigns..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Keyboard Shortcut Hint */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Pro tip: Use Ctrl+K to open search quickly</span>
            <div className="flex items-center space-x-1">
              <kbd className="px-2 py-1 bg-muted rounded text-xs">↑</kbd>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">↓</kbd>
              <span>to navigate</span>
            </div>
          </div>

          {/* Search Results */}
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {filteredResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {query ? "No results found" : "Start typing to search..."}
              </div>
            ) : (
              filteredResults.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handleResultClick(result)}
                >
                  {getResultIcon(result.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{result.title}</p>
                      {result.badge && (
                        <Badge className={`text-xs ${getBadgeColor(result.badge)}`}>
                          {result.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {result.description}
                    </p>
                  </div>
                  <Command className="h-3 w-3 text-muted-foreground" />
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};