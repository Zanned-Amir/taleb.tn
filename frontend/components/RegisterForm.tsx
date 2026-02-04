// components/RegisterForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  registerSchema,
  type RegisterFormData,
} from "@/app/(auth)/register/schema";
import { useState } from "react";
import Link from "next/link";

export function RegisterForm() {
  const t = useTranslations("register");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema(t)),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      // TODO: Call your registration API endpoint
      console.log("Register form data:", data);
      // const response = await fetch("/api/auth/register", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(data),
      // });
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (errorKey: string | undefined): string => {
    return errorKey || "";
  };

  return (
    <div className="w-full max-w-md p-12 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-blue-600">{t("title")}</h2>
        <p className="text-sm text-gray-400">{t("subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-3">
          {/* Username */}
          <div>
            <Input
              type="text"
              placeholder={t("username.placeholder")}
              className="h-12"
              {...register("username")}
              aria-invalid={errors.username ? "true" : "false"}
            />
            {errors.username && (
              <p className="text-red-500 text-xs mt-1">
                {getErrorMessage(errors.username.message)}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <Input
              type="email"
              placeholder={t("email.placeholder")}
              className="h-12"
              {...register("email")}
              aria-invalid={errors.email ? "true" : "false"}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {getErrorMessage(errors.email.message)}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <Input
              type="password"
              placeholder={t("password.placeholder")}
              className="h-12"
              {...register("password")}
              aria-invalid={errors.password ? "true" : "false"}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {getErrorMessage(errors.password.message)}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <Input
              type="password"
              placeholder={t("confirmPassword.placeholder")}
              className="h-12"
              {...register("confirmPassword")}
              aria-invalid={errors.confirmPassword ? "true" : "false"}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">
                {getErrorMessage(errors.confirmPassword.message)}
              </p>
            )}
          </div>
        </div>

        {/* Accept Terms Checkbox */}
        <div className="flex items-start gap-3 pt-2">
          <input
            type="checkbox"
            {...register("acceptTerms")}
            className="w-5 h-5 accent-blue-600 cursor-pointer rounded border-2 border-gray-300 hover:border-blue-500 transition-colors mt-0.5"
            aria-invalid={errors.acceptTerms ? "true" : "false"}
          />
          <div className="flex-1">
            <label className="text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium cursor-pointer">
              {t("acceptTerms.label")}{" "}
              <Link href="/terms" className="text-blue-600 hover:underline">
                {t("acceptTerms.terms")}
              </Link>{" "}
              {t("acceptTerms.and")}{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                {t("acceptTerms.privacy")}
              </Link>
            </label>
            {errors.acceptTerms && (
              <p className="text-red-500 text-xs mt-1">
                {getErrorMessage(errors.acceptTerms.message)}
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          fullWidth
          size="lg"
          className="mt-6 rounded-full uppercase tracking-wide"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? t("loading") : t("submitButton")}
        </Button>

        {/* Login Link */}
        <p className="text-center text-sm text-gray-600 pt-2">
          {t("haveAccount")}{" "}
          <Link
            href="/login"
            className="text-blue-600 font-semibold hover:underline"
          >
            {t("loginLink")}
          </Link>
        </p>
      </form>
    </div>
  );
}
