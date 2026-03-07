import { tool } from "ai";
import { z } from "zod";
import { getDb, type TaskRow, DB_PATH } from "../../db/index.js";

// ── Add a new task ──────────────────────────────────────────────────────────
export const addTask = tool({
	description:
		"Add a new task to the SQLite memory. Use this when the user wants to create, add, or save a task/todo.",
	inputSchema: z.object({
		title: z.string().describe("Short, clear title for the task"),
		description: z
			.string()
			.optional()
			.describe("Optional longer description or notes"),
		priority: z
			.enum(["low", "medium", "high"])
			.optional()
			.default("medium")
			.describe("Task priority: low, medium, or high"),
		due_date: z
			.string()
			.optional()
			.describe("Optional due date in YYYY-MM-DD format"),
		tags: z
			.string()
			.optional()
			.describe('Optional comma-separated tags, e.g. "work,urgent"'),
	}),
	execute: async ({ title, description, priority, due_date, tags }) => {
		const db = getDb();
		const stmt = db.prepare(`
      INSERT INTO tasks (title, description, priority, due_date, tags)
      VALUES (?, ?, ?, ?, ?)
    `);
		const result = stmt.run(
			title,
			description ?? null,
			priority ?? "medium",
			due_date ?? null,
			tags ?? null,
		);
		return `✅ Task added (id=${result.lastInsertRowid}): "${title}" [${priority ?? "medium"}]`;
	},
});

// ── List tasks ───────────────────────────────────────────────────────────────
export const listTasks = tool({
	description:
		"List tasks from the SQLite memory. Can filter by status, priority, or tags. Use this to show the user their current tasks.",
	inputSchema: z.object({
		status: z
			.enum(["todo", "in_progress", "done", "all"])
			.optional()
			.default("all")
			.describe("Filter by status. Defaults to all."),
		priority: z
			.enum(["low", "medium", "high", "all"])
			.optional()
			.default("all")
			.describe("Filter by priority. Defaults to all."),
		tag: z
			.string()
			.optional()
			.describe('Optional tag to filter by (e.g. "work")'),
		limit: z
			.number()
			.optional()
			.default(50)
			.describe("Maximum number of tasks to return"),
	}),
	execute: async ({ status, priority, tag, limit }) => {
		const db = getDb();

		let query = "SELECT * FROM tasks WHERE 1=1";
		const params: (string | number)[] = [];

		if (status && status !== "all") {
			query += " AND status = ?";
			params.push(status);
		}
		if (priority && priority !== "all") {
			query += " AND priority = ?";
			params.push(priority);
		}
		if (tag) {
			query += " AND (tags LIKE ? OR tags LIKE ? OR tags LIKE ? OR tags = ?)";
			params.push(`%,${tag},%`, `${tag},%`, `%,${tag}`, tag);
		}

		query +=
			' ORDER BY CASE priority WHEN "high" THEN 1 WHEN "medium" THEN 2 ELSE 3 END, created_at DESC';
		query += " LIMIT ?";
		params.push(limit ?? 50);

		const rows = db.prepare(query).all(...params) as TaskRow[];

		if (rows.length === 0) {
			return "No tasks found matching your criteria.";
		}

		const statusEmoji: Record<string, string> = {
			todo: "📋",
			in_progress: "🔄",
			done: "✅",
		};
		const priorityEmoji: Record<string, string> = {
			high: "🔴",
			medium: "🟡",
			low: "🟢",
		};

		const lines = rows.map((r) => {
			const parts = [
				`[${r.id}] ${statusEmoji[r.status] ?? ""} ${priorityEmoji[r.priority] ?? ""} ${r.title}`,
			];
			if (r.description) parts.push(`     ${r.description}`);
			if (r.due_date) parts.push(`     Due: ${r.due_date}`);
			if (r.tags) parts.push(`     Tags: ${r.tags}`);
			return parts.join("\n");
		});

		return `Found ${rows.length} task(s):\n\n${lines.join("\n\n")}`;
	},
});

// ── Update task status ───────────────────────────────────────────────────────
export const updateTaskStatus = tool({
	description:
		"Update the status of a task. Use this to mark tasks as in_progress, done, or back to todo.",
	inputSchema: z.object({
		id: z.number().describe("The task ID to update"),
		status: z
			.enum(["todo", "in_progress", "done"])
			.describe("The new status for the task"),
	}),
	execute: async ({ id, status }) => {
		const db = getDb();
		const result = db
			.prepare(
				`UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ?`,
			)
			.run(status, id);

		if (result.changes === 0) {
			return `❌ No task found with id=${id}`;
		}
		const task = db.prepare("SELECT title FROM tasks WHERE id = ?").get(id) as
			| Pick<TaskRow, "title">
			| undefined;
		return `✅ Task [${id}] "${task?.title}" marked as ${status}`;
	},
});

// ── Update task details ──────────────────────────────────────────────────────
export const updateTask = tool({
	description:
		"Update task details like title, description, priority, due date, or tags.",
	inputSchema: z.object({
		id: z.number().describe("The task ID to update"),
		title: z.string().optional().describe("New title"),
		description: z.string().optional().describe("New description"),
		priority: z
			.enum(["low", "medium", "high"])
			.optional()
			.describe("New priority"),
		due_date: z
			.string()
			.optional()
			.describe("New due date in YYYY-MM-DD format"),
		tags: z.string().optional().describe("New comma-separated tags"),
	}),
	execute: async ({ id, title, description, priority, due_date, tags }) => {
		const db = getDb();

		const fields: string[] = [];
		const params: (string | number)[] = [];

		if (title !== undefined) {
			fields.push("title = ?");
			params.push(title);
		}
		if (description !== undefined) {
			fields.push("description = ?");
			params.push(description);
		}
		if (priority !== undefined) {
			fields.push("priority = ?");
			params.push(priority);
		}
		if (due_date !== undefined) {
			fields.push("due_date = ?");
			params.push(due_date);
		}
		if (tags !== undefined) {
			fields.push("tags = ?");
			params.push(tags);
		}

		if (fields.length === 0) {
			return "⚠️ No fields to update provided.";
		}

		fields.push("updated_at = datetime('now')");
		params.push(id);

		const result = db
			.prepare(`UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`)
			.run(...params);

		if (result.changes === 0) {
			return `❌ No task found with id=${id}`;
		}
		return `✅ Task [${id}] updated successfully`;
	},
});

// ── Delete a task ────────────────────────────────────────────────────────────
export const deleteTask = tool({
	description:
		"Permanently delete a task from memory. Use this only when the user explicitly wants to remove a task.",
	inputSchema: z.object({
		id: z.number().describe("The task ID to delete"),
	}),
	execute: async ({ id }) => {
		const db = getDb();
		const task = db.prepare("SELECT title FROM tasks WHERE id = ?").get(id) as
			| Pick<TaskRow, "title">
			| undefined;

		if (!task) {
			return `❌ No task found with id=${id}`;
		}

		db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
		return `🗑️ Task [${id}] "${task.title}" has been deleted`;
	},
});

// ── Search tasks ─────────────────────────────────────────────────────────────
export const searchTasks = tool({
	description:
		"Search tasks by keyword in title or description. Use this when the user wants to find specific tasks.",
	inputSchema: z.object({
		query: z.string().describe("Search keyword or phrase"),
	}),
	execute: async ({ query }) => {
		const db = getDb();
		const pattern = `%${query}%`;
		const rows = db
			.prepare(
				`SELECT * FROM tasks
         WHERE title LIKE ? OR description LIKE ?
         ORDER BY created_at DESC
         LIMIT 20`,
			)
			.all(pattern, pattern) as TaskRow[];

		if (rows.length === 0) {
			return `No tasks found matching "${query}"`;
		}

		const lines = rows.map(
			(r) =>
				`[${r.id}] [${r.status}] [${r.priority}] ${r.title}${r.description ? ` — ${r.description}` : ""}`,
		);
		return `Found ${rows.length} task(s) matching "${query}":\n\n${lines.join("\n")}`;
	},
});

// ── Get DB info ──────────────────────────────────────────────────────────────
export const getMemoryInfo = tool({
	description:
		"Get information about the SQLite memory database: total tasks, breakdown by status, and file location.",
	inputSchema: z.object({}),
	execute: async () => {
		const db = getDb();
		const total = (
			db.prepare("SELECT COUNT(*) as count FROM tasks").get() as {
				count: number;
			}
		).count;
		const byStatus = db
			.prepare("SELECT status, COUNT(*) as count FROM tasks GROUP BY status")
			.all() as { status: string; count: number }[];

		const statusSummary = byStatus
			.map((r) => `  ${r.status}: ${r.count}`)
			.join("\n");

		return `📊 SQLite Memory\nLocation: ${DB_PATH}\nTotal tasks: ${total}\n\nBy status:\n${statusSummary || "  (no tasks yet)"}`;
	},
});

export const tools = {
	addTask,
	listTasks,
	updateTaskStatus,
	updateTask,
	deleteTask,
	searchTasks,
	getMemoryInfo,
};
