import { tool } from "ai";
import { SQLITE_TOOL_DEFINITIONS } from "../tool-definitions/index.js";

const def = SQLITE_TOOL_DEFINITIONS;

export const createMockAddTask = (mockResponse?: string) =>
	tool({
		description: def.addTask.description,
		inputSchema: def.addTask.parameters,
		execute: async ({
			title,
			priority,
		}: {
			title: string;
			description?: string;
			priority?: string;
			due_date?: string;
			tags?: string;
		}) =>
			mockResponse ??
			`✅ Task added (id=1): "${title}" [${priority ?? "medium"}]`,
	});

export const createMockListTasks = (mockTaskList: string) =>
	tool({
		description: def.listTasks.description,
		inputSchema: def.listTasks.parameters,
		execute: async () => mockTaskList,
	});

export const createMockUpdateTaskStatus = (mockResponse?: string) =>
	tool({
		description: def.updateTaskStatus.description,
		inputSchema: def.updateTaskStatus.parameters,
		execute: async ({ id, status }: { id: number; status: string }) =>
			mockResponse ?? `✅ Task [${id}] marked as ${status}`,
	});

export const createMockUpdateTask = (mockResponse?: string) =>
	tool({
		description: def.updateTask.description,
		inputSchema: def.updateTask.parameters,
		execute: async ({ id }: { id: number }) =>
			mockResponse ?? `✅ Task [${id}] updated successfully`,
	});

export const createMockDeleteTask = (mockResponse?: string) =>
	tool({
		description: def.deleteTask.description,
		inputSchema: def.deleteTask.parameters,
		execute: async ({ id }: { id: number }) =>
			mockResponse ?? `🗑️ Task [${id}] has been deleted`,
	});

export const createMockSearchTasks = (mockResults: string) =>
	tool({
		description: def.searchTasks.description,
		inputSchema: def.searchTasks.parameters,
		execute: async () => mockResults,
	});

export const createMockGetMemoryInfo = (mockStats?: string) =>
	tool({
		description: def.getMemoryInfo.description,
		inputSchema: def.getMemoryInfo.parameters,
		execute: async () =>
			mockStats ??
			"📊 SQLite Memory\nLocation: /tmp/memory.db\nTotal tasks: 3\n\nBy status:\n  todo: 2\n  in_progress: 1\n  done: 0",
	});

export const createMockDateTime = (mockIsoDate?: string) =>
	tool({
		description: def.dateTime.description,
		inputSchema: def.dateTime.parameters,
		execute: async () => mockIsoDate ?? "2025-03-07T12:00:00.000Z",
	});
