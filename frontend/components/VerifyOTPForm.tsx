"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { OTPInput } from "@/components/OTPInput";
import { useState, useEffect } from "react";

import type { OTPVerificationType } from "@/app/(auth)/verify-otp/page";
import { OTPStepData, otpStepSchema } from "../app/(auth)/verify-otp/schema";

interface VerifyOTPFormProps {
  type: OTPVerificationType;
  initialEmail?: string;
}

export function VerifyOTPForm({ type, initialEmail = "" }: VerifyOTPFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(!!initialEmail);
  const [countdown, setCountdown] = useState(0);
  const RESEND_COOLDOWN = 60; // 60 seconds

  // Timer effect for countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  // Single form instance with dynamic schema based on step
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    trigger,
    setValue,
    setFocus,
  } = useForm<OTPStepData>({
    resolver: zodResolver(otpStepSchema(t)),
    mode: "onBlur",
    defaultValues: {
      email: initialEmail,
      otp: "",
    },
  });

  const emailValue = watch("email");
  const otpValue = watch("otp");

  // Determine if we're on the OTP step
  const isOTPStep = emailSubmitted;

  const getTitleKey = () => {
    switch (type) {
      case "email-verification":
        return "verifyOTP.emailVerification.title";
      case "password-reset":
        return "verifyOTP.passwordReset.title";
      case "m2fa":
        return "verifyOTP.m2fa.title";
      default:
        return "verifyOTP.title";
    }
  };

  const getSubtitleKey = () => {
    switch (type) {
      case "email-verification":
        return "verifyOTP.emailVerification.subtitle";
      case "password-reset":
        return "verifyOTP.passwordReset.subtitle";
      case "m2fa":
        return "verifyOTP.m2fa.subtitle";
      default:
        return "verifyOTP.subtitle";
    }
  };

  // Handle email submission and move to OTP step
  const handleEmailNext = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
    }
    // Validate email field only
    const isEmailValid = await trigger("email");

    if (!isEmailValid) {
      return;
    }

    // TODO: Add API call to send OTP here
    // await sendOTPAPI(emailValue, type);

    // Move to OTP step
    setEmailSubmitted(true);
    setCountdown(RESEND_COOLDOWN); // Start countdown
    // Move to OTP step by focusing the OTP input
    setTimeout(() => {
      setFocus("otp");
    }, 100);
  };

  // Handle OTP verification
  const onOTPSubmit = async (data: OTPStepData) => {};

  // Handle resend OTP
  const handleResendOTP = async () => {
    // TODO: Add API call to resend OTP here
    // await sendOTPAPI(emailValue, type);

    console.log("Resending OTP to:", emailValue);
    setCountdown(RESEND_COOLDOWN); // Reset countdown
  };

  // Handle changing email (go back to email step)
  const handleChangeEmail = () => {
    setValue("otp", ""); // Clear OTP field
    setEmailSubmitted(false); // Go back to email step
    setTimeout(() => {
      setFocus("email"); // Focus email field
    }, 100);
  };

  return (
    <div className="w-full max-w-md px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        {t(getTitleKey())}
      </h1>
      <p className="text-black mb-8">{t(getSubtitleKey())}</p>

      <form onSubmit={handleSubmit(onOTPSubmit)} className="space-y-6">
        {/* Email Field - Always rendered but conditionally interactive */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-black mb-2"
          >
            {t("verifyOTP.emailLabel")}
          </label>
          <Input
            id="email"
            type="email"
            placeholder={t("verifyOTP.emailPlaceholder")}
            {...register("email")}
            disabled={isOTPStep}
            aria-invalid={errors.email ? "true" : "false"}
            className={isOTPStep ? "bg-gray-50" : ""}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Server Error Display */}
        {serverError && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}

        {/* OTP Field - Only shown when on OTP step */}
        {isOTPStep && (
          <>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="otp"
                  className="block text-sm font-medium text-black"
                >
                  {t("verifyOTP.otpLabel")}
                </label>
                <button
                  type="button"
                  onClick={handleChangeEmail}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  {t("verifyOTP.changeEmail")}
                </button>
              </div>

              <p className="text-xs text-black mb-4">
                {t("verifyOTP.sentTo")} <strong>{emailValue}</strong>
              </p>

              {/* OTP Input Component */}
              <OTPInput
                value={otpValue}
                onChange={(value) => setValue("otp", value)}
                error={errors.otp?.message}
              />

              {!errors.otp && (
                <p className="text-xs mt-2" style={{ color: "#000000" }}>
                  {t("verifyOTP.otpHint")}
                </p>
              )}
            </div>
          </>
        )}

        {/* Submit Button */}
        <Button
          type={isOTPStep ? "submit" : "button"}
          onClick={!isOTPStep ? handleEmailNext : undefined}
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting
            ? isOTPStep
              ? t("verifyOTP.verifying")
              : t("verifyOTP.sending")
            : isOTPStep
              ? t("verifyOTP.verify")
              : t("verifyOTP.sendOTP")}
        </Button>

        {/* Resend OTP - Only shown on OTP step */}
        {isOTPStep && (
          <>
            <div className="text-center">
              <p className="text-sm text-black">
                {t("verifyOTP.didNotReceive")}{" "}
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isSubmitting || countdown > 0}
                  className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {countdown > 0
                    ? `${t("verifyOTP.resendOTP")} (${countdown}s)`
                    : t("verifyOTP.resendOTP")}
                </button>
              </p>
            </div>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-black">
                {t("verifyOTP.backToLogin")}{" "}
                <a
                  href="/login"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {t("verifyOTP.loginLink")}
                </a>
              </p>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
