import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import { Sandbox } from "e2b";

const DEST = "/home/user/app";
const PORT = 3000;
const BUN = "/home/user/.bun/bin/bun";
const LOG = "/home/user/app.log";
const SKIP = new Set(["node_modules", "dist", ".git", ".pi", ".cursor", ".DS_Store"]);

type FileEntry = { path: string; data: Blob };

async function collect(dir: string, rel = ""): Promise<FileEntry[]> {
	const out: FileEntry[] = [];
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		if (SKIP.has(entry.name)) continue;
		const full = join(dir, entry.name);
		const next = rel ? `${rel}/${entry.name}` : entry.name;
		if (entry.isDirectory()) out.push(...(await collect(full, next)));
		else out.push({ path: `${DEST}/${next}`, data: new Blob([await readFile(full)]) });
	}
	return out;
}

export type Deployed = {
	url: string;
	sandboxId: string;
	sandbox: Sandbox;
};

/**
 * Upload a finished project to an e2b sandbox, install it, serve it, and wait
 * until the public URL responds.
 */
export async function deploy(
	dir: string,
	{ port = PORT, timeoutMs = 30 * 60_000 }: { port?: number; timeoutMs?: number } = {},
): Promise<Deployed> {
	const sandbox = await Sandbox.create({ timeoutMs });
	try {
		await sandbox.files.write(await collect(dir));

		// Install bun if the base template does not ship it.
		await sandbox.commands.run(
			`[ -x ${BUN} ] || (sudo apt-get update -qq && sudo apt-get install -y unzip >/dev/null && curl -fsSL https://bun.sh/install | bash)`,
			{ timeoutMs: 180_000 },
		);

		await sandbox.commands.run(`${BUN} install`, { cwd: DEST, timeoutMs: 180_000 });

		// NODE_ENV=production: Bun's dev server 403s any HTML request whose Host
		// isn't localhost, so the public E2B URL can't load the page in dev mode.
		// setsid: a plain background process dies with the SDK client session.
		await sandbox.commands.run(`setsid nohup ${BUN} src/index.ts > ${LOG} 2>&1 < /dev/null`, {
			cwd: DEST,
			background: true,
			envs: { NODE_ENV: "production" },
		});

		const url = `https://${sandbox.getHost(port)}`;
		for (let i = 0; i < 60; i++) {
			if ((await fetch(url).catch(() => null))?.ok) {
				return { url, sandboxId: sandbox.sandboxId, sandbox };
			}
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
		throw new Error(`Sandbox not reachable: ${url}\n${await sandbox.files.read(LOG)}`);
	} catch (error) {
		await sandbox.kill();
		throw error;
	}
}
