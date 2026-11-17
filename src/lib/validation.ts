import { z } from "zod";

const email = z
  .string()
  .trim()
  .min(3)
  .max(200)
  .email("Enter a valid email address")
  .transform((value) => value.toLowerCase());

const password = z.string().min(8, "Password must be at least 8 characters").max(100);

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(100),
  email,
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10),
    password,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "Enter the recipient's full name").max(120),
  email,
  phone: z.string().trim().min(7, "Enter a valid phone number").max(30),
  line1: z.string().trim().min(3, "Enter a street address").max(200),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Enter a city").max(100),
  state: z.string().trim().min(2, "Enter a state").max(100),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
  country: z.string().trim().min(2).max(100).default("Nigeria"),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const addressSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().trim().min(2, "Enter a full name").max(120),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(30),
  line1: z.string().trim().min(3, "Enter a street address").max(200),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Enter a city").max(100),
  state: z.string().trim().min(2, "Enter a state").max(100),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
  country: z.string().trim().min(2).max(100).default("Nigeria"),
  isDefault: z.string().optional(),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(100),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: password,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1, "Choose a rating").max(5),
  title: z.string().trim().max(90).optional().or(z.literal("")),
  body: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(2000),
});

export const newsletterSchema = z.object({
  email,
  name: z.string().trim().max(100).optional().or(z.literal("")),
  source: z.string().max(50).optional(),
});

const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("false"), z.boolean(), z.undefined(), z.null()])
  .transform((value) => value === "on" || value === "true" || value === true);

const optionalNumber = z
  .union([z.string(), z.number(), z.undefined(), z.null()])
  .transform((value) => {
    if (value === undefined || value === null || value === "") return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  });

export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Enter a product name").max(160),
  slug: z.string().trim().max(180).optional().or(z.literal("")),
  sku: z.string().trim().max(60).optional().or(z.literal("")),
  categoryId: z.string().min(1, "Choose a category"),
  shortDescription: z.string().trim().min(10, "Add a short description").max(240),
  description: z.string().trim().min(20, "Add a full description").max(10000),
  price: z.coerce.number().min(0, "Enter a price").max(100000000),
  compareAtPrice: optionalNumber,
  stock: z.coerce.number().int().min(0).max(1000000),
  lowStockThreshold: z.coerce.number().int().min(0).max(100000).default(5),
  brand: z.string().trim().max(100).optional().or(z.literal("")),
  tags: z.string().trim().max(500).optional().or(z.literal("")),
  images: z.string().trim().max(5000).optional().or(z.literal("")),
  isActive: checkbox,
  isFeatured: checkbox,
});

export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Enter a category name").max(100),
  slug: z.string().trim().max(120).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  image: z.string().trim().max(1000).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const settingsSchema = z.object({
  storeName: z.string().trim().min(2).max(80),
  tagline: z.string().trim().max(160),
  announcement: z.string().trim().max(200),
  currency: z.enum(["NGN", "USD", "GHS", "ZAR", "KES"]),
  shippingFlat: z.coerce.number().min(0).max(100000000),
  freeShippingThreshold: z.coerce.number().min(0).max(1000000000),
  taxRate: z.coerce.number().min(0).max(1),
  supportEmail: email,
  supportPhone: z.string().trim().max(40),
  address: z.string().trim().max(300),
  instagram: z.string().trim().max(300).optional().or(z.literal("")),
  tiktok: z.string().trim().max(300).optional().or(z.literal("")),
  x: z.string().trim().max(300).optional().or(z.literal("")),
  facebook: z.string().trim().max(300).optional().or(z.literal("")),
  youtube: z.string().trim().max(300).optional().or(z.literal("")),
  lowStockThreshold: z.coerce.number().int().min(0).max(10000),
  abandonedCartHours: z.coerce.number().int().min(1).max(720),
  abandonedCartMaxReminders: z.coerce.number().int().min(1).max(10),
});

export function fieldErrors(error: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}
