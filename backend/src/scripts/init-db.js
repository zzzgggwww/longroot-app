import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../db/pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(__dirname, '../../sql/001_init.sql');

const sql = await fs.readFile(sqlPath, 'utf8');
const connection = await pool.getConnection();

async function ensureColumn(tableName, columnName, definition) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS count
       FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = ?
        AND column_name = ?`,
    [tableName, columnName]
  );

  if (!rows[0]?.count) {
    await connection.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
    console.log(`Added column ${tableName}.${columnName}`);
  }
}

try {
  await connection.query(sql);
  await ensureColumn('trade_signals', 'qty', 'DECIMAL(28,12) NOT NULL DEFAULT 0 AFTER amount');
  await ensureColumn('trade_signals', 'fee', 'DECIMAL(18,8) NOT NULL DEFAULT 0 AFTER qty');
  await ensureColumn('trade_signals', 'net_amount', 'DECIMAL(18,8) NOT NULL DEFAULT 0 AFTER fee');
  await ensureColumn('positions', 'total_fees', 'DECIMAL(18,8) NOT NULL DEFAULT 0 AFTER total_realized');
  console.log(`Database initialized from ${sqlPath}`);
} finally {
  connection.release();
  await pool.end();
}
