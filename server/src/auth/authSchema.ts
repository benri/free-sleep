import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(6).max(128),
});

export const CreateUserSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(6).max(128),
  role: z.string().default('admin'),
});
