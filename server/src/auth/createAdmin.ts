import { createUser } from './authService.js';

const [username, password] = process.argv.slice(2);

if (!username || !password) {
  // eslint-disable-next-line no-console
  console.error('Usage: createAdmin <username> <password>');
  process.exit(1);
}

if (password.length < 6) {
  // eslint-disable-next-line no-console
  console.error('Password must be at least 6 characters');
  process.exit(1);
}

try {
  const user = await createUser(username, password, 'admin');
  // eslint-disable-next-line no-console
  console.log(`Admin user created: ${user.username} (id: ${user.id})`);
} catch (err: unknown) {
  const prismaError = err as { code?: string };
  if (prismaError.code === 'P2002') {
    // eslint-disable-next-line no-console
    console.error(`User "${username}" already exists`);
    process.exit(1);
  }
  throw err;
}
