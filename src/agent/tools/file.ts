import { tool } from "ai";
import { z } from "zod";
import fs from "node:fs/promises";
import notePath from "node:path";

export const readFile = tool({
	description:
		"Read the contents of a file at the specified path, always use this to read a file",
	inputSchema: z.object({
		path: z.string().describe("The path to the file to read"),
	}),
	execute: async ({ path }) => {
		try {
			const content = await fs.readFile(path, "utf8");
			return content;
		} catch (error) {
			return `Error reading file ${path}: ${error}`;
		}
	},
});

export const writeFile = tool({
	description:
		"Write the contents of a file at the specified path, always use this to write a file",
	inputSchema: z.object({
		path: z.string().describe("The path to the file to write"),
		content: z.string().describe("The content to write to the file"),
	}),
	execute: async ({ path, content }) => {
		try {
			const dir = notePath.dirname(path);
			await fs.mkdir(dir, { recursive: true });
			await fs.writeFile(path, content, "utf8");
			return `Successfully wrote ${content.length} characters to ${path}`;
		} catch (error) {
			return `Error writing file ${path}: ${error}`;
		}
	},
});

export const listFiles = tool({
	description:
		"List all files and directories in the specified directory path, always use this to list files",
	inputSchema: z.object({
		directory: z
			.string()
			.describe("The directory path to list contents of")
			.default("."),
	}),
	execute: async ({ directory }) => {
		try {
			const entries = await fs.readdir(directory, { withFileTypes: true });
			const items = entries.map((entry) => {
				const type = entry.isDirectory() ? "directory" : "file";

				return `${type} ${entry.name}`;
			});
			return items.length > 0
				? items.join("\n")
				: "No files or directories found";
		} catch (error) {
			return `Error listing files in ${directory}: ${error}`;
		}
	},
});

export const deleteFile = tool({
	description:
		"Delete a file at the specified path, always use this to delete a file",
	inputSchema: z.object({
		path: z.string().describe("The path to the file to delete"),
	}),
	execute: async ({ path }) => {
		try {
			await fs.unlink(path);
			return `Successfully deleted file ${path}`;
		} catch (error) {
			return `Error deleting file ${path}: ${error}`;
		}
	},
});

export const tools = {
	readFile,
	writeFile,
	listFiles,
	deleteFile,
};
