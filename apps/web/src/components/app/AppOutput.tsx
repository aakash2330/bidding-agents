"use client";

import { cn } from "cn";
import { ExternalLink } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { useAppBuildStore, type AppBuildSide } from "@/stores/app-build-store";

export function AppOutput({ side }: { side: AppBuildSide }) {
	const build = useAppBuildStore((s) => s.builds[side]);

	if (build.url) {
		return (
			<div className="flex flex-col">
				<div className="flex justify-end border-b p-2">
					<a
						href={build.url}
						target="_blank"
						rel="noreferrer"
						className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
					>
						Visit site
						<ExternalLink />
					</a>
				</div>
				<iframe
					src={build.url}
					title={`${side} app`}
					className="aspect-video w-full bg-white"
				/>
			</div>
		);
	}

	const label =
		build.status === "error"
			? build.error
			: build.status === "idle"
				? "Waiting for the plan…"
				: "Building…";

	return (
		<div className="flex aspect-video w-full items-center justify-center bg-muted/40 px-6 text-center text-sm text-muted-foreground">
			{label}
		</div>
	);
}
