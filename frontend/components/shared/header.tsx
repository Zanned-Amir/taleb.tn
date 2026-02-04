"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/Logo";

interface HeaderProps {
  hideAuthLinks?: boolean;
}

export function Header({ hideAuthLinks = false }: HeaderProps) {
  const t = useTranslations("header");

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div
          className={`flex items-center h-16 ${hideAuthLinks ? "justify-center gap-12" : "justify-between"}`}
        >
          {/* Logo and Brand */}(
          <div className="flex items-center gap-3">
            <Logo size="sm" src="/logo.png" alt="Taleb.tn" />
            <Link
              href="/"
              className="text-2xl font-bold text-blue-600 border-black"
            >
              Taleb
            </Link>
          </div>
          ){/* Navigation Links */}
          <div className="hidden md:flex items-center gap-10">
            <Link
              href="/"
              className="text-base font-semibold text-gray-700 hover:text-blue-600 transition"
            >
              {t("home")}
            </Link>
            <Link
              href="/about"
              className="text-base font-semibold text-gray-700 hover:text-blue-600 transition"
            >
              {t("about")}
            </Link>
            <Link
              href="/courses"
              className="text-base font-semibold text-gray-700 hover:text-blue-600 transition"
            >
              {t("courses")}
            </Link>
            <Link
              href="/contact"
              className="text-base font-semibold text-gray-700 hover:text-blue-600 transition"
            >
              {t("contact")}
            </Link>
          </div>
          {/* Auth Links */}
          {!hideAuthLinks && (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-base font-semibold text-gray-700 hover:text-blue-600 transition"
              >
                {t("login")}
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                {t("signup")}
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
