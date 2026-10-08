import type { ThinkingLevel } from "@earendil-works/pi-agent-core";
import {
	createAgentSession,
	ModelRuntime,
	resolveCliModel,
	SessionManager,
	type ToolDefinition,
} from "@earendil-works/pi-coding-agent";

export type { DecomposedTask, TaskDecomposition } from "./tools/decompose-tasks.ts";
export type { AgentBid } from "./tools/submit-bid.ts";

export const DEFAULT_PI_AGENT = {
	provider: "deepseek",
	model: "deepseek-v4-pro",
} as const;

/** Built-in Pi tools for this repo (read-only; no bash/edit/write). */
export const DEFAULT_PI_TOOLS = ["read", "grep", "find", "ls"] as const;

/** Where Pi coding tools run for auction runs. */
export const DEMO_PROJECT_CWD = `${import.meta.dir}/demo-project`;

export type PiAgentConfig = {
	provider?: string;
	model?: string;
	thinkingLevel?: ThinkingLevel;
	apiKey?: string;
	cwd?: string;
};

export type RunPiAgentOptions = PiAgentConfig & {
	/** Registered alongside {@link DEFAULT_PI_TOOLS} (allowlisted by name). */
	customTools?: ToolDefinition[];
	/** When set, return that tool's `details` instead of assistant text. */
	returnTool?: string;
};

export type RunPiAgentTurnOptions = RunPiAgentOptions & {
	/**
	 * Session id. With `resume: true`, opens that session under `cwd`.
	 * Without `resume`, starts a new persisted session with this id (Pi generates one if omitted).
	 * Id: alphanumeric, `-`, `_`, `.`; must start and end with alphanumeric.
	 */
	sessionId?: string;
	/** Open an existing `sessionId` and append. Omit to start a new session (optionally with `sessionId`). */
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

function sessionTools(customTools?: ToolDefinition[]): string[] {
	const names = customTools?.map((tool) => tool.name) ?? [];
	return [...DEFAULT_PI_TOOLS, ...names];
}

async function createPiSession(options: RunPiAgentOptions, sessionManager: SessionManager) {
	const provider = options.provider ?? DEFAULT_PI_AGENT.provider;
	const modelId = options.model ?? DEFAULT_PI_AGENT.model;
	const cwd = options.cwd ?? process.cwd();

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

	return createAgentSession({
		model: resolved.model,
		thinkingLevel: resolved.thinkingLevel ?? options.thinkingLevel,
		modelRuntime,
		sessionManager,
		cwd,
		tools: sessionTools(options.customTools),
		...(options.customTools ? { customTools: options.customTools } : {}),
	});
}

/** One user prompt in a file-backed session. Returns `sessionId` for a later turn with `resume: true`. */
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
