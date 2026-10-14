import { buildApp, type AppBuildSide } from "@/server/app-builds";

export async function POST(request: Request) {
	const body = (await request.json()) as { plan?: string; side?: string };
	const plan = String(body.plan ?? "").trim();
	if (!plan) {
		return Response.json({ error: "Plan is required" }, { status: 400 });
	}

	const side: AppBuildSide = body.side === "auction" ? "auction" : "direct";

	try {
		return Response.json({ url: await buildApp(side, plan) });
	} catch (error) {
		return Response.json(
			{ error: error instanceof Error ? error.message : "Build failed" },
			{ status: 500 },
		);
	}
}
