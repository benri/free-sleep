import express, { Request, Response } from 'express';
import { authenticate, createUser, listUsers, deleteUser } from '../../auth/authService.js';
import { LoginSchema, CreateUserSchema } from '../../auth/authSchema.js';
import logger from '../../logger.js';

const router = express.Router();

router.post('/login', async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.errors });
    return;
  }

  const result = await authenticate(parsed.data.username, parsed.data.password);
  if (!result) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  res.json(result);
});

router.get('/users', async (_req: Request, res: Response) => {
  const users = await listUsers();
  res.json(users);
});

router.post('/users', async (req: Request, res: Response) => {
  const parsed = CreateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.errors });
    return;
  }

  try {
    const user = await createUser(parsed.data.username, parsed.data.password, parsed.data.role);
    res.status(201).json(user);
  } catch (err: unknown) {
    const prismaError = err as { code?: string };
    if (prismaError.code === 'P2002') {
      res.status(409).json({ error: 'Username already exists' });
      return;
    }
    logger.error('Failed to create user:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.delete('/users/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid user ID' });
    return;
  }

  try {
    await deleteUser(id);
    res.status(204).send();
  } catch (err: unknown) {
    const prismaError = err as { code?: string };
    if (prismaError.code === 'P2025') {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    logger.error('Failed to delete user:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
