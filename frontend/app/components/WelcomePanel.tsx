// components/WelcomePanel.tsx
"use client";

import { useTranslations } from "next-intl";
import { Logo } from "./Logo";

interface WelcomePanelProps {
  type?: "login" | "register";
}

export function WelcomePanel({ type = "login" }: WelcomePanelProps) {
  const t = useTranslations(
    type === "register" ? "welcomeRegister" : "welcome",
  );
  return (
    <div className="relative h-full w-full bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-12 text-white overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Wavy lines and circles */}
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full border border-white/20" />
        <div className="absolute top-10 right-20 w-6 h-6 rounded-full bg-white/30" />
        <div className="absolute bottom-32 left-20 w-4 h-4 rounded-full bg-white/20" />
        <div className="absolute top-1/2 right-10 w-20 h-20 rounded-full border border-white/20" />

        {/* Wavy path decorations */}
        <svg
          className="absolute inset-0 w-full h-full opacity-30"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,200 Q150,100 300,200 T600,200"
            fill="none"
            stroke="white"
            strokeWidth="2"
            opacity="0.3"
          />
          <path
            d="M0,300 Q150,400 300,300 T600,300"
            fill="none"
            stroke="white"
            strokeWidth="2"
            opacity="0.3"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-24">
          <Logo size="md" src="/logo.png" alt="Taleb.tn Logo" />
          <span className="text-lg font-bold uppercase tracking-widest opacity-100">
            {t("companyName")}
          </span>
        </div>

        <div className="space-y-4">
          <p className="text-sm opacity-90">{t("greeting")}</p>
          <h1 className="text-5xl font-bold tracking-tight">{t("title")}</h1>
          <div className="w-12 h-1 bg-white rounded-full" />
          <p className="text-sm leading-relaxed opacity-80 max-w-md pt-4">
            {t("description")}
          </p>
        </div>
      </div>
    </div>
  );
}
