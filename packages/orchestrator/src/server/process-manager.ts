import { spawn, exec, type ChildProcess } from "node:child_process";
import { join } from "node:path";
import { existsSync, readFileSync, copyFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { getLoop, updateLoop } from "./state.js";
import { broadcast } from "./sse.js";

const processes = new Map<string, ChildProcess>();
const MAX_OUTPUT_LINES = 200;

function syncMetricsToFile(loopId: string): void {
  const loop = getLoop(loopId);
  if (!loop) return;

  const metricsPath = join(loop.ralphDir, "metrics.json");
  try {
    writeFileSync(metricsPath, JSON.stringify(loop.metrics, null, 2));
  } catch (err) {
    console.error(`Failed to sync metrics for loop ${loopId}:`, err);
  }
}

export interface StartResult {
  ok: boolean;
  error?: string;
}

export function startLoop(loopId: string): StartResult {
  const loop = getLoop(loopId);
  if (!loop) return { ok: false, error: "Loop not found" };
  if (loop.status === "running") return { ok: false, error: "Loop is already running" };

  const ralphScript = join(loop.ralphDir, "ralph.sh");

  // Pre-flight checks
  if (!existsSync(ralphScript)) {
    const msg = `ralph.sh not found at ${ralphScript}`;
    updateLoop(loopId, { lastError: msg });
    broadcast({ type: "loop-update", loopId });
    return { ok: false, error: msg };
  }

  const prdPath = join(loop.ralphDir, "prd.json");
  if (!existsSync(prdPath)) {
    const msg = "prd.json not found — create it before starting";
    updateLoop(loopId, { lastError: msg });
    broadcast({ type: "loop-update", loopId });
    return { ok: false, error: msg };
  }

  try {
    const prdRaw = JSON.parse(readFileSync(prdPath, "utf-8"));
    const stories = prdRaw.userStories || prdRaw.stories || [];
    if (!Array.isArray(stories) || stories.length === 0) {
      const msg = "prd.json has no stories — add at least one story";
      updateLoop(loopId, { lastError: msg });
      broadcast({ type: "loop-update", loopId });
      return { ok: false, error: msg };
    }
  } catch {
    const msg = "prd.json is not valid JSON";
    updateLoop(loopId, { lastError: msg });
    broadcast({ type: "loop-update", loopId });
    return { ok: false, error: msg };
  }

  // Re-copy ralph.sh from orchestrator source to ensure the loop has the latest version
  // Source: multi-ralph/scripts/ralph/ralph.sh (canonical), fallback to project base
  const orchestratorRoot = join(import.meta.dirname ?? ".", "../../../..");
  const sourceRalphScript = join(orchestratorRoot, "scripts/ralph/ralph.sh");
  const projectBaseRalphScript = join(dirname(dirname(loop.ralphDir)), "ralph.sh");
  const bestSource = existsSync(sourceRalphScript) ? sourceRalphScript : projectBaseRalphScript;
  if (existsSync(bestSource)) {
    try {
      copyFileSync(bestSource, ralphScript);
      // Also update the project base copy so future manual runs work
      if (bestSource === sourceRalphScript && existsSync(dirname(projectBaseRalphScript))) {
        copyFileSync(bestSource, projectBaseRalphScript);
      }
    } catch {
      // best effort — loop dir copy may already be current
    }
  }

  const child = spawn("zsh", [ralphScript, "--tool", loop.tool, String(loop.maxIterations)], {
    cwd: loop.ralphDir,
    env: { ...process.env, RALPH_LOOP_DIR: loop.ralphDir },
    stdio: ["ignore", "pipe", "pipe"],
  });

  processes.set(loopId, child);

  const iterationStartTime = Date.now();

  updateLoop(loopId, {
    status: "running",
    pid: child.pid ?? null,
    currentIteration: 0,
    startedAt: new Date().toISOString(),
    output: [],
    lastError: null,
  });

  const outputBuffer: string[] = [];

  function pushOutput(line: string) {
    outputBuffer.push(line);
    if (outputBuffer.length > MAX_OUTPUT_LINES) {
      outputBuffer.shift();
    }
    updateLoop(loopId, { output: [...outputBuffer] });
  }

  function handleData(data: Buffer) {
    const text = data.toString();
    const lines = text.split("\n");
    for (const line of lines) {
      if (!line) continue;
      pushOutput(line);

      // Parse iteration marker
      const iterMatch = line.match(/Ralph Iteration (\d+) of (\d+)/);
      if (iterMatch) {
        updateLoop(loopId, { currentIteration: parseInt(iterMatch[1], 10) });
      }

      // Parse completion signal
      if (line.includes("<promise>COMPLETE</promise>")) {
        updateLoop(loopId, { status: "completed" });
      }

      // Parse metrics from ralph.sh output (iteration time and tokens)
      const metricsMatch = line.match(/Iteration \d+ complete \((\d+)ms, ~(\d+) tokens\)/);
      if (metricsMatch) {
        const currentLoop = getLoop(loopId);
        if (currentLoop) {
          const metrics = { ...currentLoop.metrics };
          const iterTime = parseInt(metricsMatch[1], 10);
          const tokens = parseInt(metricsMatch[2], 10);
          metrics.iterationTimes = [...metrics.iterationTimes, iterTime];
          metrics.tokensPerIteration = [...metrics.tokensPerIteration, tokens];
          metrics.totalTokens += tokens;
          metrics.estimatedCostUsd = metrics.totalTokens * 0.000015;
          updateLoop(loopId, { metrics });
          syncMetricsToFile(loopId);
        }
      }

      // Parse story attempt tracking
      const storyAttemptMatch = line.match(/Target story: ([\w-]+)/);
      if (storyAttemptMatch) {
        const currentLoop = getLoop(loopId);
        if (currentLoop) {
          const metrics = { ...currentLoop.metrics };
          const storyId = storyAttemptMatch[1];
          metrics.storyAttempts = { ...metrics.storyAttempts };
          metrics.storyAttempts[storyId] = (metrics.storyAttempts[storyId] || 0) + 1;
          updateLoop(loopId, { metrics });
          syncMetricsToFile(loopId);
        }
      }
    }
    broadcast({ type: "loop-update", loopId });
  }

  child.stdout?.on("data", handleData);
  child.stderr?.on("data", handleData);

  child.on("close", (code) => {
    processes.delete(loopId);
    const current = getLoop(loopId);
    if (current && current.status === "running") {
      const newStatus = code === 0 ? "completed" : "failed";
      const patch: Record<string, any> = { status: newStatus, pid: null };
      if (code !== 0) {
        const lastLines = outputBuffer.slice(-10).join("\n");
        patch.lastError = `Process exited with code ${code}\n${lastLines}`;
      }
      updateLoop(loopId, patch);
      if (newStatus === "completed") {
        executeOnCompleteHook(loopId);
      }
    } else if (current) {
      updateLoop(loopId, { pid: null });
      if (current.status === "completed") {
        executeOnCompleteHook(loopId);
      }
    }
    broadcast({ type: "loop-update", loopId });
  });

  child.on("error", (err) => {
    processes.delete(loopId);
    pushOutput(`ERROR: ${err.message}`);
    updateLoop(loopId, { status: "failed", pid: null, lastError: err.message });
    broadcast({ type: "loop-update", loopId });
  });

  broadcast({ type: "loop-update", loopId });
  return { ok: true };
}

export function stopLoop(loopId: string): boolean {
  const child = processes.get(loopId);
  if (!child) return false;

  child.kill("SIGTERM");

  // Force kill after 5s if still running
  setTimeout(() => {
    if (processes.has(loopId)) {
      child.kill("SIGKILL");
    }
  }, 5000);

  updateLoop(loopId, { status: "stopped" });
  broadcast({ type: "loop-update", loopId });
  return true;
}

export function restartLoop(loopId: string): boolean {
  stopLoop(loopId);
  // Small delay to let process terminate
  setTimeout(() => startLoop(loopId), 1000);
  return true;
}

export function cleanupAll(): void {
  for (const [id, child] of processes) {
    child.kill("SIGTERM");
    processes.delete(id);
  }
}

function executeOnCompleteHook(loopId: string): void {
  const loop = getLoop(loopId);
  if (!loop?.onComplete) return;

  const { type, value } = loop.onComplete;

  try {
    if (type === "webhook") {
      const payload = JSON.stringify({
        loopId: loop.id,
        name: loop.name,
        status: loop.status,
        iterations: loop.currentIteration,
        projectDir: loop.projectDir,
        metrics: loop.metrics,
        completedAt: new Date().toISOString(),
      });

      fetch(value, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      }).catch((err) => {
        console.error(`Webhook failed for loop ${loopId}:`, err.message);
      });
    } else if (type === "shell") {
      exec(value, {
        env: {
          ...process.env,
          RALPH_LOOP_ID: loop.id,
          RALPH_LOOP_NAME: loop.name,
          RALPH_STATUS: loop.status,
          RALPH_ITERATIONS: String(loop.currentIteration),
          RALPH_PROJECT_DIR: loop.projectDir,
        },
      }, (err) => {
        if (err) {
          console.error(`Shell hook failed for loop ${loopId}:`, err.message);
        }
      });
    }
  } catch (err: any) {
    console.error(`Hook execution failed for loop ${loopId}:`, err.message);
  }
}
