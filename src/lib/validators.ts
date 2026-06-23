import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  name: z.string().min(2, "Name must be at least 2 characters long"),
  restaurantName: z.string().min(2, "Restaurant name must be at least 2 characters long"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "New password must be at least 8 characters long"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const updateRestaurantSchema = z.object({
  name: z.string().min(2, "Restaurant name must be at least 2 characters").max(100),
  address: z.string().max(300, "Address too long").optional().nullable(),
  gstNumber: z
    .string()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      "Invalid GST number format (e.g. 29ABCDE1234F1Z5)"
    )
    .optional()
    .nullable()
    .or(z.literal("")),
  taxRate: z.number().min(0, "Tax rate cannot be negative").max(100, "Tax rate cannot exceed 100%"),
  currency: z.string().min(1).max(10).default("INR"),
  logo: z.string().url("Invalid logo URL").optional().nullable(),
});

export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;

// ─── Category Schemas ────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(80, "Name too long"),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// ─── Menu Item Schemas ───────────────────────────────────────────────────────

export const createMenuItemSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  name: z.string().min(1, "Item name is required").max(120, "Name too long"),
  description: z.string().max(500, "Description too long").optional().nullable(),
  price: z.number()
    .min(0, "Price cannot be negative")
    .max(99999, "Price seems too high"),
  image: z.string().url("Invalid image URL").optional().nullable(),
  isAvailable: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateMenuItemSchema = createMenuItemSchema.partial().omit({ categoryId: true }).extend({
  categoryId: z.string().min(1).optional(),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
