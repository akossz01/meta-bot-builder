"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link2 } from "lucide-react";

export default function ConnectionsPage() {
  const t = useTranslations("Connections");

  const handleConnectFacebook = () => {
    // This will redirect the user to our backend endpoint,
    // which then redirects to Facebook's OAuth screen.
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
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">{t("noAccounts")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}