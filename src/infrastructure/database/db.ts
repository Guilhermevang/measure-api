import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.resolve(process.cwd(), 'data.sqlite');

function createDatabase(dbPath = DB_PATH): Database.Database {
  const db = new Database(dbPath);

  // Melhora a performance e garante integridade
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  runMigrations(db);

  return db;
}

function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS measures (
      uuid         TEXT PRIMARY KEY NOT NULL,
      customer_code TEXT NOT NULL,
      type         TEXT NOT NULL CHECK (type IN ('WATER', 'GAS', 'ELECTRICITY')),
      value        INTEGER NOT NULL,
      confirmed    INTEGER NOT NULL DEFAULT 0,
      image_url    TEXT NOT NULL,
      measured_at  TEXT NOT NULL,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_measures_customer
      ON measures(customer_code);

    CREATE INDEX IF NOT EXISTS idx_measures_customer_type_month
      ON measures(customer_code, type, strftime('%Y-%m', measured_at));
  `);
}

export { createDatabase, DB_PATH };
