"use server";

export async function runAuctionPipeline(formData: FormData) {
  const problem = String(formData.get("problem") ?? "").trim();
  if (!problem) {
    throw new Error("Problem is required");
  }

  // Placeholder: invoke @bidding-agents/auction pipeline (see packages/auction).
  console.log("[runAuctionPipeline]", problem);
}
