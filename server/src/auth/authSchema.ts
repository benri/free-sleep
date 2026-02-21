import { z } from 'zod';

export const ROLES = ['admin', 'user'] as const;
export type Role = (typeof ROLES)[number];

export const LoginSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(6).max(128),
});

export const CreateUserSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(6).max(128),
  role: z.enum(ROLES).default('user'),
});

export const UpdateUserSchema = z.object({
  password: z.string().min(6).max(128).optional(),
  role: z.enum(ROLES).optional(),
}).refine(data => data.password || data.role, {
  message: 'At least one of password or role must be provided',
});
