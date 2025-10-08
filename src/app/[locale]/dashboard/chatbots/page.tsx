"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Bot, Loader2, MessageSquare, Power, PowerOff, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Types
type ConnectedAccount = { _id: string; accountId: string; accountName: string; };
type Chatbot = { 
  _id: string; 
  name: string; 
  isActive: boolean; 
  accountId: { 
    accountName: string; 
    accountId: string;
    pictureUrl?: string;
  } 
};

export default function ChatbotsPage() {
  const router = useRouter();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBotName, setNewBotName] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const fetchChatbots = async () => {
    setIsLoading(true);
    try {
      const [chatbotsRes, accountsRes] = await Promise.all([
        fetch("/api/chatbots"),
        fetch("/api/connections"),
      ]);
      const chatbotsData = await chatbotsRes.json();
      const accountsData = await accountsRes.json();
      setChatbots(chatbotsData);
      setAccounts(accountsData);
    } catch (e) {
      console.error("Failed to fetch data", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChatbots();
  }, []);

  const handleCreateChatbot = async () => {
    setError(null);
    if (!newBotName || !selectedAccount) {
        setError("Please provide a name and select a page.");
        return;
    }
    
    try {
        const response = await fetch("/api/chatbots", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newBotName, accountId: selectedAccount }),
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Failed to create chatbot.");
        }

        const newChatbot = await response.json();
        router.push(`/dashboard/chatbots/${newChatbot._id}`);
    } catch (err: any) {
        setError(err.message);
    }
  };

  const handleActivate = async (chatbotId: string) => {
    setActivatingId(chatbotId);
    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/activate`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Failed to activate chatbot');
      fetchChatbots();
    } catch (error) {
      console.error('Error activating chatbot:', error);
    } finally {
      setActivatingId(null);
    }
  };

  const handleDeactivate = async (chatbotId: string) => {
    setDeactivatingId(chatbotId);
    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/deactivate`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Failed to deactivate chatbot');
      fetchChatbots();
    } catch (error) {
      console.error('Error deactivating chatbot:', error);
    } finally {
      setDeactivatingId(null);
    }
  };

  const handleDelete = async (chatbotId: string) => {
    setDeletingId(chatbotId);
    try {
      const response = await fetch(`/api/chatbots/${chatbotId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete chatbot');
      fetchChatbots();
    } catch (error) {
      console.error('Error deleting chatbot:', error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Chatbots</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your automated conversation flows.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Chatbot
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Chatbot</DialogTitle>
              <DialogDescription>
                Choose a name and a connected page for your new bot.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Chatbot Name</Label>
                    <Input id="name" value={newBotName} onChange={(e) => setNewBotName(e.target.value)} placeholder="e.g., Customer Support Bot" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="account">Facebook Page</Label>
                     <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a page..." />
                        </SelectTrigger>
                        <SelectContent>
                            {accounts.length > 0 ? accounts.map(acc => (
                                <SelectItem key={acc._id} value={acc._id}>{acc.accountName}</SelectItem>
                            )) : <SelectItem value="no-accounts" disabled>No pages connected</SelectItem>}
                        </SelectContent>
                    </Select>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateChatbot}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading chatbots...</span>
        </div>
      ) : chatbots.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No chatbots yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">Get started by creating your first chatbot.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chatbots.map((chatbot) => (
            <Card key={chatbot._id} className={chatbot.isActive ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  {chatbot.accountId?.pictureUrl ? (
                    <img 
                      src={chatbot.accountId.pictureUrl} 
                      alt={chatbot.accountId.accountName}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Bot className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="flex items-center gap-2 flex-wrap">
                      <span className="truncate">{chatbot.name}</span>
                      {chatbot.isActive && (
                        <Badge variant="default">Active</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="truncate">
                      {chatbot.accountId?.accountName || 'Unknown Page'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/dashboard/chatbots/${chatbot._id}`)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Flow
                  </Button>
                  
                  {chatbot.isActive ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleDeactivate(chatbot._id)}
                      disabled={deactivatingId === chatbot._id}
                    >
                      {deactivatingId === chatbot._id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deactivating...
                        </>
                      ) : (
                        <>
                          <PowerOff className="mr-2 h-4 w-4" />
                          Deactivate
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleActivate(chatbot._id)}
                      disabled={activatingId === chatbot._id}
                    >
                      {activatingId === chatbot._id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Activating...
                        </>
                      ) : (
                        <>
                          <Power className="mr-2 h-4 w-4" />
                          Activate
                        </>
                      )}
                    </Button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="w-full"
                        disabled={deletingId === chatbot._id}
                      >
                        {deletingId === chatbot._id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the chatbot "{chatbot.name}" and all its flow data. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(chatbot._id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}