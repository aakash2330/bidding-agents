import type { AgentRole } from "@bidding-agents/shared";

export type AgentPersona = {
	summary: string;
	prompt: string;
};

const PERSONA_FILES: Record<AgentRole, string> = {
	designer: "designer.md",
	engineer: "engineer.md",
	marketer: "marketer.md",
};

function parsePersonaMarkdown(markdown: string): AgentPersona {
	const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
	const frontmatter = match?.[1] ?? "";
	const body = (match?.[2] ?? markdown).trim();
	const summary =
		frontmatter.match(/description:\s*"([^"]+)"/)?.[1] ??
		frontmatter.match(/description:\s*'([^']+)'/)?.[1] ??
		frontmatter.match(/description:\s*(.+)/)?.[1]?.trim() ??
		body.split("\n")[0]?.replace(/^#+\s*/, "") ??
		"";
	return { summary, prompt: body };
}

const personaDir = import.meta.dir;

export const agentPersonas: Record<AgentRole, AgentPersona> = await (async () => {
	const entries = await Promise.all(
		Object.entries(PERSONA_FILES).map(async ([personality, file]) => {
			const markdown = await Bun.file(`${personaDir}/${file}`).text();
			return [personality, parsePersonaMarkdown(markdown)] as const;
		}),
	);
	return Object.fromEntries(entries) as Record<AgentRole, AgentPersona>;
})();
