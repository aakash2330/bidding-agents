import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { deploy } from "@bidding-agents/e2b";
import { runPiAgentTurn } from "@bidding-agents/pi";

export type AppBuildSide = "direct" | "auction";

/** The starter project each side is implemented into. */
const STARTER = join(process.cwd(), "../../apps/demo-project");
const SKIP = new Set(["node_modules", "dist", ".git", ".pi", ".cursor", ".DS_Store"]);
const CODING_TOOLS = ["read", "grep", "find", "ls", "write", "edit", "bash"];

function implementPrompt(plan: string): string {
	return [
		"Implement the plan below in the Bun + React project in the current directory.",
		"",
		"The project is a Bun.serve() server:",
		"- src/index.ts serves the app (keep it working on port 3000).",
		"- src/index.html is the HTML entry; it imports src/frontend.tsx.",
		"- src/App.tsx and friends are the React UI; src/index.css is the styling.",
		"",
		"Rules:",
		"- Use write/edit to change files and bash to run commands.",
		"- Work only inside the current directory.",
		"- The result must run with `bun install && NODE_ENV=production bun src/index.ts`.",
		"- Make the whole plan real, not a mockup. No placeholder copy.",
		"- Do not start a long-running server and do not deploy anything.",
		"- Do not ask questions. When finished, reply with one short line.",
		"",
		"Plan:",
		plan,
	].join("\n");
}

/**
 * Implement the plan in a private copy of the starter, then deploy that result
 * to e2b. Resolves with the public URL once the app is serving.
 *
 * Each side gets its own copy and sandbox, so direct and auction builds run in
 * parallel without sharing a directory.
 */
export async function buildApp(side: AppBuildSide, plan: string): Promise<string> {
	const root = await mkdtemp(join(tmpdir(), `bidding-${side}-`));
	const dir = join(root, "app");
	try {
		await cp(STARTER, dir, {
			recursive: true,
			filter: (src) => !SKIP.has(src.split("/").pop() ?? ""),
		});

		await runPiAgentTurn(implementPrompt(plan), {
			cwd: dir,
			tools: CODING_TOOLS,
			thinkingLevel: "high",
		});

		const { url } = await deploy(dir);
		return url;
	} finally {
		await rm(root, { recursive: true, force: true }).catch(() => {});
	}
}
