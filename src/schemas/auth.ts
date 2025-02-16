import { z } from "zod";

export const SignupFormSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    loginName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    password: z.string()
        .min(6, { message: "Password must be at least 6 characters long" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/\d/, { message: "Password must contain at least one number" })
        .regex(/[!@#$%^&*(),.?":{}|<>]/, { message: "Password must contain at least one special character" }),
        password_confirmation: z.string()
        .min(6, { message: "Password must be at least 6 characters long" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/\d/, { message: "Password must contain at least one number" })
        .regex(/[!@#$%^&*(),.?":{}|<>]/, { message: "Password must contain at least one special character" }),
});


export const LoginFormSchema = z.object({
    input: z.string()
        .min(1, { message: "Input is required" })
        .refine((val) => /^[A-Za-z0-9]+$/.test(val) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
            message: "Input must be a valid email or username",
        }),
    password: z.string()
        .min(6, { message: "Password must be at least 6 characters long" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/\d/, { message: "Password must contain at least one number" })
        .regex(/[!@#$%^&*(),.?":{}|<>]/, { message: "Password must contain at least one special character" }),
});

