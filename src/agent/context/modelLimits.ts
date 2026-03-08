import type { AnthropicMessagesModelId } from "@ai-sdk/anthropic/internal";
import {
	MODEL_LIMITS,
	DEFAULT_MODEL_LIMITS,
	DEFAULT_THRESHOLD,
} from "../../config.ts";
import type { ModelLimits } from "../../types.ts";

export const getModelLimits = (
	modelId: AnthropicMessagesModelId,
): ModelLimits => MODEL_LIMITS[modelId] ?? DEFAULT_MODEL_LIMITS;

export const isOverThreshold = (
	totalTokens: number,
	contextWindow: number,
	threshold: number = DEFAULT_THRESHOLD,
): boolean => totalTokens > contextWindow * threshold;

export const calculateUsagePercentage = (
	totalTokens: number,
	contextWindow: number,
): number => totalTokens / contextWindow;
