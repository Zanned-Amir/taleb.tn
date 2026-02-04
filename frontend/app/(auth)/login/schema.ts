import { z } from "zod";

export const loginSchema = (t: any) =>
  z.object({
    email: z.email({ message: t("errors.invalidEmail") }),
    password: z.string().min(1, { message: t("errors.passwordRequired") }),
    keepSignedIn: z.boolean().optional(),
  });

export type LoginFormData = z.infer<ReturnType<typeof loginSchema>>;
