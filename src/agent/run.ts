import "dotenv/config";
import { generateText, streamText, type ModelMessage } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { SYSTEM_PROMPT } from "./system/prompt.js";
import type { AgentCallbacks, ToolCallInfo } from "../types.js";
import { tools } from "./tools/index.js";
import { executeTool } from "./executeTool.js";

import { filterCompatibleMessages } from "./system/filterMessages.js";

export const runAgent = async (
	userMessage: string,
	conversationHistory: ModelMessage[],
	callbacks?: AgentCallbacks,
) => {
	const workingHistory = filterCompatibleMessages(conversationHistory);
	const messages: ModelMessage[] = [
		{
			role: "system",
			content: SYSTEM_PROMPT,
		},
		...workingHistory,
		{
			role: "user",
			content: userMessage,
		},
	];

	let fullResponse = "";

	while (true) {
		const result = streamText({
			model: anthropic("claude-3-5-haiku-20241022"),
			messages,
			tools,
		});

		const toolCalls: ToolCallInfo[] = [];
		let currentText = "";
		let streamError: Error | null = null;

		try {
			for await (const chunk of result.fullStream) {
				if (chunk.type === "text-delta") {
					currentText += chunk.text;
					callbacks?.onToken(chunk.text);
				}

				if (chunk.type === "tool-call") {
					const input = "input" in chunk ? chunk.input : {};
					toolCalls.push({
						toolCallId: chunk.toolCallId,
						toolName: chunk.toolName,
						args: input as Record<string, unknown>,
					});
					callbacks?.onToolCallStart(chunk.toolName, input);
				}
			}
		} catch (error) {
			streamError = error as Error;
			if (
				!currentText &&
				!streamError.message.includes("No output generated")
			) {
				throw streamError;
			}
		}

		fullResponse += currentText;
		callbacks?.onToken(currentText);

		if (streamError && !currentText) {
			fullResponse = "Sorry, I encountered an error. Please try again.";
			callbacks?.onToken(fullResponse);
			break;
		}

		const finishReason = await result.finishReason;
		if (finishReason !== "tool-calls" && toolCalls.length === 0) {
			const responseMessages = await result.response;
			messages.push(...responseMessages.messages);
			break;
		}

		const responseMessages = await result.response;
		messages.push(...responseMessages.messages);

		for (const toolCall of toolCalls) {
			const toolResult = await executeTool(toolCall.toolName, toolCall.args);
			callbacks?.onToolCallEnd(toolCall.toolName, toolResult);

			messages.push({
				role: "tool",
				content: [
					{
						type: "tool-result",
						toolCallId: toolCall.toolCallId,
						toolName: toolCall.toolName,
						output: { type: "text", value: toolResult },
					},
				],
			});
		}
	}

	callbacks?.onComplete(fullResponse);
	return messages;
};
