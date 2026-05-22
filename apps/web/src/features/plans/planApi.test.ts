import { planErPodPhase2 } from "../../fixtures/planErPodPhase2";
import { createPlan, getPlan } from "./planApi";

const validResponse = {
  id: planErPodPhase2.planId,
  name: planErPodPhase2.name,
  description: planErPodPhase2.description,
  layout: planErPodPhase2,
  createdAt: "2026-05-22T00:00:00+00:00",
  updatedAt: "2026-05-22T00:00:00+00:00"
};

const okFetch: typeof fetch = async () =>
  new Response(JSON.stringify(validResponse), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });

const invalidFetch: typeof fetch = async () =>
  new Response(JSON.stringify({ ...validResponse, layout: { ...planErPodPhase2, unknown: true } }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });

const createResult = await withFetch(okFetch, () =>
  createPlan("http://localhost:8010", planErPodPhase2, planErPodPhase2.description)
);
if (createResult.id !== planErPodPhase2.planId) {
  throw new Error("createPlan must return the validated plan response");
}

await withFetch(invalidFetch, async () => {
  try {
    await getPlan("http://localhost:8010", planErPodPhase2.planId);
    throw new Error("Invalid API response must be rejected");
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("not allowed")) {
      throw error;
    }
  }
});

const mismatchedIdFetch: typeof fetch = async () =>
  new Response(JSON.stringify({ ...validResponse, id: "different-plan-id" }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });

await withFetch(mismatchedIdFetch, async () => {
  try {
    await getPlan("http://localhost:8010", planErPodPhase2.planId);
    throw new Error("Mismatched response id must be rejected");
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("layout.planId")) {
      throw error;
    }
  }
});

const mismatchedDescriptionFetch: typeof fetch = async () =>
  new Response(JSON.stringify({ ...validResponse, description: "Response drift" }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });

await withFetch(mismatchedDescriptionFetch, async () => {
  try {
    await getPlan("http://localhost:8010", planErPodPhase2.planId);
    throw new Error("Mismatched response description must be rejected");
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("layout.description")) {
      throw error;
    }
  }
});

try {
  await createPlan("http://localhost:8010", planErPodPhase2, "Different description");
  throw new Error("Mismatched request description must be rejected");
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes("layout.description")) {
    throw error;
  }
}

async function withFetch<T>(fetchImpl: typeof fetch, callback: () => Promise<T>): Promise<T> {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetchImpl;
  try {
    return await callback();
  } finally {
    globalThis.fetch = originalFetch;
  }
}
