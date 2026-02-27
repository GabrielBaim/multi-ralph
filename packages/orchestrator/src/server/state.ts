import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { RalphLoop } from "../types.js";

const STATE_FILE = join(
  import.meta.dirname ?? ".",
  "../../.orchestrator-state.json"
);

let loops: Map<string, RalphLoop> = new Map();

export function getAllLoops(): RalphLoop[] {
  return Array.from(loops.values());
}

export function getLoop(id: string): RalphLoop | undefined {
  return loops.get(id);
}

export function setLoop(loop: RalphLoop): void {
  loops.set(loop.id, loop);
  persist();
}

export function deleteLoop(id: string): boolean {
  const deleted = loops.delete(id);
  if (deleted) persist();
  return deleted;
}

export function updateLoop(
  id: string,
  patch: Partial<RalphLoop>
): RalphLoop | undefined {
  const loop = loops.get(id);
  if (!loop) return undefined;
  const updated = { ...loop, ...patch };
  loops.set(id, updated);
  persist();
  return updated;
}

function persist(): void {
  try {
    const data = Object.fromEntries(loops);
    writeFileSync(STATE_FILE, JSON.stringify(data, null, 2));
  } catch {
    // silent - persistence is best-effort
  }
}

export function loadState(): void {
  try {
    if (!existsSync(STATE_FILE)) return;
    const raw = readFileSync(STATE_FILE, "utf-8");
    const data = JSON.parse(raw) as Record<string, RalphLoop>;
    loops = new Map(Object.entries(data));
    // Reset running loops to idle on restart (processes don't survive)
    // Also ensure metrics field exists for loops created before this feature
    const defaultMetrics = {
      iterationTimes: [],
      storyAttempts: {},
      tokensPerIteration: [],
      totalTokens: 0,
      estimatedCostUsd: 0,
      testCoverage: 0,
      testFirstCompliance: 0,
      failureReasons: {},
      velocity: 0,
      cumulativeFlowData: [],
      timePerStory: {},
      rollbackCount: 0,
      storiesCompleted: 0,
      storiesInProgress: 0,
    };
    for (const [id, loop] of loops) {
      const patch: Partial<typeof loop> = {};
      if (loop.status === "running") {
        patch.status = "idle";
        patch.pid = null;
      }
      if (!loop.metrics) {
        patch.metrics = defaultMetrics;
      }
      if (loop.lastError === undefined) {
        patch.lastError = null;
      }
      if (Object.keys(patch).length > 0) {
        loops.set(id, { ...loop, ...patch });
      }
    }
    persist();
  } catch {
    // corrupt state file - start fresh
    loops = new Map();
  }
}
