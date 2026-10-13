// just like auction/stream/route.ts, but for direct mode, it just calls the pi package and get's the plan directly

import { runPiAgentTurn } from "@bidding-agents/pi";

export async function POST(request: Request) {
  const body = (await request.json()) as { problem?: string };
  const problem = String(body.problem ?? "").trim();
  if (!problem) {
    return Response.json({ error: "Problem is required" }, { status: 400 });
  }

  const { reply } = await runPiAgentTurn(
    [
      "You are the planner for a single-agent build.",
      "Break the goal below into an ordered implementation plan — the final plan, not a draft.",
      "",
      "Each step is a clear task brief: enough context to act on, without prescribing every implementation detail.",
      "Explore the repo with your tools when the goal depends on what is already there.",
      "",
      "Return only the plan as markdown, numbered steps under a `# Plan` heading.",
      "Do not ask questions, do not offer to implement it, and do not put anything after the plan.",
      "",
      "Goal:",
      problem,
    ].join("\n"),
  );
  return Response.json({ plan: reply });
}