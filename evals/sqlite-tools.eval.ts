import { evaluate } from "@lmnr-ai/lmnr";
import { toolSelectionScore } from "./evaluators";

import type { EvalData, EvalTarget, SingleTurnResult } from "./types";
import dataset from "./data/sqlite-tools.json" with { type: "json" };
import { singleTurnExecutor } from "./executors";

const executor = async (data: EvalData) => {
	return await singleTurnExecutor(data);
};

evaluate({
	data: dataset as any,
	executor,
	evaluators: {
		selectionScore: (
			output: SingleTurnResult,
			target: EvalTarget | undefined,
		) => {
			if (target?.category === "secondary") {
				return 1;
			}
			return toolSelectionScore(output, target);
		},
	},
	groupName: "sqlite-tools-selection",
});
