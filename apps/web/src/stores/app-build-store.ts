import { create } from "zustand";

export type AppBuildSide = "direct" | "auction";

export type AppBuildState = {
	status: "idle" | "building" | "ready" | "error";
	url: string | null;
	error: string | null;
};

const IDLE: AppBuildState = { status: "idle", url: null, error: null };

type AppBuildStore = {
	builds: Record<AppBuildSide, AppBuildState>;
	startBuild: (side: AppBuildSide, plan: string) => Promise<void>;
	resetBuilds: () => void;
};

export const useAppBuildStore = create<AppBuildStore>((set) => {
	// A newer run supersedes an older one: stale responses must not touch the UI.
	const current: Record<AppBuildSide, number> = { direct: 0, auction: 0 };

	function patch(side: AppBuildSide, next: AppBuildState): void {
		set((state) => ({ builds: { ...state.builds, [side]: next } }));
	}

	return {
		builds: { direct: IDLE, auction: IDLE },
		resetBuilds: () => {
			current.direct++;
			current.auction++;
			set({ builds: { direct: IDLE, auction: IDLE } });
		},
		startBuild: async (side, plan) => {
			const mine = ++current[side];
			patch(side, { status: "building", url: null, error: null });
			try {
				// Resolves only once pi has implemented the plan and the sandbox
				// is serving, so the response carries the finished app's URL.
				const response = await fetch("/api/app/build", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ side, plan }),
				});
				const data = (await response.json().catch(() => null)) as
					| { url?: string; error?: string }
					| null;
				if (current[side] !== mine) return;
				if (!response.ok || !data?.url) {
					patch(side, {
						status: "error",
						url: null,
						error: data?.error ?? "Build failed",
					});
					return;
				}
				patch(side, { status: "ready", url: data.url, error: null });
			} catch (error) {
				if (current[side] !== mine) return;
				patch(side, {
					status: "error",
					url: null,
					error: error instanceof Error ? error.message : "Build failed",
				});
			}
		},
	};
});
