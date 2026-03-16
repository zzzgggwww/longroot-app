import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../db/pool.js';
import { env } from '../../config/env.js';
import { httpError } from '../../utils/http-error.js';

export async function ensureAdminSeedUser() {
  const rows = await query('SELECT id FROM users WHERE username = :username LIMIT 1', {
    username: env.adminSeedUsername
  });

  if (rows.length) {
    return { created: false, username: env.adminSeedUsername };
  }

  const passwordHash = await bcrypt.hash(env.adminSeedPassword, 10);
  await query(
    `INSERT INTO users (username, password_hash, role, status)
     VALUES (:username, :passwordHash, 'admin', 1)`,
    {
      username: env.adminSeedUsername,
      passwordHash
    }
  );

  return { created: true, username: env.adminSeedUsername };
}

export async function login({ username, password }) {
  const rows = await query(
    `SELECT id, username, password_hash, role, status
     FROM users WHERE username = :username LIMIT 1`,
    { username }
  );

  const user = rows[0];
  if (!user || !user.status) {
    throw httpError(401, '用户名或密码错误');
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    throw httpError(401, '用户名或密码错误');
  }

  const token = jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  };
}
