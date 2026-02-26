import { watch, type FSWatcher } from "chokidar";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import type { NormalizedPrd, PrdStory } from "../types.js";
import { getLoop, updateLoop, getAllLoops } from "./state.js";
import { broadcast } from "./sse.js";

const watchers = new Map<string, FSWatcher>();

export function watchLoop(loopId: string): void {
  const loop = getLoop(loopId);
  if (!loop) return;

  // Stop existing watcher if any
  unwatchLoop(loopId);

  // Always watch the directory so we catch newly created files (prd.json, metrics.json, etc.)
  const watcher = watch(loop.ralphDir, {
    depth: 0,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
  });

  watcher.on("change", (path) => {
    if (path.endsWith("prd.json")) {
      const prd = readPrd(loop.ralphDir);
      if (prd) {
        updateLoop(loopId, { prd, name: loop.name || prd.project });
        // Update loops manifest for loop-to-loop awareness
        updateLoopsManifest(loop.projectDir);
        broadcast({ type: "loop-update", loopId });
      }
    }
    if (path.endsWith("progress.txt")) {
      const progressLog = readProgress(loop.ralphDir);
      updateLoop(loopId, { progressLog });
      broadcast({ type: "log-update", loopId });
    }
    if (path.endsWith("metrics.json")) {
      const metrics = readMetrics(loop.ralphDir);
      if (metrics) {
        updateLoop(loopId, { metrics });
        broadcast({ type: "loop-update", loopId });
      }
    }
  });

  watcher.on("add", (path) => {
    if (path.endsWith("prd.json")) {
      const prd = readPrd(loop.ralphDir);
      if (prd) {
        updateLoop(loopId, { prd, name: loop.name || prd.project });
        updateLoopsManifest(loop.projectDir);
        broadcast({ type: "loop-update", loopId });
      }
    }
  });

  watchers.set(loopId, watcher);

  // Initial read
  refreshLoopFiles(loopId);
}

/** Re-read PRD, progress, and metrics from disk for a loop */
export function refreshLoopFiles(loopId: string): void {
  const loop = getLoop(loopId);
  if (!loop) return;

  const prd = readPrd(loop.ralphDir);
  const progressLog = readProgress(loop.ralphDir);
  const metrics = readMetrics(loop.ralphDir);
  updateLoop(loopId, {
    prd: prd ?? loop.prd,
    name: loop.name || prd?.project || loop.name,
    progressLog,
    ...(metrics ? { metrics } : {}),
  });
}

export function unwatchLoop(loopId: string): void {
  const watcher = watchers.get(loopId);
  if (watcher) {
    watcher.close();
    watchers.delete(loopId);
  }
}

export function unwatchAll(): void {
  for (const [id] of watchers) {
    unwatchLoop(id);
  }
}

export function initWatchers(): void {
  for (const loop of getAllLoops()) {
    watchLoop(loop.id);
  }
}

function readPrd(ralphDir: string): NormalizedPrd | null {
  const prdPath = join(ralphDir, "prd.json");
  try {
    if (!existsSync(prdPath)) return null;
    const raw = JSON.parse(readFileSync(prdPath, "utf-8"));

    // Normalize: support both userStories and stories
    const rawStories: any[] = raw.userStories || raw.stories || [];
    const stories: PrdStory[] = rawStories.map((s: any, i: number) => ({
      id: s.id || `story-${i + 1}`,
      title: s.title || s.name || "Untitled",
      passes: s.passes === true,
      priority: s.priority ?? i + 1,
      dependsOn: Array.isArray(s.dependsOn) ? s.dependsOn : undefined,
      verification: s.verification && s.verification.command ? {
        command: s.verification.command,
        expect: s.verification.expect || "exit 0",
      } : undefined,
    }));

    return {
      project: raw.project || raw.name || "Unknown Project",
      branchName: raw.branchName || raw.branch || "",
      description: raw.description || "",
      stories,
    };
  } catch (err) {
    console.error(`Failed to read PRD at ${prdPath}:`, err);
    return null;
  }
}

function readProgress(ralphDir: string): string {
  const progressPath = join(ralphDir, "progress.txt");
  try {
    if (!existsSync(progressPath)) return "";
    return readFileSync(progressPath, "utf-8");
  } catch {
    return "";
  }
}

function readMetrics(ralphDir: string): any | null {
  const metricsPath = join(ralphDir, "metrics.json");
  try {
    if (!existsSync(metricsPath)) return null;
    return JSON.parse(readFileSync(metricsPath, "utf-8"));
  } catch {
    return null;
  }
}

/**
 * Updates a loops-manifest.json in scripts/ralph/loops/ listing all active loops
 * and their branches. This enables loop-to-loop awareness.
 */
function updateLoopsManifest(projectDir: string): void {
  try {
    const loopsDir = join(projectDir, "scripts/ralph/loops");

    // Ensure directory exists
    if (!existsSync(loopsDir)) {
      mkdirSync(loopsDir, { recursive: true });
    }

    const allLoops = getAllLoops().filter((l) => l.projectDir === projectDir);
    const manifest = allLoops.map((l) => ({
      id: l.id,
      name: l.name,
      branch: l.prd?.branchName || "",
      status: l.status,
      ralphDir: l.ralphDir,
      currentIteration: l.currentIteration,
      storiesCompleted: l.prd?.stories?.filter(s => s.passes).length || 0,
      storiesTotal: l.prd?.stories?.length || 0,
      lastUpdated: new Date().toISOString(),
    }));

    writeFileSync(join(loopsDir, "loops-manifest.json"), JSON.stringify(manifest, null, 2));
  } catch (err) {
    console.error("Failed to update loops manifest:", err);
  }
}
