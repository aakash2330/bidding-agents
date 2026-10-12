import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import tls from "node:tls";
import { fileURLToPath } from "node:url";
import type { ThinkingLevel } from "@earendil-works/pi-agent-core";

// Bun's HTTP/2 client verifies the CNAME (agentn.api5lat.cursor.sh), which is not on the cert.
// Connect to the A record and keep the original name as SNI. ponytail: drop when Bun fixes this.
const cursorAddresses = new Map<string, { ips: string[]; at: number }>();

function cursorAddressesFor(host: string): string[] | undefined {
	const hit = cursorAddresses.get(host);
	if (hit && Date.now() - hit.at < 30_000) return hit.ips;
	const res = spawnSync("dig", ["+short", host, "A"], { encoding: "utf8", timeout: 2000 });
	const ips = res.stdout?.split(/\s+/).filter((line) => /^\d{1,3}(\.\d{1,3}){3}$/.test(line)) ?? [];
	if (!ips.length) return;
	cursorAddresses.set(host, { ips, at: Date.now() });
	return ips;
}

if (process.versions.bun) {
	const connect = tls.connect;
	tls.connect = ((options: tls.ConnectionOptions, ...args: unknown[]) => {
		if (typeof options?.host === "string" && options.host.endsWith(".cursor.sh")) {
			const ips = cursorAddressesFor(options.host);
			const ip = ips?.[0];
			if (ip) options = { ...options, host: ip, servername: options.servername || options.host };
		}
		return connect(options, ...(args as []));
	}) as typeof tls.connect;
}
import {
	createAgentSession,
	ModelRuntime,
	SessionManager,
	type ToolDefinition,
} from "@earendil-works/pi-coding-agent";

export type { DecomposedTask, TaskDecomposition } from "./tools/decompose-tasks.ts";
export type { AgentBid } from "./tools/submit-bid.ts";

export const DEFAULT_PI_AGENT = {
	provider: "cursor",
	model: "composer-2.5",
} as const;

export const DEFAULT_PI_TOOLS = ["read", "grep", "find", "ls"] as const;

const packageSrcDir = dirname(fileURLToPath(import.meta.url));

export const DEMO_PROJECT_CWD = join(packageSrcDir, "../../../apps/demo-project");

export type PiAgentConfig = {
	provider?: string;
	model?: string;
	thinkingLevel?: ThinkingLevel;
	apiKey?: string;
	cwd?: string;
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

	const sessionResult = await createAgentSession({
		modelRuntime,
		sessionManager,
		cwd,
		thinkingLevel: options.thinkingLevel,
		tools: sessionTools(options.customTools),
		...(options.customTools ? { customTools: options.customTools } : {}),
	});

	let model = modelRuntime.getModel(provider, modelId);
	if (!model && provider === "cursor" && modelId === "composer-2.5") {
		const composer2 = modelRuntime.getModel(provider, "composer-2");
		if (composer2) model = { ...composer2, id: "composer-2.5" };
	}
	if (!model) {
		throw new Error(`Unknown model ${provider}/${modelId}`);
	}
	await sessionResult.session.setModel(model, { thinkingLevel: options.thinkingLevel });

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
