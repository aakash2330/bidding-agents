# bidding-agents

## Setup

```bash
bun install
```

**Pi + Cursor (one-time on your machine):**

```bash
bun install -g @earendil-works/pi-coding-agent
pi install npm:@rahularya01/pi-cursor
pi
```

In Pi, run `/login cursor` and finish sign-in in the browser. That stores credentials in `~/.pi/agent/auth.json`. The auction reuses that config; you do not configure anything else in this repo.

Requires **Node 22+** for the `pi` CLI (pi-cursor). The auction still runs with `bun`.

## Run

```bash
bun run auction
```

Web UI:

```bash
bun run dev:web
```

Demo Pi workspace (`apps/demo-project`):

```bash
bun run dev --filter @bidding-agents/demo-project
```
