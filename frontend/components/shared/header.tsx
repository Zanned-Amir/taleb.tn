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
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b-2 border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand - Always on the left */}
          <div className="flex items-center gap-3 border-2 border-blue-600 rounded-lg px-4 py-2">
            <Logo size="sm" src="/logo.png" alt="Taleb.tn" />
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Taleb
            </Link>
          </div>

          {/* Navigation Links - Centered */}
          <div className="hidden md:flex items-center gap-10 absolute left-1/2 transform -translate-x-1/2">
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

          {/* Auth Links - Always on the right */}
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
