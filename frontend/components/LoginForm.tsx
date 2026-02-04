// components/LoginForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { loginSchema, type LoginFormData } from "@/app/(auth)/login/schema";
import { useState } from "react";
import Link from "next/link";

export function LoginForm() {
  const t = useTranslations("login");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema(t)),
    defaultValues: {
      email: "",
      password: "",
      keepSignedIn: false,
    },
  });

  const keepSignedIn = watch("keepSignedIn");

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // TODO: Call your login API endpoint
      console.log("Login form data:", data);
      // const response = await fetch("/api/auth/login", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(data),
      // });
    } catch (error) {
      console.error("Login error:", error);
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
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              {...register("keepSignedIn")}
              className="w-5 h-5 accent-blue-600 cursor-pointer rounded border-2 border-gray-300 hover:border-blue-500 transition-colors"
            />
            <span className="text-gray-600 group-hover:text-blue-600 transition-colors font-medium">
              {t("keepSignedIn")}
            </span>
          </label>
          <Link
            href="/verify-otp?type=password-reset"
            className="text-blue-500 hover:text-blue-700 hover:underline transition"
          >
            {t("forgotPassword")}
          </Link>
        </div>

        <Button
          fullWidth
          size="lg"
          className="mt-6 rounded-full uppercase tracking-wide "
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? t("loading") : t("submitButton")}
        </Button>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-gray-600 pt-2">
          {t("noAccount")}{" "}
          <Link
            href="/register"
            className="text-blue-600 font-semibold hover:underline"
          >
            {t("signupLink")}
          </Link>
        </p>
      </form>
    </div>
  );
}
