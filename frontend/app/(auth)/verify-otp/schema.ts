// schema.ts
import { z } from "zod";

// Separate schemas for each step
export const emailStepSchema = (t: any) =>
  z.object({
    email: z.string().email({ message: t("verifyOTP.errors.invalidEmail") }),
  });

export const otpStepSchema = (t: any) =>
  z.object({
    email: z.string().email({ message: t("verifyOTP.errors.invalidEmail") }),
    otp: z
      .string()
      .length(6, { message: t("verifyOTP.errors.otpLength") })
      .regex(/^\d+$/, { message: t("verifyOTP.errors.otpNumeric") }),
  });

export type EmailStepData = z.infer<ReturnType<typeof emailStepSchema>>;
export type OTPStepData = z.infer<ReturnType<typeof otpStepSchema>>;
