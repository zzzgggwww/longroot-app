/**
 * 模块说明：管理员种子脚本：创建默认管理员账号，方便首次登录。
 */
import { ensureAdminSeedUser } from '../modules/auth/auth.service.js';
import { pool } from '../db/pool.js';

try {
  const result = await ensureAdminSeedUser();
  console.log(result);
} finally {
  await pool.end();
}
