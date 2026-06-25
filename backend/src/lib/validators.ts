import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  phone: z.string().min(7).max(20).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const CreateProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().default(''),
  price: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  images: z.array(z.string().url()).min(1),
  category: z.enum(['suits', 'shirts', 'trousers', 'outerwear', 'accessories']),
  sizes: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  fit: z.enum(['oversized', 'tailored', 'classic', 'slim']).optional(),
  inStock: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  details: z.string().default(''),
  care: z.string().default(''),
  sku: z.string().optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['received', 'processing', 'in_transit', 'delivered', 'cancelled']),
  note: z.string().max(500).optional(),
});

export const AssignRiderSchema = z.object({
  riderId: z.string(),
  riderName: z.string(),
});

export const CreateReturnSchema = z.object({
  orderId: z.string(),
  reason: z.enum(['damaged', 'wrong_size', 'not_as_described', 'changed_mind', 'other']),
  description: z.string().max(2000).optional(),
  images: z.array(z.string().url()).default([]),
});

export const ApproveReturnSchema = z.object({
  note: z.string().max(500).optional(),
});

export const RejectReturnSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const CreateRiderSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  address: z.string().min(1),
  vehicleType: z.enum(['bike', 'car', 'van']),
  plateNumber: z.string().min(1),
  bank: z.object({
    bankName: z.string(),
    accountNumber: z.string().min(10),
    accountName: z.string(),
  }),
});

export const CreateDeliveryZoneSchema = z.object({
  state: z.string().min(2),
  fee: z.number().min(0),
  etaDays: z.number().int().min(1).max(14),
});

export const UpdateHomepageSchema = z.object({
  heroImage: z.string().url().optional(),
  heroHeadline: z.string().min(1).optional(),
  heroTagline: z.string().optional(),
  featuredProductIds: z.array(z.number().int()).optional(),
  lookbookImageIds: z.array(z.string()).optional(),
});

export const UpdateMembershipTierSchema = z.object({
  tier: z.enum(['Standard', 'Deluxe', 'Elite']),
  price: z.number().min(0),
  billingCycles: z.array(z.enum(['monthly', 'quarterly', 'yearly'])),
  features: z.array(z.object({ label: z.string(), included: z.boolean() })),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type CreateRiderInput = z.infer<typeof CreateRiderSchema>;
