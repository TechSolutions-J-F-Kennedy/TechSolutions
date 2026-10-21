import dotenv from 'dotenv';
import path from 'path';
import mysql from 'mysql2/promise';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const cfg = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  ssl: { rejectUnauthorized: false }
};

console.log('DB config:', { host: cfg.host, port: cfg.port, database: cfg.database });

const conn = await mysql.createConnection(cfg);
const [tables] = await conn.execute('SHOW TABLES');
console.log('Tables found:', tables.map(t => Object.values(t)[0]));

try {
  const [columns] = await conn.execute('SHOW COLUMNS FROM `Productos_stock`');
  console.log('Productos_stock columns:', columns.map(c => c.Field));
} catch (e) {
  console.log('Productos_stock missing:', e.code || e.message);
}

await conn.end();
