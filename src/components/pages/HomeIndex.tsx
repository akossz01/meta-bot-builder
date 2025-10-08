"use client";

import { useTranslations } from "next-intl";
import {
  BrainCircuit,
  LogIn,
  MessagesSquare,
  Rocket,
  Workflow,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "../ModeToggle";
import LanguageSwitcher from "../LanguageSwitcher";

// A placeholder for where you'll put your stunning AI-generated images
const ImagePlaceholder = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "bg-muted/50 rounded-lg border-2 border-dashed flex items-center justify-center",
      className
    )}
  >
    <p className="text-sm text-muted-foreground">Visual</p>
  </div>
);

export default function HomeIndex() {
  const t = useTranslations("Index");

  const features = [
    {
      icon: <Workflow className="h-6 w-6 text-primary" />,
      title: t("features.f1Title"),
      description: t("features.f1Desc"),
    },
    {
      icon: <BrainCircuit className="h-6 w-6 text-primary" />,
      title: t("features.f2Title"),
      description: t("features.f2Desc"),
    },
    {
      icon: <MessagesSquare className="h-6 w-6 text-primary" />,
      title: t("features.f3Title"),
      description: t("features.f3Desc"),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b backdrop-blur-sm bg-background/95">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <motion.img
              src="/favicon.ico" alt="Logo" className="h-6 w-6"
              initial={{ rotate: -180, scale: 0 }} animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            />
            <span className="font-bold">{t("brandName")}</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <Link href="#features" className="text-muted-foreground transition-colors hover:text-foreground">
              {t("nav.features")}
            </Link>
            <Link href="#" className="text-muted-foreground transition-colors hover:text-foreground">
              {t("nav.pricing")}
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                {t("nav.login")}
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">{t("hero.cta")}</Link>
            </Button>
            <LanguageSwitcher />
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-32">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              {t("hero.title")}
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground">
              {t("hero.description")}
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/register">
                  <Rocket className="mr-2 h-5 w-5" />
                  {t("hero.cta")}
                </Link>
              </Button>
            </div>
          </motion.div>
          <motion.div
            className="mx-auto mt-16 max-w-5xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Replace this with your hero image */}
            <ImagePlaceholder className="aspect-video" />
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-muted/50 py-24 sm:py-32">
          <motion.div 
            className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ staggerChildren: 0.2 }}
          >
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("features.title")}</h2>
            </div>
            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 md:max-w-none md:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div key={index} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 }}}>
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      {feature.icon}
                    </div>
                    <h3 className="mt-6 text-lg font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-base text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 sm:py-32">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("cta.title")}</h2>
                    <p className="mt-4 text-lg leading-8 text-muted-foreground">{t("cta.description")}</p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Button size="lg" asChild>
                            <Link href="/register">
                                <Zap className="mr-2 h-5 w-5"/>
                                {t("cta.cta")}
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {t("brandName")}. {t("footer.copyright")}
          </p>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <ModeToggle />
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper to use cn function in a client component
import { cn } from "@/lib/utils";