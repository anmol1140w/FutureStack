import pg from 'pg';
import pgvector from 'pgvector/pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://brandguard:brandguard@localhost:5433/brandguard_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('127.0.0.1')
    ? { rejectUnauthorized: false }
    : undefined,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

export async function initDatabase() {
  const client = await pool.connect();
  try {
    // 1. Ensure the pgvector extension is created BEFORE registering types
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');

    // 2. Register pgvector types on the client (now that the type exists)
    await pgvector.registerTypes(client);
    
    // 3. Initialize schema tables
    const initSqlPath = path.join(__dirname, 'init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    await client.query(initSql);

    const v3SqlPath = path.join(__dirname, 'update_v3.sql');
    if (fs.existsSync(v3SqlPath)) {
      const v3Sql = fs.readFileSync(v3SqlPath, 'utf8');
      await client.query(v3Sql);
    }
    console.log('✅ PostgreSQL database, pgvector and Version 3 schema initialized successfully.');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

export default pool;
