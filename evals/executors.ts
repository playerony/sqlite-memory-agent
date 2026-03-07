import {
	generateText,
	stepCountIs,
	tool,
	type ModelMessage,
	type ToolSet,
} from "ai";

import { SQLITE_TOOL_DEFINITIONS } from "./tool-definitions/index.js";
import type { EvalData } from "./types.js";
import { buildMessages } from "./utils.js";
import { anthropic } from "@ai-sdk/anthropic";

export const singleTurnExecutor = async (data: EvalData) => {
	const messages = buildMessages(data);
	const tools: ToolSet = {};

	for (const toolName of data.tools) {
		const def =
			SQLITE_TOOL_DEFINITIONS[toolName as keyof typeof SQLITE_TOOL_DEFINITIONS];
		if (def) {
			tools[toolName] = tool({
				description: def.description,
				inputSchema: def.parameters,
			});
		}
	}

	const { toolCalls } = await generateText({
		model: anthropic(data.config?.model ?? "claude-haiku-4-5"),
		messages,
		tools,
		stopWhen: stepCountIs(1),
		temperature: data.config?.temperature ?? undefined,
	});

	const calls = toolCalls?.map((call) => ({
		toolName: call.toolName,
		args: "args" in call ? call.args : {},
	}));

	const toolNames = calls?.map((call) => call.toolName) ?? [];

	return {
		toolCalls: calls,
		toolNames: toolNames,
		selectedAny: toolNames.length > 0,
	};
};
