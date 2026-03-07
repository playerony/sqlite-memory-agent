import { tools } from "./tools/index.js";

export const executeTool = async (name: string, args: any): Promise<string> => {
	const tool = tools[name as unknown as keyof typeof tools];
	if (!tool) {
		return "unknown tool, this does not exist";
	}

	const execute = tool.execute;
	if (!execute) {
		return "this is not a registered tool";
	}
	const result = await execute(args, {
		toolCallId: "",
		messages: [],
	});
	return String(result);
};
