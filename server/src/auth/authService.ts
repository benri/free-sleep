import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const TOKEN_EXPIRY = '7d';

export async function createUser(username: string, password: string, role = 'admin') {
  const hash = await bcrypt.hash(password, 10);
  return prisma.users.create({
    data: { username, password: hash, role },
    select: { id: true, username: true, role: true, created_at: true },
  });
}

export async function authenticate(username: string, password: string) {
  const user = await prisma.users.findUnique({ where: { username } });
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return null;

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY },
  );

  return { token };
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as { userId: number; username: string; role: string };
}

export async function listUsers() {
  return prisma.users.findMany({
    select: { id: true, username: true, role: true, created_at: true },
    orderBy: { created_at: 'asc' },
  });
}

export async function deleteUser(id: number) {
  return prisma.users.delete({ where: { id } });
}
