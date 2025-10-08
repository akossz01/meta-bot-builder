"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { PlusCircle, Bot, Loader2, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

// Types
type ConnectedAccount = { _id: string; accountId: string; accountName: string; };
type Chatbot = { _id: string; name: string; isActive: boolean; accountId: { accountName: string, accountId: string } };

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

  useEffect(() => {
    async function fetchData() {
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
    }
    fetchData();
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

  const handleActivateBot = async (botId: string) => {
    setActivatingId(botId);
    try {
      const res = await fetch(`/api/chatbots/${botId}/activate`, { method: 'PUT' });
      if (!res.ok) throw new Error("Failed to activate bot.");

      // Update UI state to reflect activation
      setChatbots(currentBots => 
        currentBots.map(bot => {
          const botToActivate = currentBots.find(b => b._id === botId);
          if (bot.accountId.accountId === botToActivate?.accountId.accountId) {
            return { ...bot, isActive: bot._id === botId };
          }
          return bot;
        })
      );
    } catch (e) {
      console.error(e);
    } finally {
      setActivatingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
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
      ) : chatbots.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {chatbots.map((bot) => (
            <Card key={bot._id} className="flex flex-col">
              <Link href={`/dashboard/chatbots/${bot._id}`} className="block hover:bg-muted/50 transition-colors rounded-t-xl flex-1">
                <CardHeader className="flex-row items-start gap-4">
                    <Bot className="h-8 w-8 text-primary mt-1" />
                    <div>
                        <CardTitle>{bot.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{bot.accountId.accountName}</p>
                    </div>
                </CardHeader>
              </Link>
              <CardContent className="mt-auto p-4 border-t flex items-center justify-between">
                <div className={`flex items-center gap-2 text-sm font-medium ${bot.isActive ? 'text-green-600' : 'text-muted-foreground'}`}>
                  <span className={`h-2 w-2 rounded-full ${bot.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  {bot.isActive ? 'Active' : 'Inactive'}
                </div>
                {!bot.isActive && (
                  <Button variant="outline" size="sm" onClick={() => handleActivateBot(bot._id)} disabled={activatingId === bot._id}>
                    {activatingId === bot._id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Activate
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No chatbots yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">Get started by creating your first chatbot.</p>
        </div>
      )}
    </div>
  );
}