"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Bot, Loader2, MessageSquare, Trash2, Edit, Settings, FlaskConical } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

// Types
type ConnectedAccount = { _id: string; accountId: string; accountName: string; };
type Chatbot = { 
  _id: string; 
  name: string; 
  isActive: boolean;
  mode?: 'active' | 'test' | 'inactive';
  testTrigger?: string;
  accountId: { 
    accountName: string; 
    accountId: string;
    pictureUrl?: string;
  } 
};

export default function ChatbotsPage() {
  const router = useRouter();
  const t = useTranslations("Chatbots");
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBotName, setNewBotName] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [changingModeId, setChangingModeId] = useState<string | null>(null);
  const { toast } = useToast();

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

  const handleModeChange = async (chatbotId: string, mode: 'active' | 'test' | 'inactive') => {
    setChangingModeId(chatbotId);
    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/mode`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change mode');
      }

      const updatedChatbot = await response.json();
      
      setChatbots(currentChatbots =>
        currentChatbots.map(bot =>
          bot._id === chatbotId ? { ...bot, mode: updatedChatbot.mode, testTrigger: updatedChatbot.testTrigger } : bot
        )
      );
      
      toast({
        title: "Success",
        description: `Chatbot mode changed to ${mode}`,
      });
      
    } catch (error: any) {
      console.error('Error changing mode:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to change mode",
        variant: "destructive"
      });
    } finally {
      setChangingModeId(null);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("description")}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("createButton")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("createDialog.title")}</DialogTitle>
              <DialogDescription>
                {t("createDialog.description")}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">{t("createDialog.nameLabel")}</Label>
                    <Input id="name" value={newBotName} onChange={(e) => setNewBotName(e.target.value)} placeholder={t("createDialog.namePlaceholder")} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="account">{t("createDialog.pageLabel")}</Label>
                    <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                        <SelectTrigger>
                            <SelectValue placeholder={t("createDialog.pagePlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                            {accounts.length > 0 ? accounts.map(acc => (
                                <SelectItem key={acc._id} value={acc._id}>{acc.accountName}</SelectItem>
                            )) : <SelectItem value="no-accounts" disabled>{t("createDialog.noPages")}</SelectItem>}
                        </SelectContent>
                    </Select>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t("createDialog.cancelButton")}</Button>
                <Button onClick={handleCreateChatbot}>{t("createDialog.createButton")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{t("loading")}</span>
        </div>
      ) : chatbots.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">{t("noChatbots.title")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("noChatbots.description")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chatbots.map((chatbot) => {
            const actualMode = chatbot.mode || 'inactive';
            const isActive = actualMode === 'active' || actualMode === 'test';
            
            return (
              <Card key={chatbot._id} className={isActive ? 'border-primary' : ''}>
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
                        {actualMode === 'active' && (
                          <Badge variant="default">{t("badges.active")}</Badge>
                        )}
                        {actualMode === 'test' && (
                          <Badge variant="secondary" className="gap-1">
                            <FlaskConical className="h-3 w-3" />
                            {t("badges.test")}
                          </Badge>
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
                      {t("editFlow")}
                    </Button>

                      <Select
                        value={actualMode}
                        onValueChange={(value: 'active' | 'test' | 'inactive') => handleModeChange(chatbot._id, value)}
                        disabled={changingModeId === chatbot._id}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inactive">{t("modeInactive")}</SelectItem>
                          <SelectItem value="test">{t("modeTest")}</SelectItem>
                          <SelectItem value="active">{t("modeActive")}</SelectItem>
                        </SelectContent>
                      </Select>
                      {changingModeId === chatbot._id && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          {t("deleting")}
                        </div>
                      )}

                    {actualMode === 'test' && chatbot.testTrigger && (
                      <div className="p-2 bg-muted rounded text-xs">
                        <p className="font-semibold mb-1">{t("testTriggerLabel")}</p>
                        <code className="bg-background px-2 py-1 rounded">{chatbot.testTrigger}</code>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/dashboard/chatbots/${chatbot._id}/settings`)}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      {t("settingsButton")}
                    </Button>

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
                              {t("deleting")}
                            </>
                          ) : (
                            <>
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t("deleteButton")}
                            </>
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("deleteDialog.description", { name: chatbot.name })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("deleteDialog.cancel")}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(chatbot._id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {t("deleteDialog.confirm")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}