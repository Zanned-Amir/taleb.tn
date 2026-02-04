import { z } from "zod";

export const registerSchema = (t: any) =>
  z
    .object({
      username: z
        .string()
        .nonempty({ message: t("errors.usernameRequired") })
        .min(3, { message: t("errors.usernameMinLength") })
        .max(20, { message: t("errors.usernameMaxLength") }),
      email: z
        .string()
        .nonempty({ message: t("errors.emailRequired") })
        .email({ message: t("errors.invalidEmail") }),
      password: z
        .string()
        .nonempty({ message: t("errors.passwordRequired") })
        .min(8, { message: t("errors.passwordMinLength") }),
      confirmPassword: z
        .string()
        .nonempty({ message: t("errors.confirmPasswordRequired") }),
      acceptTerms: z.boolean().refine((val) => val === true, {
        message: t("errors.acceptTermsRequired"),
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("errors.passwordMismatch"),
      path: ["confirmPassword"],
    });

export type RegisterFormData = z.infer<ReturnType<typeof registerSchema>>;
