"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import React from "react";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Make flow builder and its settings page full-screen by checking the path.
  // This regex matches /dashboard/chatbots/[id] and /dashboard/chatbots/[id]/settings
  const isFullScreenPage = /^\/dashboard\/chatbots\/[^\/]+(\/settings)?$/.test(
    pathname
  );

  if (isFullScreenPage) {
    // Render children directly without the main dashboard layout
    return <>{children}</>;
  }

  // Render the default sidebar layout for all other pages
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[256px_1fr]">
      <Sidebar />
      <div className="flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-4 sm:p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}