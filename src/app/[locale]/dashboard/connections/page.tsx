"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link2, Loader2, Facebook, MessageCircle, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Define a type for our account data
type ConnectedAccount = {
  _id: string;
  accountId: string;
  accountName: string;
  accountType: 'messenger' | 'whatsapp';
};

export default function ConnectionsPage() {
  const t = useTranslations("Connections");
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch("/api/connections");
        if (response.ok) {
          const data = await response.json();
          setAccounts(data);
        } else {
          console.error("Failed to fetch accounts");
        }
      } catch (error) {
        console.error("Error fetching accounts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const handleConnectFacebook = () => {
    window.location.href = "/api/meta/auth";
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-2">{t("description")}</p>
      </div>

      {/* Connect New Account Section */}
      <Card className="border-dashed hover:border-primary/50 transition-colors">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Facebook className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Connect Facebook</CardTitle>
              <CardDescription className="text-sm">
                Link your Facebook pages to enable Messenger and WhatsApp
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button onClick={handleConnectFacebook} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Connect Account
          </Button>
        </CardContent>
      </Card>

      {/* Connected Accounts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t("connectedAccounts")}</h2>
          {!isLoading && accounts.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground py-12">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading accounts...</span>
          </div>
        ) : accounts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <Card 
                key={account._id} 
                className="group hover:shadow-md transition-all duration-200 hover:border-primary/20"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 ring-2 ring-background group-hover:ring-primary/10 transition-all">
                      <AvatarImage
                        src={`https://graph.facebook.com/${account.accountId}/picture`}
                        alt={account.accountName}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {account.accountName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                        {account.accountName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {account.accountType === 'messenger' ? (
                          <MessageCircle className="h-3.5 w-3.5 text-blue-500" />
                        ) : (
                          <MessageCircle className="h-3.5 w-3.5 text-green-500" />
                        )}
                        <span className="text-xs text-muted-foreground capitalize">
                          {account.accountType}
                        </span>
                      </div>
                      <div className="mt-3">
                        <Badge 
                          variant="outline" 
                          className="text-xs border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
                        >
                          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                          Connected
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Link2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mb-1">{t("noAccounts")}</p>
              <p className="text-xs text-muted-foreground">
                Connect your first account to get started
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}