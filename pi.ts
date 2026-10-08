import {
	createAgentSession,
	ModelRuntime,
	resolveCliModel,
	SessionManager,
	type ThinkingLevel,
	type ToolDefinition,
} from "@earendil-works/pi-coding-agent";

export type { DecomposedTask, TaskDecomposition } from "./tools/decompose-tasks.ts";

export const DEFAULT_PI_AGENT = {
	provider: "deepseek",
	model: "deepseek-v4-pro",
} as const;

export type PiAgentConfig = {
	provider?: string;
	model?: string;
	thinkingLevel?: ThinkingLevel;
	apiKey?: string;
	cwd?: string;
};

export type RunPiAgentOptions = PiAgentConfig & {
	/** Merged with Pi's default coding tools (read, bash, edit, write, …). */
	customTools?: ToolDefinition[];
	/** When set, return that tool's `details` instead of assistant text. */
	returnTool?: string;
};

function assertSessionSucceeded(session: { state: { messages: readonly unknown[] } }): void {
	const last = session.state.messages.at(-1) as
		| { role?: string; stopReason?: string; errorMessage?: string }
		| undefined;
	if (last?.role === "assistant" && last.stopReason === "error") {
		throw new Error(last.errorMessage ?? "Pi agent request failed");
	}
}

function getToolResultDetails<T>(messages: readonly unknown[], toolName: string): T {
	for (let i = messages.length - 1; i >= 0; i--) {
		const message = messages[i] as { role?: string; toolName?: string; details?: T };
		if (message.role === "toolResult" && message.toolName === toolName && message.details) {
			return message.details;
		}
	}
	throw new Error(`Expected tool result from ${toolName}`);
}

export async function runPiAgent(
	prompt: string,
	options: RunPiAgentOptions = {},
): Promise<string | unknown> {
	const provider = options.provider ?? DEFAULT_PI_AGENT.provider;
	const modelId = options.model ?? DEFAULT_PI_AGENT.model;

	const modelRuntime = await ModelRuntime.create();
	if (options.apiKey) {
		await modelRuntime.setRuntimeApiKey(provider, options.apiKey);
	}

	const resolved = resolveCliModel({
		cliModel: `${provider}/${modelId}`,
		cliThinking: options.thinkingLevel,
		modelRuntime,
	});
	if (!resolved.model) {
		throw new Error(resolved.error ?? `Unknown model ${provider}/${modelId}`);
	}

	const { session } = await createAgentSession({
		model: resolved.model,
		thinkingLevel: resolved.thinkingLevel ?? options.thinkingLevel,
		modelRuntime,
		sessionManager: SessionManager.inMemory(),
		cwd: options.cwd ?? process.cwd(),
		...(options.customTools ? { customTools: options.customTools } : {}),
	});

	try {
		await session.prompt(prompt);
		assertSessionSucceeded(session);
		if (options.returnTool) {
			return getToolResultDetails(session.state.messages, options.returnTool);
		}
		return session.getLastAssistantText() ?? "";
	} finally {
		session.dispose();
	}
}
