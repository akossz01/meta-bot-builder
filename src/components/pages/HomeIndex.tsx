"use client";

import { useTranslations } from "next-intl";
import {
  BrainCircuit,
  LogIn,
  MessagesSquare,
  Rocket,
  Workflow,
  Zap,
  PlayCircle,
  Check,
  Linkedin,
  ExternalLink,
} from "lucide-react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "../ModeToggle";
import LanguageSwitcher from "../LanguageSwitcher";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function HomeIndex() {
  const t = useTranslations("Index");

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <ModernHeader t={t} />
      <main className="flex-1">
        <HeroSection t={t} />
        <UnderHeroFeatures t={t} />
        <BentoFeaturesSection t={t} />
        <CTASection t={t} />
      </main>
      <ModernFooter t={t} />
    </div>
  );
}

// =====================================================================
// ======================= HEADER COMPONENT ============================
// =====================================================================

function ModernHeader({ t }: { t: any }) {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    if (latest > 10) {
      setScrolled(true);
    } else {
      setScrolled(false);
    }
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  return (
    <motion.header
      variants={{ visible: { y: 0 }, hidden: { y: "-100%" } }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-colors duration-300",
        scrolled
          ? "border-b border-border/50 bg-background/80 backdrop-blur-sm"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <motion.img
            src="/img/BuildYourChat Logo.png"
            alt="BuildYourChat Logo"
            className="h-8 w-auto"
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link
            href="#features"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("nav.features")}
          </Link>
          <a
            href="https://blynkchat.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground transition-colors hover:text-foreground flex items-center gap-1"
          >
            BlynkChat
            <ExternalLink className="h-3 w-3" />
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hidden sm:inline-flex"
          >
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
    </motion.header>
  );
}

// =====================================================================
// ======================= HERO SECTION ================================
// =====================================================================

function HeroSection({ t }: { t: any }) {
  return (
    <section className="relative w-full py-32 md:py-48 text-center bg-background overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          aria-hidden="true"
          className="absolute w-[40rem] h-[40rem] bg-pink-300/30 dark:bg-pink-500/20 rounded-full blur-3xl"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            y: [-18, 18, -18],
            scale: [1, 1.05, 1],
            rotate: [0, 360],
          }}
          transition={{
            y: { duration: 14, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 14, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 40, repeat: Infinity, ease: "linear" },
          }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute w-[30rem] h-[30rem] bg-blue-300/30 dark:bg-blue-500/20 rounded-full blur-3xl"
          style={{
            top: "30%",
            left: "30%",
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            y: [14, -14, 14],
            x: [-10, 10, -10],
            scale: [1, 1.07, 1],
            rotate: [0, -360],
          }}
          transition={{
            y: { duration: 18, repeat: Infinity, ease: "easeInOut" },
            x: { duration: 12, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 18, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 50, repeat: Infinity, ease: "linear" },
          }}
        />
        {/* Film grain overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 mix-blend-overlay opacity-[0.12]"
          style={{
            backgroundImage:
              "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABWGM9TAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAK5JREFUeNrs1rENgDAMBEH//+a2g4QgSdu0J6xnJwIEzjnT8z4AgO7Z9wAAwM0K8J8BBBAAAEEEAAAQQQAABBBBAgOsCCd9rtD5rZ4jymcYxmiN0QGb8HnTGe0h1HjkhtQCTJz3Q0Jw1QWBMk08c0JR0QmDMk0+cUL50QmDEk0+c0Jx0Q2DMk05808/xUNk3b6YH4BBBAAAEEEAAAQQQAABBBBAwL8GfgADAPwFCnEj1mRKAAAAAElFTkSuQmCC)",
            backgroundSize: "200px 200px",
            backgroundRepeat: "repeat",
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
            {t("hero.title")}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("hero.description")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Button
              size="lg"
              className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
              asChild
            >
              <Link href="/register">
                <PlayCircle className="mr-2 h-5 w-5" />
                {t("hero.cta")}
              </Link>
            </Button>
          </div>
          <div className="mt-8 flex items-center justify-center gap-2">
            <div className="flex -space-x-2">
              <Avatar className="w-8 h-8 border-2 border-background">
                <AvatarImage src="https://i.pravatar.cc/32?img=1" />
                <AvatarFallback>A1</AvatarFallback>
              </Avatar>
              <Avatar className="w-8 h-8 border-2 border-background">
                <AvatarImage src="https://i.pravatar.cc/32?img=2" />
                <AvatarFallback>A2</AvatarFallback>
              </Avatar>
              <Avatar className="w-8 h-8 border-2 border-background">
                <AvatarFallback>+10</AvatarFallback>
              </Avatar>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("footer.copyright")}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// =====================================================================
// =================== UNDER HERO FEATURES =============================
// =====================================================================

function UnderHeroFeatures({ t }: { t: any }) {
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
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              viewport={{ once: true }}
            >
              <Card className="h-full shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =====================================================================
// ================== BENTO FEATURES SECTION ===========================
// =====================================================================

function BentoFeaturesSection({ t }: { t: any }) {
  return (
    <section id="features" className="py-24">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("features.title")}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[4fr_3fr_3fr] gap-8 auto-rows-auto">
          {/* Large left card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="md:row-span-2 bg-card rounded-[2.5rem] p-12 shadow-sm hover:shadow-md transition-shadow min-h-[15rem]"
          >
            <div className="flex flex-col gap-4">
              <h2 className="text-5xl md:text-6xl font-bold text-foreground leading-[0.9] tracking-[-2px]">
                {t("features.f1Title")}
              </h2>
              <p className="text-xl text-muted-foreground font-medium leading-[1.3]">
                {t("features.f1Desc")}
              </p>
            </div>
          </motion.div>

          {/* Top right spanning 2 columns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="md:col-span-2 bg-gradient-to-r from-card to-blue-50 dark:to-blue-950/30 rounded-[2.5rem] p-8 shadow-sm hover:shadow-md transition-shadow min-h-[15rem]"
          >
            <div className="flex flex-col gap-4">
              <h2 className="text-4xl font-bold text-blue-600 dark:text-blue-400 leading-[0.9] tracking-[-2px]">
                {t("features.f2Title")}
              </h2>
              <p className="text-lg text-muted-foreground font-medium leading-[1.3]">
                {t("features.f2Desc")}
              </p>
            </div>
          </motion.div>

          {/* Image placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow min-h-[15rem] bg-muted flex items-center justify-center"
          >
            <p className="text-sm text-muted-foreground">Visual</p>
          </motion.div>

          {/* Purple card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-card to-purple-50 dark:to-purple-950/30 rounded-[2.5rem] p-8 shadow-sm hover:shadow-md transition-shadow min-h-[15rem]"
          >
            <div className="flex flex-col gap-4">
              <h3 className="text-3xl font-semibold text-purple-600 dark:text-purple-400 tracking-[-2px]">
                {t("features.f3Title")}
              </h3>
              <p className="text-lg text-muted-foreground font-medium leading-[1.3]">
                {t("features.f3Desc")}
              </p>
            </div>
          </motion.div>

          {/* Second Image with builder.gif */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
            className="rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow min-h-[15rem] bg-muted"
          >
            <img 
              src="/builder.gif" 
              alt="Bot Builder" 
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Bottom card spanning 2 columns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
            className="md:col-span-2 bg-card rounded-[2.5rem] p-8 shadow-sm hover:shadow-md transition-shadow min-h-[15rem]"
          >
            <div className="flex flex-col gap-4">
              <h2 className="text-4xl md:text-6xl font-bold text-foreground leading-[0.9] tracking-[-2px]">
                Advanced Features
              </h2>
              <p className="text-lg text-muted-foreground font-medium leading-[1.3]">
                Supercharge your support with powerful AI capabilities and seamless integrations.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// =====================================================================
// ======================= CTA SECTION =================================
// =====================================================================

function CTASection({ t }: { t: any }) {
  return (
    <section className="relative py-24 bg-background overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-[15%] left-[8%] w-[28rem] h-[28rem] bg-violet-300/25 dark:bg-violet-500/15 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite]" />
        <div className="absolute bottom-[10%] right-[12%] w-[35rem] h-[35rem] bg-amber-300/20 dark:bg-amber-500/15 rounded-full blur-3xl animate-[spin_30s_linear_infinite]" />
        <div className="absolute top-[40%] right-[5%] w-[20rem] h-[20rem] bg-rose-300/25 dark:bg-rose-500/15 rounded-full blur-2xl animate-[pulse_16s_ease-in-out_infinite]" />
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold">{t("cta.title")}</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("cta.description")}
          </p>
          <div className="flex justify-center gap-4 mt-8">
            <Button
              size="lg"
              className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
              asChild
            >
              <Link href="/register">
                <Zap className="mr-2 h-5 w-5" />
                {t("cta.cta")}
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// =====================================================================
// ======================= FOOTER COMPONENT ============================
// =====================================================================

function ModernFooter({ t }: { t: any }) {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <img src="/img/BuildYourChat Logo.png" alt="BuildYourChat Logo" className="h-8 w-auto" />
            </Link>
            <p className="text-sm text-muted-foreground">
              {t("hero.description")}
            </p>
            <div className="flex gap-4 mt-2">
              <a
                href="https://blynkchat.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
              <Link
                href="#"
                className="text-muted-foreground hover:text-primary"
              >
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#features"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  {t("nav.features")}
                </Link>
              </li>
              <li>
                <a
                  href="https://blynkchat.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  BlynkChat
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {t("brandName")}.{" "}
            {t("footer.copyright")}
          </p>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <ModeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}