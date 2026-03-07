import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

// Store the database in the user's home directory so it persists between sessions
const DB_DIR = path.join(os.homedir(), ".sqlite-memory-agent");
const DB_PATH = path.join(DB_DIR, "memory.db");

// Ensure the directory exists
if (!fs.existsSync(DB_DIR)) {
	fs.mkdirSync(DB_DIR, { recursive: true });
}

let _db: DatabaseSync | null = null;

export const getDb = (): DatabaseSync => {
	if (_db) return _db;

	_db = new DatabaseSync(DB_PATH);

	// Enable WAL mode for better concurrency
	_db.exec("PRAGMA journal_mode = WAL;");

	// Create tasks table
	_db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT CHECK(priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
      status TEXT CHECK(status IN ('todo', 'in_progress', 'done')) DEFAULT 'todo',
      due_date TEXT,
      tags TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

	return _db;
};

export type TaskRow = {
	id: number;
	title: string;
	description: string | null;
	priority: "low" | "medium" | "high";
	status: "todo" | "in_progress" | "done";
	due_date: string | null;
	tags: string | null;
	created_at: string;
	updated_at: string;
};

export { DB_PATH };
