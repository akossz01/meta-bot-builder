import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MobileSidebar } from "./MobileSidebar";
import { ModeToggle } from "../ModeToggle";
import LanguageSwitcher from "../LanguageSwitcher";

export function DashboardHeader() {
  const t = useTranslations("Index");

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <MobileSidebar />
        <Link href="/" className="flex items-center gap-2 font-bold">
            <img src="/favicon.ico" alt="Logo" className="h-6 w-6" />
        </Link>
      </div>
      
      {/* Spacer for desktop */}
      <div className="flex-1 md:hidden"></div>
      
      <div className="flex w-full items-center gap-4 md:ml-auto md:flex-initial">
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher />
            <ModeToggle />
          </div>
      </div>
    </header>
  );
}