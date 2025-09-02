import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ContactDialog } from "@/components/contacts/ContactDialog";
import { ImportContactDialog, SYSTEM_TYPES } from "@/components/contacts/ImportContactDialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { Contact, PoolType } from "@/types";

const Contacts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { toast } = useToast();
  const { profile } = useAuth();

  // Filter available pools based on user role
  const getAvailablePools = (): PoolType[] => {
    if (!profile?.role) return ["CRM"];
    
    switch (profile.role) {
      case 'crm':
        return ["CRM"];
      case 'blaster':
        return ["BLASTER"];
      case 'warmup':
        return ["WARMUP"];
      case 'admin':
      case 'superadmin':
        return ["CRM", "BLASTER", "WARMUP"];
      default:
        return ["CRM"];
    }
  };

  const availablePools = getAvailablePools();
  
  // Set default pool based on user role
  const getDefaultPool = (): PoolType => {
    if (!profile?.role) return "CRM";
    
    switch (profile.role) {
      case 'crm':
        return "CRM";
      case 'blaster':
        return "BLASTER";
      case 'warmup':
        return "WARMUP";
      default:
        return "CRM";
    }
  };

  const [selectedPool, setSelectedPool] = useState<PoolType>("CRM");

  // Update selected pool when profile loads
  useEffect(() => {
    if (profile?.role) {
      const defaultPool = getDefaultPool();
      setSelectedPool(defaultPool);
    }
  }, [profile?.role]);

  // Mock data
  const initialContacts: Contact[] = [
    {
      id: "1",
      phone: "+1234567890",
      name: "John Doe",
      system: "crm",
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
      system: "blaster",
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
      system: "crm",
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
      system: "warmup",
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
      system: "blaster",
      tags: ["cold-lead"],
      optOut: false,
      userId: "user1",
      createdAt: "2024-01-15T07:00:00Z",
      updatedAt: "2024-01-15T07:00:00Z",
    },
  ];

  const [contacts, setContacts] = useState<Contact[]>(initialContacts);

  const handleSaveContact = (contactData: Partial<Contact>) => {
    if (contactData.id) {
      // Edit existing contact
      setContacts(prev => prev.map(c => 
        c.id === contactData.id ? { ...c, ...contactData, updatedAt: new Date().toISOString() } : c
      ));
    } else {
      // Create new contact
      const newContact: Contact = {
        id: Date.now().toString(),
        name: contactData.name!,
        phone: contactData.phone!,
        system: contactData.system || "crm",
        tags: contactData.tags!,
        optOut: false,
        userId: "user1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setContacts(prev => [...prev, newContact]);
    }
  };

  const handleImportContacts = (importedContacts: Partial<Contact>[]) => {
    const newContacts: Contact[] = importedContacts.map((contactData, index) => ({
      id: (Date.now() + index).toString(),
      name: contactData.name || "",
      phone: contactData.phone!,
      system: contactData.system || "crm",
      tags: contactData.tags || [],
      optOut: contactData.optOut || false,
      userId: "user1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    
    setContacts(prev => [...prev, ...newContacts]);
    toast({
      title: "Success",
      description: `Imported ${newContacts.length} contacts successfully!`,
    });
  };

  const handleDeleteContact = (id: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      setContacts(prev => prev.filter(c => c.id !== id));
      toast({
        title: "Success",
        description: "Contact deleted successfully!",
      });
    }
  };

  // Role-based filtering
  const getAccessibleContacts = () => {
    if (profile?.role === 'superadmin') {
      return contacts; // Super admin sees all
    }
    // CRM users only see CRM contacts
    return contacts.filter(contact => contact.system === 'crm');
  };

  const accessibleContacts = getAccessibleContacts();

  // Pool filtering
  const poolFilteredContacts = accessibleContacts.filter(contact => {
    const poolSystemMap: Record<PoolType, string> = {
      'CRM': 'crm',
      'BLASTER': 'blaster', 
      'WARMUP': 'warmup'
    };
    return contact.system === poolSystemMap[selectedPool];
  });

  // Get all unique tags from current pool
  const allTags = Array.from(new Set(poolFilteredContacts.flatMap(contact => contact.tags)));

  // Filter contacts
  const filteredContacts = poolFilteredContacts.filter(contact => {
    const matchesSearch = 
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery);
    
    const matchesTag = !selectedTag || contact.tags.includes(selectedTag);
    
    return matchesSearch && matchesTag;
  });

  const stats = {
    total: poolFilteredContacts.length,
    optedOut: poolFilteredContacts.filter(c => c.optOut).length,
    tagged: poolFilteredContacts.filter(c => c.tags.length > 0).length,
    recent: poolFilteredContacts.filter(c => 
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
          <p className="text-muted-foreground">Manage your contact database by category</p>
        </div>
        <div className="flex items-center space-x-4">
          <ImportContactDialog onImport={handleImportContacts} />
          {/* Export function only for superadmin and admin */}
          {(profile?.role === 'superadmin' || profile?.role === 'admin') && (
            <Button variant="outline" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export {selectedPool}</span>
            </Button>
          )}
          <ContactDialog onSave={handleSaveContact} />
        </div>
      </div>

      {/* Pool Tabs - Only show pools available to user */}
      <div className="flex justify-center">
        <Tabs value={selectedPool} onValueChange={(value) => {
          setSelectedPool(value as PoolType);
          setSelectedTag(null); // Reset tag filter when switching pools
        }} className="w-full max-w-md">
          <TabsList className={`grid w-full ${availablePools.length === 1 ? 'grid-cols-1' : availablePools.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {availablePools.includes("CRM") && (
              <TabsTrigger value="CRM" className="text-sm">CRM</TabsTrigger>
            )}
            {availablePools.includes("BLASTER") && (
              <TabsTrigger value="BLASTER" className="text-sm">BLASTER</TabsTrigger>
            )}
            {availablePools.includes("WARMUP") && (
              <TabsTrigger value="WARMUP" className="text-sm">WARMUP</TabsTrigger>
            )}
          </TabsList>
        </Tabs>
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
            <span>Filters - {selectedPool}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${selectedPool} contacts...`}
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
            {selectedPool} Contacts ({filteredContacts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredContacts.length === 0 ? (
            <div className="text-center py-8">
              <Users2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No {selectedPool} contacts found</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedTag
                  ? "Try adjusting your filters"
                  : `Import ${selectedPool} contacts or add them manually to get started`
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>System</TableHead>
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
                      <Badge 
                        variant="secondary" 
                        className="flex items-center space-x-1 w-fit"
                      >
                        <div className={`w-2 h-2 rounded-full ${SYSTEM_TYPES.find(s => s.value === contact.system)?.color}`}></div>
                        <span className="text-xs">{SYSTEM_TYPES.find(s => s.value === contact.system)?.label}</span>
                      </Badge>
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
                        <ContactDialog 
                          contact={contact}
                          onSave={handleSaveContact}
                          trigger={
                            <Button variant="ghost" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                          }
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteContact(contact.id)}
                        >
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