import { z } from "zod";

export const RoleSchema = z.object({
    serverId: z
        .number()
        .int()
        .positive()
        .nonnegative()
        .min(1, { message: "Server ID must be a positive number" })
        .refine(val => val > 0, { message: "Server ID must be a positive number" }),

    name: z
        .string()
        .min(3, { message: "Role name must be at least 3 characters long" })
        .max(100, { message: "Role name can be at most 100 characters long" })
        .nonempty({ message: "Role name is required" }),

    color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, { message: "Color must be a valid hex color (e.g., #FF5733)" })
        .nonempty({ message: "Color is required" })
});

export const RoleUpdateSchema = z.object({
    name: z
        .string()
        .min(3, { message: "Role name must be at least 3 characters long" })
        .max(100, { message: "Role name can be at most 100 characters long" })
        .optional(),

    color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, { message: "Color must be a valid hex color (e.g., #FF5733)" })
        .optional()
});
