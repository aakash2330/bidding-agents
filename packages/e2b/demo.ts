import path from "node:path";

import { deploy } from "./src/deploy.ts";

const SRC = path.resolve(import.meta.dir, "../../apps/demo-project");

const { url, sandboxId, sandbox } = await deploy(SRC);
console.log(`sandbox: ${sandboxId}`);
console.log(`\n${url}\n`);

process.on("SIGINT", async () => {
	await sandbox.kill();
	process.exit(0);
});
await Promise.withResolvers().promise; // Ctrl+C to stop (sandbox auto-expires in 30min regardless)
