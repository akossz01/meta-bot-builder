"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Bot, Loader2, MessageSquare, Trash2, Edit, Settings, FlaskConical, MoreVertical, Power } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
      toast({
        title: "Success",
        description: "Chatbot deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting chatbot:', error);
      toast({
        title: "Error",
        description: "Failed to delete chatbot",
        variant: "destructive"
      });
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

  const getModeInfo = (mode: 'active' | 'test' | 'inactive' | undefined) => {
    const actualMode = mode || 'inactive';
    switch (actualMode) {
      case 'active':
        return { label: t("badges.active"), color: "bg-green-500", variant: "default" as const };
      case 'test':
        return { label: t("badges.test"), color: "bg-yellow-500", variant: "secondary" as const };
      default:
        return { label: t("modeInactive"), color: "bg-gray-400", variant: "outline" as const };
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-2">{t("description")}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
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
        <div className="flex items-center justify-center gap-2 text-muted-foreground py-12">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{t("loading")}</span>
        </div>
      ) : chatbots.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">{t("noChatbots.title")}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t("noChatbots.description")}</p>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              {t("createButton")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chatbots.map((chatbot) => {
            const actualMode = chatbot.mode || 'inactive';
            const modeInfo = getModeInfo(actualMode);
            
            return (
              <Card 
                key={chatbot._id} 
                className="group hover:shadow-md transition-all duration-200 hover:border-primary/20"
              >
                <CardContent className="p-6">
                  {/* Header with Avatar and Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-12 w-12 ring-2 ring-background group-hover:ring-primary/10 transition-all">
                        <AvatarImage
                          src={chatbot.accountId?.pictureUrl || `https://graph.facebook.com/${chatbot.accountId?.accountId}/picture`}
                          alt={chatbot.accountId?.accountName}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {chatbot.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                          {chatbot.name}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {chatbot.accountId?.accountName || 'Unknown Page'}
                        </p>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/chatbots/${chatbot._id}`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t("editFlow")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/chatbots/${chatbot._id}/settings`)}>
                          <Settings className="mr-2 h-4 w-4" />
                          {t("settingsButton")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t("deleteButton")}
                            </DropdownMenuItem>
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <Badge variant={modeInfo.variant} className="gap-1.5">
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${modeInfo.color} ${actualMode === 'active' ? 'animate-pulse' : ''}`} />
                      {modeInfo.label}
                      {actualMode === 'test' && <FlaskConical className="h-3 w-3" />}
                    </Badge>
                  </div>

                  {/* Test Trigger Info */}
                  {actualMode === 'test' && chatbot.testTrigger && (
                    <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-dashed">
                      <p className="text-xs font-medium text-muted-foreground mb-1">{t("testTriggerLabel")}</p>
                      <code className="text-xs bg-background px-2 py-1 rounded border">
                        {chatbot.testTrigger}
                      </code>
                    </div>
                  )}

                  {/* Mode Selector */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Bot Status</Label>
                    <Select
                      value={actualMode}
                      onValueChange={(value: 'active' | 'test' | 'inactive') => handleModeChange(chatbot._id, value)}
                      disabled={changingModeId === chatbot._id}
                    >
                      <SelectTrigger className="w-full h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inactive">
                          <div className="flex items-center gap-2">
                            <Power className="h-3.5 w-3.5" />
                            {t("modeInactive")}
                          </div>
                        </SelectItem>
                        <SelectItem value="test">
                          <div className="flex items-center gap-2">
                            <FlaskConical className="h-3.5 w-3.5" />
                            {t("modeTest")}
                          </div>
                        </SelectItem>
                        <SelectItem value="active">
                          <div className="flex items-center gap-2">
                            <Power className="h-3.5 w-3.5 text-green-500" />
                            {t("modeActive")}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {changingModeId === chatbot._id && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Updating...</span>
                      </div>
                    )}
                  </div>

                  {/* Primary Action */}
                  <Button
                    onClick={() => router.push(`/dashboard/chatbots/${chatbot._id}`)}
                    className="w-full mt-4 gap-2"
                    variant="outline"
                  >
                    <Edit className="h-4 w-4" />
                    {t("editFlow")}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}