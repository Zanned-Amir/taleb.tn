"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { VerifyOTPForm } from "@/components/VerifyOTPForm";
import { WelcomePanel } from "@/components/WelcomePanel";
import { Card } from "@/components/ui/card";

export type OTPVerificationType =
  | "email-verification"
  | "password-reset"
  | "m2fa";

export default function VerifyOTPPage() {
  const searchParams = useSearchParams();
  const t = useTranslations();

  const type = (searchParams.get("type") ||
    "email-verification") as OTPVerificationType;
  const email = searchParams.get("email");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 py-12 px-4">
      <Card className="flex w-full max-w-5xl overflow-hidden shadow-2xl">
        {/* Left Panel - Welcome Section */}
        <div className="hidden md:block md:w-1/2">
          <WelcomePanel />
        </div>

        {/* Right Panel - OTP Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center bg-white">
          <VerifyOTPForm type={type} initialEmail={email || ""} />
        </div>
      </Card>

      {/* Footer */}
      <p className="mt-6 text-sm text-gray-600">
        Powered by{" "}
        <a
          href="https://meninx.tech"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700 font-semibold transition"
        >
          Meninx
        </a>
      </p>
    </div>
  );
}
