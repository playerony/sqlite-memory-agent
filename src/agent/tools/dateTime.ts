import { tool } from "ai";
import { SQLITE_TOOL_DEFINITIONS } from "./tool-definitions.js";

export const dateTime = tool({
	description: SQLITE_TOOL_DEFINITIONS.dateTime.description,
	inputSchema: SQLITE_TOOL_DEFINITIONS.dateTime.parameters,
	execute: async () => {
		return new Date().toISOString();
	},
});
