import type { AnthropicMessagesModelId } from "@ai-sdk/anthropic/internal";
import type { ModelLimits } from "./types";

export const DEFAULT_MODEL_LIMITS: ModelLimits = {
	inputLimit: 136000,
	outputLimit: 64000,
	contextWindow: 200000,
};

const AVAILABLE_MODEL_IDS: AnthropicMessagesModelId[] = [
	"claude-haiku-4-5-20251001",
] as const;

export const MODEL_LIMITS: Partial<
	Record<AnthropicMessagesModelId, ModelLimits>
> = {
	"claude-haiku-4-5-20251001": {
		inputLimit: 136000,
		outputLimit: 64000,
		contextWindow: 200000,
	},
};

export const DEFAULT_MODEL_ID = AVAILABLE_MODEL_IDS[0];

/**
 * Default threshold for context window usage (80%)
 */
export const DEFAULT_THRESHOLD = 0.8;
