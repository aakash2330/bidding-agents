import {
	createAgentSession,
	ModelRuntime,
	resolveCliModel,
	SessionManager,
	type ThinkingLevel,
} from "@earendil-works/pi-coding-agent";

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

export async function runPiAgent(
	prompt: string,
	options: PiAgentConfig = {},
): Promise<string> {
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
	});

	try {
		await session.prompt(prompt);

		const last = session.state.messages.at(-1);
		if (last?.role === "assistant" && last.stopReason === "error") {
			throw new Error(last.errorMessage ?? "Pi agent request failed");
		}

		return session.getLastAssistantText() ?? "";
	} finally {
		session.dispose();
	}
}
