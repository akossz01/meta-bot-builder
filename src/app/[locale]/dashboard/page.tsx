"use client";

import { useTranslations } from "next-intl";

export default function DashboardPage() {
  const t = useTranslations("Dashboard");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">{t("welcome")}</h1>
      <p className="text-muted-foreground">{t("welcomeDescription")}</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Placeholder for future dashboard cards */}
      </div>
    </div>
  );
}