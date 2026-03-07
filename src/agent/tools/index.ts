import { dateTime } from "./dateTime.js";
import { tools as taskTools } from "./tasks.js";

// All tools combined for the agent
export const tools = {
	dateTime,
	...taskTools,
};
