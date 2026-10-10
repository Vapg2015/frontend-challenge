/**
 * Validation Schemas using Zod
 * All form validation schemas for the application
 */

import { z } from 'zod';

// ============================================
// Common Validation Rules
// ============================================

export const emailSchema = z.string().min(1, 'Informe o e-mail').email('E-mail inválido');

export const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter ao menos 8 caracteres')
  .max(128, 'A senha é muito longa')
  .regex(/[A-Z]/, 'A senha deve ter ao menos uma letra maiúscula')
  .regex(/[a-z]/, 'A senha deve ter ao menos uma letra minúscula')
  .regex(/[0-9]/, 'A senha deve ter ao menos um número')
  .regex(/[^A-Za-z0-9]/, 'A senha deve ter ao menos um caractere especial');

export const nameSchema = z.string().min(2, 'Informe ao menos 2 caracteres').max(100, 'Nome muito longo');

export const usernameSchema = z
  .string()
  .min(1, 'Informe o nome de usuário')
  .regex(/^[a-zA-Z0-9_]{3,30}$/, 'Use de 3 a 30 letras, números ou _');

export const ensLabelSchema = z
  .string()
  .min(1, 'Informe o nome ENS')
  .regex(/^[a-zA-Z0-9-]{3,63}$/, 'Use de 3 a 63 letras, números ou hífen');

export const ensDomainSchema = z.enum(['.eth']);

export const walletProviderSchema = z.enum(['metamask', 'walletconnect', 'coinbase'], {
  errorMap: () => ({ message: 'Selecione uma carteira' }),
});

export const referralCodeSchema = z
  .string()
  .min(1, 'Informe o código de indicação')
  .regex(/^[A-Za-z0-9-]{3,20}$/, 'Use de 3 a 20 letras, números ou hífen');

/** Optional "ENS or secondary wallet" field: empty, a 0x address or a .eth name */
export const linkedAddressSchema = z
  .string()
  .optional()
  .refine(
    (v) => !v || /^0x[a-fA-F0-9]{40}$/.test(v) || /^[a-zA-Z0-9-]{3,63}\.eth$/.test(v),
    'Informe um endereço 0x ou um nome .eth válido'
  );

export const ethAddressSchema = z.string().min(1, 'Informe o endereço da carteira').regex(/^0x[a-fA-F0-9]{40}$/, 'Endereço Ethereum inválido');

export const ethAmountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,18})?$/, 'Valor em ETH inválido')
  .refine((val) => parseFloat(val) > 0, 'O valor deve ser maior que 0');

export const positiveIntegerSchema = z.coerce.number().int().positive('Deve ser um inteiro positivo');

export const nonNegativeIntegerSchema = z.coerce.number().int().min(0, 'Deve ser um inteiro não negativo');

// ============================================
// Auth Schemas
// ============================================

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Confirme a senha'),
  /** Username typed on the sign-up modal; also used as the initial display name */
  name: usernameSchema,
  terms: z.boolean().refine((val) => val === true, 'Você precisa aceitar os termos e condições'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe a senha'),
  rememberMe: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual'),
  newPassword: passwordSchema,
  confirmNewPassword: z.string().min(1, 'Confirme a nova senha'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'As senhas não conferem',
  path: ['confirmNewPassword'],
});

export const updateProfileSchema = z.object({
  name: nameSchema,
  username: usernameSchema,
  ensName: ensLabelSchema,
  ensDomain: ensDomainSchema,
  walletAlias: z.string().min(1, 'Informe o apelido da carteira').max(50, 'Apelido muito longo'),
  avatarUrl: z.string().url('URL inválida').optional().or(z.literal('')),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// ============================================
// Cart Schemas
// ============================================

export const addToCartSchema = z.object({
  nftId: z.string().min(1, 'NFT ID is required'),
  quantity: positiveIntegerSchema,
});

export const updateCartItemSchema = z.object({
  quantity: nonNegativeIntegerSchema,
});

export const applyCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required').max(50, 'Coupon code is too long').toUpperCase(),
});

// ============================================
// Checkout Schemas
// ============================================

export const collectorInfoSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  address: z.string().max(500, 'Endereço muito longo').optional(),
  username: usernameSchema.optional(),
  profileName: nameSchema.optional(),
  referralCode: referralCodeSchema.optional(),
  ensName: ensLabelSchema.optional(),
  ensDomain: ensDomainSchema.optional(),
  linkedAddress: linkedAddressSchema,
  walletProvider: walletProviderSchema.optional(),
  notes: z.string().max(500, 'A observação deve ter no máximo 500 caracteres').optional(),
});

/** Strict version used by the checkout form (all asterisked fields are required) */
export const checkoutCollectorSchema = z.object({
  name: nameSchema,
  username: usernameSchema,
  profileName: nameSchema,
  email: emailSchema,
  referralCode: referralCodeSchema,
  ensName: ensLabelSchema,
  ensDomain: ensDomainSchema,
  linkedAddress: linkedAddressSchema,
  walletProvider: walletProviderSchema,
  notes: z.string().max(500, 'A observação deve ter no máximo 500 caracteres').optional(),
});

export const walletSelectionSchema = z.object({
  walletId: z.string().min(1, 'Please select a wallet'),
  network: z.enum(['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'], {
    errorMap: () => ({ message: 'Please select a network' }),
  }),
  termsAccepted: z.boolean().refine((val) => val === true, 'You must accept the terms and conditions'),
});

export const checkoutSchema = z.object({
  collectorInfo: collectorInfoSchema,
  wallet: walletSelectionSchema,
});

// ============================================
// Wallet Schemas
// ============================================

const walletMetadataShape = {
  displayName: nameSchema,
  profileName: nameSchema,
  email: emailSchema,
  provider: walletProviderSchema,
  referralCode: referralCodeSchema,
  ensName: ensLabelSchema,
  ensDomain: ensDomainSchema,
  linkedAddress: linkedAddressSchema,
};

const walletNicknameSchema = z.string().min(1, 'Informe o apelido da carteira').max(50, 'Apelido muito longo');

export const addWalletSchema = z.object({
  type: z.enum(['primary', 'secondary']),
  address: ethAddressSchema,
  network: z.enum(['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'], {
    errorMap: () => ({ message: 'Selecione uma rede' }),
  }),
  chainId: z.number().int().positive(),
  name: walletNicknameSchema,
  ...walletMetadataShape,
});

export const updateWalletSchema = addWalletSchema.extend({
  isConnected: z.boolean().optional(),
});

// ============================================
// NFT Search/Filter Schemas
// ============================================

export const nftFilterSchema = z.object({
  search: z.string().optional(),
  collectionId: z.string().optional(),
  creatorId: z.string().optional(),
  ownerId: z.string().optional(),
  minPrice: ethAmountSchema.optional(),
  maxPrice: ethAmountSchema.optional(),
  status: z.enum(['available', 'reserved', 'sold', 'hidden']).optional(),
  properties: z.record(z.array(z.string())).optional(),
  sortBy: z.enum(['price', 'createdAt', 'name', 'popularity']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export const nftDetailParamsSchema = z.object({
  id: z.string().min(1, 'NFT ID is required'),
});

// ============================================
// Order Schemas
// ============================================

export const createOrderSchema = z.object({
  idempotencyKey: z.string().min(1, 'Idempotency key is required'),
  quoteId: z.string().min(1, 'Quote ID is required'),
  walletAddress: ethAddressSchema,
  network: z.enum(['ethereum', 'polygon', 'arbitrum', 'optimism', 'base']),
  collectorInfo: collectorInfoSchema,
});

// ============================================
// Type Exports
// ============================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;

export type CollectorInfoInput = z.infer<typeof collectorInfoSchema>;
export type CheckoutCollectorInput = z.infer<typeof checkoutCollectorSchema>;
export type WalletSelectionInput = z.infer<typeof walletSelectionSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export type AddWalletInput = z.infer<typeof addWalletSchema>;
export type UpdateWalletInput = z.infer<typeof updateWalletSchema>;

export type NFTFilterInput = z.infer<typeof nftFilterSchema>;
export type NFTDetailParamsInput = z.infer<typeof nftDetailParamsSchema>;

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// ============================================
// Validation Helpers
// ============================================

export const validateSchema = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string> } => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  }
  return { success: false, errors };
};

export const getFieldError = (errors: Record<string, string>, field: string): string | undefined => {
  return errors[field];
};

export const hasFieldError = (errors: Record<string, string>, field: string): boolean => {
  return !!errors[field];
};