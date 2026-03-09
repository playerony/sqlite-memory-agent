import "dotenv/config";
import { streamText, type ModelMessage } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { SYSTEM_PROMPT } from "./system/prompt.js";

import type { AgentCallbacks, ToolCallInfo } from "../types.js";
import { tools } from "./tools/index.js";
import { Laminar, getTracer } from "@lmnr-ai/lmnr";

import { filterCompatibleMessages } from "./system/filterMessages.js";
import {
	calculateUsagePercentage,
	compactConversation,
	estimateMessagesTokens,
	getModelLimits,
	isOverThreshold,
} from "./context";
import { DEFAULT_MODEL_ID, DEFAULT_THRESHOLD } from "../config.js";
import { executeTool } from "./executeTool.js";

Laminar.initialize({
	projectApiKey: process.env.LMNR_PROJECT_API_KEY,
});

const getMessages = (
	userMessage: string,
	conversationHistory: ModelMessage[],
): ModelMessage[] => {
	if (conversationHistory.length === 0) {
		return [
			{ role: "system", content: SYSTEM_PROMPT },
			{ role: "user", content: userMessage },
		];
	}

	return [...conversationHistory, { role: "user", content: userMessage }];
};

export const runAgent = async (
	userMessage: string,
	conversationHistory: ModelMessage[],
	callbacks: AgentCallbacks,
) => {
	const modelLimits = getModelLimits(DEFAULT_MODEL_ID);

	let workingHistory = filterCompatibleMessages(conversationHistory);

	const messages = getMessages(userMessage, workingHistory);
	const preCheckTokens = estimateMessagesTokens(messages);

	if (isOverThreshold(preCheckTokens.total, modelLimits.contextWindow)) {
		workingHistory = await compactConversation(
			workingHistory,
			DEFAULT_MODEL_ID,
		);
	}

	let fullResponse = "";

	const reportTokenUsage = () => {
		if (callbacks.onTokenUsage) {
			const usage = estimateMessagesTokens(messages);
			callbacks.onTokenUsage({
				inputTokens: usage.input,
				outputTokens: usage.output,
				totalTokens: usage.total,
				contextWindow: modelLimits.contextWindow,
				threshold: DEFAULT_THRESHOLD,
				percentage: calculateUsagePercentage(
					usage.total,
					modelLimits.contextWindow,
				),
			});
		}
	};

	reportTokenUsage();

	while (true) {
		const result = streamText({
			model: anthropic(DEFAULT_MODEL_ID),
			messages,
			tools,
			experimental_telemetry: {
				isEnabled: true,
				tracer: getTracer(),
			},
		});

		const toolCalls: ToolCallInfo[] = [];
		let currentText = "";
		let streamError: Error | null = null;

		try {
			for await (const chunk of result.fullStream) {
				if (chunk.type === "text-delta") {
					currentText += chunk.text;
					callbacks.onToken(chunk.text);
				}

				if (chunk.type === "tool-call") {
					const input = "input" in chunk ? chunk.input : {};
					toolCalls.push({
						toolCallId: chunk.toolCallId,
						toolName: chunk.toolName,
						args: input as Record<string, unknown>,
					});
					callbacks.onToolCallStart(chunk.toolName, input);
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

		if (streamError && !currentText) {
			fullResponse =
				"I apologize, but I wasn't able to generate a response. Could you please try rephrasing your message?";
			callbacks.onToken(fullResponse);
			break;
		}

		const finishReason = await result.finishReason;

		if (finishReason !== "tool-calls" || toolCalls.length === 0) {
			const responseMessages = await result.response;
			messages.push(...responseMessages.messages);
			reportTokenUsage();
			break;
		}

		const responseMessages = await result.response;
		messages.push(...responseMessages.messages);
		reportTokenUsage();
	}

	callbacks.onComplete(fullResponse);

	return messages;
};
