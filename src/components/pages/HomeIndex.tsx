"use client";
import { useTranslations } from "next-intl";
import {
  BrainCircuit,
  LogIn,
  MessagesSquare,
  Rocket,
  Workflow,
} from "lucide-react";
import { motion } from "framer-motion";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ModeToggle } from "../ModeToggle";
import LanguageSwitcher from "../LanguageSwitcher";

const ANIMATION_VARIANTS = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  },
};

const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <motion.div variants={ANIMATION_VARIANTS.item}>
    <Card className="h-full text-center shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-col items-center gap-4">
        <div className="bg-primary/10 p-3 rounded-full">{icon}</div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  </motion.div>
);

export default function HomeIndex() {
  const t = useTranslations("Index");

  const features = [
    {
      icon: <Workflow className="h-8 w-8 text-primary" />,
      title: t("feature1Title"),
      description: t("feature1Desc"),
    },
    {
      icon: <BrainCircuit className="h-8 w-8 text-primary" />,
      title: t("feature2Title"),
      description: t("feature2Desc"),
    },
    {
      icon: <MessagesSquare className="h-8 w-8 text-primary" />,
      title: t("feature3Title"),
      description: t("feature3Desc"),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b backdrop-blur-sm bg-background/95">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <motion.img
              src="/favicon.ico"
              alt="Logo"
              className="h-6 w-6"
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
            />
            <span className="font-bold">{t("brandName")}</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <Link
              href="#features"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("navFeatures")}
            </Link>
            <Link
              href="#"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("navPricing")}
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                {t("login")}
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">{t("getStarted")}</Link>
            </Button>
            <LanguageSwitcher />
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <motion.section
          className="container mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8 lg:py-32"
          variants={ANIMATION_VARIANTS.container}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            variants={ANIMATION_VARIANTS.item}
          >
            {t("heroTitle")}
          </motion.h1>
          <motion.p
            className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground"
            variants={ANIMATION_VARIANTS.item}
          >
            {t("heroDescription")}
          </motion.p>
          <motion.div
            className="mt-10 flex flex-wrap justify-center gap-4"
            variants={ANIMATION_VARIANTS.item}
          >
            <Button size="lg" asChild>
              <Link href="/register">
                <Rocket className="mr-2 h-5 w-5" />
                {t("getStarted")}
              </Link>
            </Button>
          </motion.div>
        </motion.section>

        <motion.section
          id="features"
          className="bg-muted/50 py-24 sm:py-32"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t("featuresTitle")}
              </h2>
            </div>
            <motion.div
              className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 md:max-w-none md:grid-cols-3"
              variants={ANIMATION_VARIANTS.container}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {features.map((feature, index) => (
                <FeatureCard
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              ))}
            </motion.div>
          </div>
        </motion.section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {t("brandName")}. All rights reserved.
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