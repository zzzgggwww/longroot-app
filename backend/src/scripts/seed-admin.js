import { ensureAdminSeedUser } from '../modules/auth/auth.service.js';
import { pool } from '../db/pool.js';

try {
  const result = await ensureAdminSeedUser();
  console.log(result);
} finally {
  await pool.end();
}
