import { Box, Text } from "ink";
import InkSpinner from "ink-spinner";

export interface ToolCallProps {
	name: string;
	status: "pending" | "complete";
}

export function ToolCall({ name, status }: ToolCallProps) {
	return (
		<Box flexDirection="column" marginLeft={2}>
			<Box>
				<Text color="yellow">⚡ </Text>
				<Text color="yellow" bold>
					{name}
				</Text>
				{status === "pending" ? (
					<Text>
						{" "}
						<Text color="cyan">
							<InkSpinner type="dots" />
						</Text>
					</Text>
				) : (
					<Text color="green"> ✓</Text>
				)}
			</Box>
		</Box>
	);
}
