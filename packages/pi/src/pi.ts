import type { ThinkingLevel } from "@earendil-works/pi-agent-core";

export { Type } from "@earendil-works/pi-ai";
export type { ThinkingLevel } from "@earendil-works/pi-agent-core";
export { defineTool, type ToolDefinition } from "@earendil-works/pi-coding-agent";

import {
	createAgentSession,
	ModelRuntime,
	SessionManager,
	type ToolDefinition,
} from "@earendil-works/pi-coding-agent";

export const DEFAULT_PI_AGENT = {
	provider: "opencode-go",
	model: "deepseek-v4.1-flash",
	thinkingLevel: "high",
} as const;

export const DEFAULT_PI_TOOLS = ["read", "grep", "find", "ls"] as const;

export type PiAgentConfig = {
	provider?: string;
	model?: string;
	thinkingLevel?: ThinkingLevel;
	apiKey?: string;
	cwd?: string;
	/** Built-in tool allowlist. Defaults to read-only; pass write/edit/bash to let the agent change files. */
	tools?: readonly string[];
};

export type RunPiAgentOptions = PiAgentConfig & {
	customTools?: ToolDefinition[];
	returnTool?: string;
};

export type RunPiAgentTurnOptions = RunPiAgentOptions & {
	sessionId?: string;
	resume?: boolean;
};

export type PiAgentTurnResult = {
	reply: string | unknown;
	sessionId: string;
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

function resolveReply(
	session: { state: { messages: readonly unknown[] }; getLastAssistantText: () => string | undefined },
	returnTool?: string,
): string | unknown {
	if (returnTool) {
		return getToolResultDetails(session.state.messages, returnTool);
	}
	return session.getLastAssistantText() ?? "";
}

function sessionManagerForTurn(cwd: string, options: RunPiAgentTurnOptions): SessionManager {
	if (options.resume) {
		if (!options.sessionId) {
			throw new Error("sessionId is required when resume is true");
		}
		const ref = options.sessionId;
		const path =
			ref.includes("/") || ref.endsWith(".jsonl")
				? ref
				: SessionManager.findById(cwd, ref);
		if (!path) {
			throw new Error(`No session found for id: ${ref}`);
		}
		return SessionManager.open(path, undefined, cwd);
	}
	if (options.sessionId) {
		return SessionManager.create(cwd, undefined, { id: options.sessionId });
	}
	return SessionManager.create(cwd);
}

function sessionTools(tools: readonly string[] | undefined, customTools?: ToolDefinition[]): string[] {
	const names = customTools?.map((tool) => tool.name) ?? [];
	return [...(tools ?? DEFAULT_PI_TOOLS), ...names];
}

async function createPiSession(options: RunPiAgentOptions, sessionManager: SessionManager) {
	const provider = options.provider ?? DEFAULT_PI_AGENT.provider;
	const modelId = options.model ?? DEFAULT_PI_AGENT.model;
	const cwd = options.cwd ?? process.cwd();

	const modelRuntime = await ModelRuntime.create();
	if (options.apiKey) {
		await modelRuntime.setRuntimeApiKey(provider, options.apiKey);
	}

	const sessionResult = await createAgentSession({
		modelRuntime,
		sessionManager,
		cwd,
		thinkingLevel: options.thinkingLevel ?? DEFAULT_PI_AGENT.thinkingLevel,
		tools: sessionTools(options.tools, options.customTools),
		...(options.customTools ? { customTools: options.customTools } : {}),
	});

	const model = modelRuntime.getModel(provider, modelId);
	if (!model) {
		throw new Error(`Unknown model ${provider}/${modelId}`);
	}
	await sessionResult.session.setModel(model);

	return sessionResult;
}

export async function runPiAgentTurn(
	prompt: string,
	options: RunPiAgentTurnOptions = {},
): Promise<PiAgentTurnResult> {
	const cwd = options.cwd ?? process.cwd();
	const { session, modelFallbackMessage } = await createPiSession(
		options,
		sessionManagerForTurn(cwd, options),
	);
	if (modelFallbackMessage) {
		console.warn(modelFallbackMessage);
	}

	try {
		await session.prompt(prompt);
		assertSessionSucceeded(session);
		return {
			reply: resolveReply(session, options.returnTool),
			sessionId: session.sessionId,
		};
	} finally {
		session.dispose();
	}
}
