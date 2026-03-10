import { tool } from "ai";
import { getDb, type TaskRow, DB_PATH } from "../../db/index.js";
import { SQLITE_TOOL_DEFINITIONS } from "./tool-definitions.js";

export const addTask = tool({
	description: SQLITE_TOOL_DEFINITIONS.addTask.description,
	inputSchema: SQLITE_TOOL_DEFINITIONS.addTask.parameters,
	execute: async ({ title, description, priority, due_date, tags }) => {
		try {
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
		} catch (error) {
			return `❌ Error adding task: ${error}`;
		}
	},
});

export const listTasks = tool({
	description: SQLITE_TOOL_DEFINITIONS.listTasks.description,
	inputSchema: SQLITE_TOOL_DEFINITIONS.listTasks.parameters,
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
			" ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, created_at DESC";
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

export const updateTaskStatus = tool({
	description: SQLITE_TOOL_DEFINITIONS.updateTaskStatus.description,
	inputSchema: SQLITE_TOOL_DEFINITIONS.updateTaskStatus.parameters,
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

export const updateTask = tool({
	description: SQLITE_TOOL_DEFINITIONS.updateTask.description,
	inputSchema: SQLITE_TOOL_DEFINITIONS.updateTask.parameters,
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

export const deleteTask = tool({
	description: SQLITE_TOOL_DEFINITIONS.deleteTask.description,
	inputSchema: SQLITE_TOOL_DEFINITIONS.deleteTask.parameters,
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

export const searchTasks = tool({
	description: SQLITE_TOOL_DEFINITIONS.searchTasks.description,
	inputSchema: SQLITE_TOOL_DEFINITIONS.searchTasks.parameters,
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

export const getMemoryInfo = tool({
	description: SQLITE_TOOL_DEFINITIONS.getMemoryInfo.description,
	inputSchema: SQLITE_TOOL_DEFINITIONS.getMemoryInfo.parameters,
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
