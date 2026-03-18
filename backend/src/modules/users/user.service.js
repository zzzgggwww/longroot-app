/**
 * 模块说明：用户服务：负责用户参数校验、密码散列、角色状态更新等逻辑。
 */
import bcrypt from 'bcryptjs';
import { query } from '../../db/pool.js';
import { httpError } from '../../utils/http-error.js';

const ROLE_SET = new Set(['admin', 'user']);

// 对外返回用户数据时，剥离密码哈希等敏感字段。
function sanitizeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    status: Number(row.status),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function normalizeRole(role, fallback) {
  const value = String(role ?? fallback ?? '').trim().toLowerCase();
  if (!ROLE_SET.has(value)) {
    throw httpError(400, 'role 仅支持 admin/user');
  }
  return value;
}

function normalizeStatus(status, fallback) {
  const value = Number(status ?? fallback);
  if (![0, 1].includes(value)) {
    throw httpError(400, 'status 仅支持 0/1');
  }
  return value;
}

function normalizeUsername(username) {
  const value = String(username || '').trim();
  if (!value) throw httpError(400, 'username 必填');
  if (value.length < 3 || value.length > 64) {
    throw httpError(400, 'username 长度需在 3-64 之间');
  }
  return value;
}

function ensurePassword(password) {
  const value = String(password || '');
  if (value.length < 6) {
    throw httpError(400, 'password 长度至少 6 位');
  }
  return value;
}

export async function listUsers() {
  const rows = await query(
    `SELECT id, username, role, status, created_at, updated_at
     FROM users
     ORDER BY id DESC`
  );
  return rows.map(sanitizeUser);
}

export async function getUserById(id) {
  const rows = await query(
    `SELECT id, username, role, status, created_at, updated_at
     FROM users
     WHERE id = :id LIMIT 1`,
    { id }
  );
  const user = sanitizeUser(rows[0]);
  if (!user) throw httpError(404, '用户不存在');
  return user;
}

export async function createUser(payload) {
  const username = normalizeUsername(payload.username);
  const password = ensurePassword(payload.password);
  const role = normalizeRole(payload.role, 'user');
  const status = normalizeStatus(payload.status, 1);

  const existed = await query('SELECT id FROM users WHERE username = :username LIMIT 1', { username });
  if (existed.length) throw httpError(409, '用户名已存在');

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await query(
    `INSERT INTO users (username, password_hash, role, status)
     VALUES (:username, :passwordHash, :role, :status)`,
    { username, passwordHash, role, status }
  );

  return getUserById(result.insertId);
}

export async function updateUser(id, payload, operator = {}) {
  const current = await getUserById(id);
  const role = payload.role === undefined ? current.role : normalizeRole(payload.role, current.role);
  const status = payload.status === undefined ? Number(current.status) : normalizeStatus(payload.status, current.status);

  if (current.username === operator.username && role !== 'admin') {
    throw httpError(400, '不能取消当前管理员自己的 admin 角色');
  }
  if (current.username === operator.username && status !== 1) {
    throw httpError(400, '不能停用当前登录用户');
  }

  await query(
    `UPDATE users
     SET role = :role,
         status = :status
     WHERE id = :id`,
    { id, role, status }
  );

  return getUserById(id);
}

export async function updateUserPassword(id, payload, operator = {}) {
  const current = await getUserById(id);
  const password = ensurePassword(payload.password);

  if (payload.oldPassword !== undefined && current.username === operator.username) {
    const authRows = await query(
      'SELECT password_hash FROM users WHERE id = :id LIMIT 1',
      { id }
    );
    const ok = await bcrypt.compare(String(payload.oldPassword || ''), authRows[0]?.password_hash || '');
    if (!ok) throw httpError(400, '旧密码不正确');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await query(
    'UPDATE users SET password_hash = :passwordHash WHERE id = :id',
    { id, passwordHash }
  );

  return { success: true };
}
