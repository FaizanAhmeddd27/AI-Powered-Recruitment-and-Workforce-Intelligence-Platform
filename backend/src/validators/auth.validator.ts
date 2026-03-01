import { z } from "zod";


export const signupSchema = z
  .object({
    email: z
      .string({ message: "Email is required" })
      .min(1, "Email is required")
      .email("Invalid email format")
      .max(255, "Email too long")
      .transform((val) => val.toLowerCase().trim()),

    password: z
      .string({ message: "Password is required" })
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password too long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
        "Password must contain at least one special character"
      ),

    confirmPassword: z.string({ message: "Confirm password is required" }).min(1, "Confirm password is required"),

    full_name: z
      .string({ message: "Full name is required" })
      .min(2, "Name must be at least 2 characters")
      .max(255, "Name too long")
      .trim(),

    role: z.enum(["candidate", "recruiter", "admin"], {
      message: "Role must be candidate, recruiter, or admin",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .min(1, "Email is required")
    .email("Invalid email format")
    .transform((val) => val.toLowerCase().trim()),

  password: z
    .string({ message: "Password is required" })
    .min(1, "Password is required"),
});


export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ message: "Refresh token is required" })
    .min(1, "Refresh token is required"),
});


export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ message: "Current password is required" })
      .min(1, "Current password is required"),

    newPassword: z
      .string({ message: "New password is required" })
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain uppercase letter")
      .regex(/[a-z]/, "Must contain lowercase letter")
      .regex(/[0-9]/, "Must contain number")
      .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Must contain special character"),

    confirmNewPassword: z.string({ message: "Confirm password is required" }).min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });


export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;