import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../db/pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(__dirname, '../../sql/001_init.sql');

const sql = await fs.readFile(sqlPath, 'utf8');
const connection = await pool.getConnection();

try {
  await connection.query(sql);
  console.log(`Database initialized from ${sqlPath}`);
} finally {
  connection.release();
  await pool.end();
}
