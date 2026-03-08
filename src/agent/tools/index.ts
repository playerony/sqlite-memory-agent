import { dateTime } from "./dateTime.js";
import { tools as taskTools } from "./tasks.js";

export const tools = {
	dateTime,
	...taskTools,
};
