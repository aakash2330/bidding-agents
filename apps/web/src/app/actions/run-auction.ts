"use server";

export async function runAuctionPipeline(formData: FormData) {
  const problem = String(formData.get("problem") ?? "").trim();
  if (!problem) {
    throw new Error("Problem is required");
  }
  console.log("[runAuctionPipeline]", problem);
}
