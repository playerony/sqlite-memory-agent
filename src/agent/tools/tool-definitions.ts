import { z } from "zod";

export const SQLITE_TOOL_DEFINITIONS = {
	addTask: {
		description:
			"Add a new task to the SQLite memory. Use this when the user wants to create, add, or save a task/todo.",
		parameters: z.object({
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
	},
	listTasks: {
		description:
			"List tasks from the SQLite memory. Can filter by status, priority, or tags. Use this to show the user their current tasks.",
		parameters: z.object({
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
	},
	updateTaskStatus: {
		description:
			"Update the status of a task. Use this to mark tasks as in_progress, done, or back to todo.",
		parameters: z.object({
			id: z.number().describe("The task ID to update"),
			status: z
				.enum(["todo", "in_progress", "done"])
				.describe("The new status for the task"),
		}),
	},
	updateTask: {
		description:
			"Update task details like title, description, priority, due date, or tags.",
		parameters: z.object({
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
	},
	deleteTask: {
		description:
			"Permanently delete a task from memory. Use this only when the user explicitly wants to remove a task.",
		parameters: z.object({
			id: z.number().describe("The task ID to delete"),
		}),
	},
	searchTasks: {
		description:
			"Search tasks by keyword in title or description. Use this when the user wants to find specific tasks.",
		parameters: z.object({
			query: z.string().describe("Search keyword or phrase"),
		}),
	},
	getMemoryInfo: {
		description:
			"Get information about the SQLite memory database: total tasks, breakdown by status, and file location.",
		parameters: z.object({}),
	},
	dateTime: {
		description:
			"Get the current date and time. Use this tool before any time related task.",
		parameters: z.object({}),
	},
} as const;

export type SqliteToolName = keyof typeof SQLITE_TOOL_DEFINITIONS;
