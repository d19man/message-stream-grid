import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users2,
  Plus,
  Search,
  Upload,
  Download,
  Filter,
  Edit,
  Trash2,
  Phone,
  Tag,
  UserX,
  UserCheck,
} from "lucide-react";
import type { Contact } from "@/types";

const Contacts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Mock data
  const contacts: Contact[] = [
    {
      id: "1",
      phone: "+1234567890",
      name: "John Doe",
      tags: ["customer", "vip"],
      optOut: false,
      lastContactAt: "2024-01-15T10:30:00Z",
      userId: "user1",
      createdAt: "2024-01-10T08:00:00Z",
      updatedAt: "2024-01-15T10:30:00Z",
    },
    {
      id: "2",
      phone: "+1234567891",
      name: "Jane Smith",
      tags: ["prospect", "enterprise"],
      optOut: false,
      lastContactAt: "2024-01-14T15:20:00Z",
      userId: "user1",
      createdAt: "2024-01-12T09:00:00Z",
      updatedAt: "2024-01-14T15:20:00Z",
    },
    {
      id: "3",
      phone: "+1234567892",
      name: "Mike Johnson",
      tags: ["customer"],
      optOut: true,
      lastContactAt: "2024-01-13T12:15:00Z",
      userId: "user1",
      createdAt: "2024-01-08T10:00:00Z",
      updatedAt: "2024-01-13T12:15:00Z",
    },
    {
      id: "4",
      phone: "+1234567893",
      name: "Sarah Wilson",
      tags: ["prospect", "lead"],
      optOut: false,
      lastContactAt: "2024-01-15T09:45:00Z",
      userId: "user1",
      createdAt: "2024-01-14T11:00:00Z",
      updatedAt: "2024-01-15T09:45:00Z",
    },
    {
      id: "5",
      phone: "+1234567894",
      name: "",
      tags: ["cold-lead"],
      optOut: false,
      userId: "user1",
      createdAt: "2024-01-15T07:00:00Z",
      updatedAt: "2024-01-15T07:00:00Z",
    },
  ];

  // Get all unique tags
  const allTags = Array.from(new Set(contacts.flatMap(contact => contact.tags)));

  // Filter contacts
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery);
    
    const matchesTag = !selectedTag || contact.tags.includes(selectedTag);
    
    return matchesSearch && matchesTag;
  });

  const stats = {
    total: contacts.length,
    optedOut: contacts.filter(c => c.optOut).length,
    tagged: contacts.filter(c => c.tags.length > 0).length,
    recent: contacts.filter(c => 
      c.lastContactAt && 
      new Date(c.lastContactAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contacts</h1>
          <p className="text-muted-foreground">Manage your contact database</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button className="bg-gradient-primary hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.total - stats.optedOut}</div>
            <p className="text-xs text-muted-foreground">
              Can receive messages
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opted Out</CardTitle>
            <UserX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.optedOut}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.optedOut / stats.total) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Phone className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recent}</div>
            <p className="text-xs text-muted-foreground">
              Contacted this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Tag Filter */}
            <div className="flex items-center space-x-2">
              <Button
                variant={selectedTag === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTag(null)}
              >
                All Tags
              </Button>
              {allTags.slice(0, 5).map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>
            Contacts ({filteredContacts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredContacts.length === 0 ? (
            <div className="text-center py-8">
              <Users2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No contacts found</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedTag
                  ? "Try adjusting your filters"
                  : "Import contacts or add them manually to get started"
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Contact</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary-foreground">
                            {contact.name?.charAt(0) || "?"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{contact.name || "Unknown"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm">{contact.phone}</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            <Tag className="h-2 w-2 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.optOut ? (
                        <Badge variant="destructive" className="text-xs">
                          <UserX className="h-3 w-3 mr-1" />
                          Opted Out
                        </Badge>
                      ) : (
                        <Badge className="bg-success text-success-foreground text-xs">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {contact.lastContactAt
                          ? new Date(contact.lastContactAt).toLocaleDateString()
                          : "Never"
                        }
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Contacts;