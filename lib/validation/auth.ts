import { z } from "zod";

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name."),
  email: z.string().trim().email("Enter a valid work email."),
  password: z.string().min(8, "Use at least 8 characters."),
  confirmPassword: z.string().min(1, "Confirm your password."),
}).refine((values) => values.password === values.confirmPassword, { path: ["confirmPassword"], message: "Passwords must match." });

export const recoverySchema = z.object({ email: z.string().trim().email("Enter a valid work email.") });
export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Use at least 8 characters."),
  confirmPassword: z.string().min(1, "Confirm your password."),
}).refine((values) => values.password === values.confirmPassword, { path: ["confirmPassword"], message: "Passwords must match." });
