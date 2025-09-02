import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  const [selectedIndex, setSelectedIndex] = useState(0);

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

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

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
    setSelectedIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredResults.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredResults.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (filteredResults[selectedIndex]) {
          handleResultClick(filteredResults[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setQuery("");
        setSelectedIndex(0);
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = document.getElementById(`search-result-${selectedIndex}`);
    if (selectedElement) {
      selectedElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedIndex]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Search className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl" onKeyDown={handleKeyDown}>
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
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          {/* Keyboard Shortcut Hints */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Pro tip: Use Ctrl+K to open search quickly</span>
            <div className="flex items-center space-x-1">
              <kbd className="px-2 py-1 bg-muted rounded text-xs">↑</kbd>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">↓</kbd>
              <span>navigate</span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs ml-2">Enter</kbd>
              <span>select</span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs ml-2">Esc</kbd>
              <span>close</span>
            </div>
          </div>

          {/* Search Results */}
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {filteredResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {query ? "No results found" : "Start typing to search..."}
              </div>
            ) : (
              filteredResults.map((result, index) => (
                <div
                  key={result.id}
                  id={`search-result-${index}`}
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    index === selectedIndex 
                      ? 'bg-accent border-2 border-primary' 
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => handleResultClick(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {getResultIcon(result.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium text-sm ${
                        index === selectedIndex ? 'text-primary' : ''
                      }`}>
                        {result.title}
                      </p>
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
                  <div className="flex items-center space-x-1">
                    {index === selectedIndex && (
                      <kbd className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs">
                        Enter
                      </kbd>
                    )}
                    <Command className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};