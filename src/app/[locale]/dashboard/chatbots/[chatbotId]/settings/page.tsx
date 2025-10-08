"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Trash2, RefreshCw, Copy, Check, User } from "lucide-react";
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

type Tester = {
  user_psid: string;
  addedAt: string;
  name?: string;
  profilePic?: string;
};

type Chatbot = {
  _id: string;
  name: string;
  mode: 'active' | 'test' | 'inactive';
  testTrigger?: string;
  testers: Tester[];
};

export default function ChatbotSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const chatbotId = params.chatbotId as string;

  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [removingTester, setRemovingTester] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copiedTrigger, setCopiedTrigger] = useState(false);

  const fetchChatbot = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/chatbots/${chatbotId}`);
      if (!response.ok) throw new Error("Failed to fetch chatbot");
      const data = await response.json();
      setChatbot(data);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to load chatbot settings",
        variant: "destructive",
      });
      router.push("/dashboard/chatbots");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChatbot();
  }, [chatbotId]);

  const handleRemoveTester = async (userPsid: string) => {
    setRemovingTester(userPsid);
    try {
      const response = await fetch(
        `/api/chatbots/${chatbotId}/testers?user_psid=${userPsid}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to remove tester");
      
      // Update local state
      setChatbot(prev => prev ? {
        ...prev,
        testers: prev.testers.filter(t => t.user_psid !== userPsid)
      } : null);

      toast({
        title: "Success",
        description: "Tester removed successfully",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to remove tester",
        variant: "destructive",
      });
    } finally {
      setRemovingTester(null);
    }
  };

  const handleRegenerateTrigger = async () => {
    setIsRegenerating(true);
    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/regenerate-trigger`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to regenerate trigger");
      
      const data = await response.json();
      setChatbot(prev => prev ? {
        ...prev,
        testTrigger: data.testTrigger,
        testers: [] // Cleared on regeneration
      } : null);

      toast({
        title: "Success",
        description: "Test trigger regenerated. All testers have been removed.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to regenerate trigger",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopyTrigger = () => {
    if (chatbot?.testTrigger) {
      navigator.clipboard.writeText(chatbot.testTrigger);
      setCopiedTrigger(true);
      setTimeout(() => setCopiedTrigger(false), 2000);
      toast({
        title: "Copied!",
        description: "Test trigger copied to clipboard",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!chatbot) return null;

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => router.push("/dashboard/chatbots")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Chatbots
      </Button>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{chatbot.name}</h1>
          <p className="text-muted-foreground mt-2">
            Manage chatbot settings and test mode
          </p>
        </div>

        {/* Mode Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
            <CardDescription>View the current mode of this chatbot</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Mode:</span>
              {chatbot.mode === 'active' && (
                <Badge variant="default">Active</Badge>
              )}
              {chatbot.mode === 'test' && (
                <Badge variant="secondary">Test Mode</Badge>
              )}
              {chatbot.mode === 'inactive' && (
                <Badge variant="outline">Inactive</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Mode Settings */}
        {chatbot.mode === 'test' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Test Trigger Code</CardTitle>
                <CardDescription>
                  Share this code with testers. They must send this exact message to activate test mode.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-4 py-2 rounded text-lg font-mono">
                    {chatbot.testTrigger}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyTrigger}
                  >
                    {copiedTrigger ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={isRegenerating}>
                      {isRegenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Regenerate Trigger
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Regenerate Test Trigger?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will generate a new test trigger code and remove all current testers. 
                        They will need to use the new code to become testers again.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRegenerateTrigger}>
                        Regenerate
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Authorized Testers</CardTitle>
                <CardDescription>
                  Users who have sent the test trigger and can interact with the test bot
                </CardDescription>
              </CardHeader>
              <CardContent>
                {chatbot.testers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="mx-auto h-12 w-12 mb-2 opacity-50" />
                    <p>No testers yet</p>
                    <p className="text-sm mt-1">
                      Share the test trigger code to add testers
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {chatbot.testers.map((tester) => (
                      <div
                        key={tester.user_psid}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {tester.profilePic ? (
                            <img 
                              src={tester.profilePic} 
                              alt={tester.name || 'User'} 
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {tester.name || 'Unknown User'}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono truncate">
                              {tester.user_psid}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Added {new Date(tester.addedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={removingTester === tester.user_psid}
                            >
                              {removingTester === tester.user_psid ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Tester?</AlertDialogTitle>
                              <AlertDialogDescription>
                                {tester.name || 'This user'} will no longer have access to the test bot. They can re-gain 
                                access by sending the test trigger again.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveTester(tester.user_psid)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {chatbot.mode !== 'test' && (
          <Card>
            <CardHeader>
              <CardTitle>Test Mode</CardTitle>
              <CardDescription>
                Enable test mode to try out your chatbot with specific testers before going live
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Switch to test mode from the chatbots page to enable tester management
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
