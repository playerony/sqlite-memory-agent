import { tool } from "ai";
import { SQLITE_TOOL_DEFINITIONS } from "../../src/agent/tools/tool-definitions.js";

export const createMockAddTask = (mockResponse?: string) =>
	tool({
		description: SQLITE_TOOL_DEFINITIONS.addTask.description,
		inputSchema: SQLITE_TOOL_DEFINITIONS.addTask.parameters,
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
		description: SQLITE_TOOL_DEFINITIONS.listTasks.description,
		inputSchema: SQLITE_TOOL_DEFINITIONS.listTasks.parameters,
		execute: async () => mockTaskList,
	});

export const createMockUpdateTaskStatus = (mockResponse?: string) =>
	tool({
		description: SQLITE_TOOL_DEFINITIONS.updateTaskStatus.description,
		inputSchema: SQLITE_TOOL_DEFINITIONS.updateTaskStatus.parameters,
		execute: async ({ id, status }: { id: number; status: string }) =>
			mockResponse ?? `✅ Task [${id}] marked as ${status}`,
	});

export const createMockUpdateTask = (mockResponse?: string) =>
	tool({
		description: SQLITE_TOOL_DEFINITIONS.updateTask.description,
		inputSchema: SQLITE_TOOL_DEFINITIONS.updateTask.parameters,
		execute: async ({ id }: { id: number }) =>
			mockResponse ?? `✅ Task [${id}] updated successfully`,
	});

export const createMockDeleteTask = (mockResponse?: string) =>
	tool({
		description: SQLITE_TOOL_DEFINITIONS.deleteTask.description,
		inputSchema: SQLITE_TOOL_DEFINITIONS.deleteTask.parameters,
		execute: async ({ id }: { id: number }) =>
			mockResponse ?? `🗑️ Task [${id}] has been deleted`,
	});

export const createMockSearchTasks = (mockResults: string) =>
	tool({
		description: SQLITE_TOOL_DEFINITIONS.searchTasks.description,
		inputSchema: SQLITE_TOOL_DEFINITIONS.searchTasks.parameters,
		execute: async () => mockResults,
	});

export const createMockGetMemoryInfo = (mockStats?: string) =>
	tool({
		description: SQLITE_TOOL_DEFINITIONS.getMemoryInfo.description,
		inputSchema: SQLITE_TOOL_DEFINITIONS.getMemoryInfo.parameters,
		execute: async () =>
			mockStats ??
			"📊 SQLite Memory\nLocation: /tmp/memory.db\nTotal tasks: 3\n\nBy status:\n  todo: 2\n  in_progress: 1\n  done: 0",
	});

export const createMockDateTime = (mockIsoDate?: string) =>
	tool({
		description: SQLITE_TOOL_DEFINITIONS.dateTime.description,
		inputSchema: SQLITE_TOOL_DEFINITIONS.dateTime.parameters,
		execute: async () => mockIsoDate ?? "2025-03-07T12:00:00.000Z",
	});
