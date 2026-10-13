import { Sandbox } from "e2b";
import { readdir } from "node:fs/promises";
import path from "node:path";

const SRC = path.resolve(import.meta.dir, "../../apps/demo-project");
const DEST = "/home/user/demo-project";
const PORT = 3000;
const SKIP = new Set(["node_modules", "dist", ".git", ".pi", ".cursor", ".DS_Store"]);

async function collect(dir: string, rel = ""): Promise<{ path: string; data: Blob }[]> {
  const out: { path: string; data: Blob }[] = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...(await collect(p, r)));
    else out.push({ path: `${DEST}/${r}`, data: Bun.file(p) });
  }
  return out;
}

const sbx = await Sandbox.create({ timeoutMs: 30 * 60_000 });
console.log(`sandbox: ${sbx.sandboxId}`);

await sbx.files.write(await collect(SRC));
console.log("uploaded demo-project");

const bun = "/home/user/.bun/bin/bun";

// Install bun if missing
await sbx.commands.run(
  `[ -x ${bun} ] || (sudo apt-get update -qq && sudo apt-get install -y unzip >/dev/null && curl -fsSL https://bun.sh/install | bash)`,
  { timeoutMs: 180_000 }
);

await sbx.commands.run(`${bun} install`, { cwd: DEST, timeoutMs: 180_000 });
console.log("deps installed");

const LOG = "/home/user/app.log";
// NODE_ENV=production: Bun's dev server 403s any HTML request whose Host isn't
// localhost, so the public E2B URL can't load the page in dev mode.
// setsid: a plain `background: true` process dies with the SDK client session.
await sbx.commands.run(`setsid nohup ${bun} src/index.ts > ${LOG} 2>&1 < /dev/null`, {
  cwd: DEST,
  background: true,
  envs: { NODE_ENV: "production" },
});

const url = `https://${sbx.getHost(PORT)}`;
let up = false;
for (let i = 0; i < 60 && !up; i++) {
  up = (await fetch(url).catch(() => null))?.ok ?? false;
  if (!up) await Bun.sleep(1000);
}
if (!up) {
  console.error(`not reachable: ${url}\n${await sbx.files.read(LOG)}`);
  process.exit(1);
}
console.log(`\n${url}\n`);

process.on("SIGINT", async () => {
  await sbx.kill();
  process.exit(0);
});
await Promise.withResolvers().promise; // Ctrl+C to stop (sandbox auto-expires in 30min regardless)
