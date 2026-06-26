import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const cifVerifySchema = z.object({
  cifKey: z.string().trim().min(1, "CIF key is required").max(80),
  branchCode: z.string().trim().min(1, "Please select a branch")
});

export type CifVerifyInput = z.infer<typeof cifVerifySchema>;

export const registrationSchema = z.object({
  cifKey: z.string().trim().min(1).max(80),
  fullName: z.string().trim().min(3).max(120),
  memberNumber: z.string().trim().min(3).max(40).toUpperCase(),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(30),
  password: z.string().min(10).max(128)
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegistrationInput = z.infer<typeof registrationSchema>;

export const registerSchema = z
  .object({
    full_name: z.string().min(2, "Full name must be at least 2 characters"),
    member_number: z.string().min(3, "Enter your BMPC member number"),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirm_password: z.string()
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"]
  });

export type RegisterInput = z.infer<typeof registerSchema>;
