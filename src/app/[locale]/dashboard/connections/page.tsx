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
import { Link2, Loader2, CheckCircle2 } from "lucide-react";

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

      <Card>
        <CardHeader>
          <CardTitle>Facebook Messenger & WhatsApp</CardTitle>
          <CardDescription>
            Connect your Facebook pages to manage Messenger and associated
            WhatsApp Business accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleConnectFacebook}>
            <Link2 className="mr-2 h-4 w-4" />
            {t("connectFacebook")}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">{t("connectedAccounts")}</h2>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading accounts...</span>
          </div>
        ) : accounts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {accounts.map((account) => (
              <Card key={account._id} className="flex items-center p-4 gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={`https://graph.facebook.com/${account.accountId}/picture`}
                    alt={account.accountName}
                  />
                  <AvatarFallback>{account.accountName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{account.accountName}</p>
                  <p className="text-sm text-muted-foreground capitalize">{account.accountType}</p>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-medium">Connected</span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">{t("noAccounts")}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}