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
type Chatbot = { _id: string; name: string; accountId: { accountName: string, accountId: string } };

export default function ChatbotsPage() {
  const router = useRouter();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBotName, setNewBotName] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [error, setError] = useState<string | null>(null);

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
            <Link key={bot._id} href={`/dashboard/chatbots/${bot._id}`}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex-row items-center gap-4">
                    <Bot className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle>{bot.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{bot.accountId.accountName}</p>
                    </div>
                </CardHeader>
              </Card>
            </Link>
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