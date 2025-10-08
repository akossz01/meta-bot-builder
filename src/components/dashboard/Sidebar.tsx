"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, Link } from "@/i18n/navigation";
import {
  LayoutDashboard,
  LogOut,
  Settings,
  Link2,
  Loader2,
  BotMessageSquare, // Added import
  ChevronLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const t = useTranslations("Dashboard");
  const tIndex = useTranslations("Index");
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: t("navDashboard") },
    { href: "/dashboard/connections", icon: Link2, label: t("navConnections") },
    { href: "/dashboard/chatbots", icon: BotMessageSquare, label: "Chatbots" }, // Added "Chatbots"
    { href: "/dashboard/settings", icon: Settings, label: t("navSettings") },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        router.push("/");
        router.refresh();
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("An error occurred during logout:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="hidden md:flex md:flex-col bg-background border-r">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <img src="/favicon.ico" alt="Logo" className="h-6 w-6" />
          <span>{tIndex('brandName')}</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="flex flex-col gap-2 p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                pathname === item.href && "bg-muted text-primary"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="p-4 mt-auto border-t">
        <Button onClick={handleLogout} disabled={isLoggingOut} variant="ghost" className="w-full justify-start">
          {isLoggingOut ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          {t("logout")}
        </Button>
      </div>
    </aside>
  );
}