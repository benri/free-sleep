import express, { Request, Response } from 'express';
import { authenticate, createUser, listUsers, updateUser, deleteUser } from '../../auth/authService.js';
import { LoginSchema, CreateUserSchema, UpdateUserSchema } from '../../auth/authSchema.js';
import requireRole from '../../auth/requireRole.js';
import logger from '../../logger.js';

const router = express.Router();

type AuthenticatedRequest = Request & { user?: { userId: number; username: string; role: string } };

function getRequestUserId(req: Request): number | undefined {
  return (req as AuthenticatedRequest).user?.userId;
}

router.post('/login', async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.errors });
    return;
  }

  try {
    const result = await authenticate(parsed.data.username, parsed.data.password);
    if (!result) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }
    res.json(result);
  } catch (err) {
    logger.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/users', requireRole('admin'), async (_req: Request, res: Response) => {
  try {
    const users = await listUsers();
    res.json(users);
  } catch (err) {
    logger.error('Failed to list users:', err);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

router.post('/users', requireRole('admin'), async (req: Request, res: Response) => {
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

router.patch('/users/:id', requireRole('admin'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid user ID' });
    return;
  }

  if (getRequestUserId(req) === id) {
    res.status(400).json({ error: 'Cannot modify your own account' });
    return;
  }

  const parsed = UpdateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.errors });
    return;
  }

  try {
    const user = await updateUser(id, parsed.data);
    res.json(user);
  } catch (err: unknown) {
    const prismaError = err as { code?: string };
    if (prismaError.code === 'P2025') {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    logger.error('Failed to update user:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/users/:id', requireRole('admin'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid user ID' });
    return;
  }

  if (getRequestUserId(req) === id) {
    res.status(400).json({ error: 'Cannot delete your own account' });
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
