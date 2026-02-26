import { Hono } from "hono";
import { existsSync, mkdirSync, copyFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { renderLayout } from "../views/layout.js";
import { renderBoard } from "../views/kanban.js";
import { renderDashboard } from "../views/dashboard.js";
import { renderLogViewer } from "../views/log-viewer.js";
import { renderLogContent } from "../views/log-panel.js";
import { renderDirBrowser } from "../views/dir-browser.js";
import { getAllLoops, getLoop, setLoop, updateLoop, deleteLoop as removeLoop } from "./state.js";
import { startLoop, stopLoop, restartLoop } from "./process-manager.js";
import { sseHandler } from "./sse.js";
import { watchLoop, unwatchLoop, refreshLoopFiles } from "./file-watcher.js";
import { openTerminalWithClaude } from "./terminal.js";
import { scanProjectClaudeMdFiles } from "./context-scanner.js";
import type { RalphLoop, OnCompleteHook } from "../types.js";

/**
 * Scans project directory to detect initial Codebase Patterns.
 * Pre-populates progress.txt with detected tooling and conventions.
 */
function initializeProgressWithPatterns(projectDir: string): string {
  const patterns: string[] = [];

  // Detect package manager
  if (existsSync(join(projectDir, "pnpm-lock.yaml"))) {
    patterns.push("- Package manager: pnpm (use pnpm add/remove)");
  } else if (existsSync(join(projectDir, "bun.lockb"))) {
    patterns.push("- Package manager: bun (use bun add/remove)");
  } else if (existsSync(join(projectDir, "yarn.lock"))) {
    patterns.push("- Package manager: yarn (use yarn add/remove)");
  } else if (existsSync(join(projectDir, "package-lock.json"))) {
    patterns.push("- Package manager: npm (use npm install/uninstall)");
  }

  // Detect language
  if (existsSync(join(projectDir, "tsconfig.json"))) {
    patterns.push("- Language: TypeScript (strict typing required)");
  }

  // Detect framework from package.json
  const pkgPath = join(projectDir, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps.next) patterns.push("- Framework: Next.js");
      else if (deps.react) patterns.push("- Framework: React");
      else if (deps.vue) patterns.push("- Framework: Vue");
      else if (deps.svelte) patterns.push("- Framework: Svelte");
      else if (deps.express) patterns.push("- Framework: Express");
      else if (deps.hono) patterns.push("- Framework: Hono");
      else if (deps.fastify) patterns.push("- Framework: Fastify");

      // Testing
      if (deps.vitest) patterns.push("- Testing: vitest (run with bun test or vitest)");
      else if (deps.jest) patterns.push("- Testing: jest (run with npm test)");
      else if (deps.mocha) patterns.push("- Testing: mocha");

      // Linting
      if (deps.biome) patterns.push("- Linting: biome (run with biome check)");
      else if (deps.eslint) patterns.push("- Linting: eslint (run with eslint)");

      // Build tools
      if (deps.turbo) patterns.push("- Monorepo: Turborepo");
      if (deps.bun) patterns.push("- Runtime: bun");
    } catch {
      // Invalid package.json, skip
    }
  }

  // Detect test configs
  if (existsSync(join(projectDir, "vitest.config.ts")) || existsSync(join(projectDir, "vitest.config.js"))) {
    if (!patterns.some(p => p.includes("vitest"))) patterns.push("- Testing: vitest");
  }
  if (existsSync(join(projectDir, "jest.config.ts")) || existsSync(join(projectDir, "jest.config.js"))) {
    if (!patterns.some(p => p.includes("jest"))) patterns.push("- Testing: jest");
  }

  // Detect lint configs
  if (existsSync(join(projectDir, "biome.json"))) {
    if (!patterns.some(p => p.includes("biome"))) patterns.push("- Linting: biome");
  }
  if (existsSync(join(projectDir, ".eslintrc")) || existsSync(join(projectDir, ".eslintrc.json"))) {
    if (!patterns.some(p => p.includes("eslint"))) patterns.push("- Linting: eslint");
  }

  const patternsSection = patterns.length > 0
    ? `## Codebase Patterns\n${patterns.join("\n")}\n\n`
    : "";

  return patternsSection;
}

const MULTI_RALPH_ROOT = join(import.meta.dirname ?? ".", "../../../..");

export const app = new Hono();

// Static files
app.get("/static/*", async (c) => {
  const filePath = join(
    import.meta.dirname ?? ".",
    "../../public",
    c.req.path.replace("/static/", "")
  );
  if (!existsSync(filePath)) return c.notFound();
  const ext = filePath.split(".").pop() ?? "";
  const types: Record<string, string> = {
    css: "text/css",
    js: "application/javascript",
    html: "text/html",
  };
  const { readFileSync } = await import("node:fs");
  return c.body(readFileSync(filePath), 200, {
    "Content-Type": types[ext] || "application/octet-stream",
  });
});

// Main page - default to dashboard
app.get("/", (c) => {
  const loops = getAllLoops();
  const dashboard = renderDashboard(loops);
  return c.html(renderLayout(dashboard, "dashboard"));
});

// View routes (for HTMX navigation)
app.get("/view/dashboard", (c) => {
  const loops = getAllLoops();
  return c.html(renderDashboard(loops));
});

app.get("/view/kanban", (c) => {
  const loops = getAllLoops();
  return c.html(renderBoard(loops));
});

app.get("/view/log-viewer", (c) => {
  const loops = getAllLoops();
  const selectedId = c.req.query("loop");
  const tab = c.req.query("tab") || "progress";
  return c.html(renderLogViewer(loops, selectedId, tab));
});

// SSE
app.get("/events", sseHandler);

// Directory browser
app.get("/browse", (c) => {
  const path = c.req.query("path") || undefined;
  return c.html(renderDirBrowser(path));
});

// Create loop
app.post("/loops", async (c) => {
  const body = await c.req.parseBody();
  const projectDir = (body.projectDir as string)?.trim();
  if (!projectDir || !existsSync(projectDir)) {
    return c.html('<div class="error">Invalid project directory</div>', 400);
  }

  const baseRalphDir = join(projectDir, "scripts/ralph");

  // Auto-setup scripts/ralph/ base if missing
  if (!existsSync(baseRalphDir)) {
    const sourceDir = join(MULTI_RALPH_ROOT, "scripts/ralph");
    if (existsSync(sourceDir)) {
      mkdirSync(baseRalphDir, { recursive: true });
      for (const file of ["ralph.sh", "CLAUDE.md"]) {
        const src = join(sourceDir, file);
        if (existsSync(src)) {
          copyFileSync(src, join(baseRalphDir, file));
        }
      }
    }
  }

  const id = randomUUID().slice(0, 8);
  const ralphDir = join(baseRalphDir, "loops", id);

  // Create loop subdirectory and copy ralph.sh + CLAUDE.md from base
  mkdirSync(ralphDir, { recursive: true });
  for (const file of ["ralph.sh", "CLAUDE.md"]) {
    const src = join(baseRalphDir, file);
    if (existsSync(src)) {
      copyFileSync(src, join(ralphDir, file));
    }
  }

  // Initialize progress.txt with detected Codebase Patterns
  const { writeFileSync } = await import("node:fs");
  const patternsSection = initializeProgressWithPatterns(projectDir);
  writeFileSync(
    join(ralphDir, "progress.txt"),
    `${patternsSection}# Ralph Progress Log\nStarted: ${new Date().toISOString()}\n---\n`
  );

  // Build project-context.md (warm cache of all CLAUDE.md files in the project)
  scanProjectClaudeMdFiles(projectDir, ralphDir);

  // Build onComplete hook if provided
  let onComplete: OnCompleteHook | undefined;
  const hookType = (body.onCompleteType as string)?.trim();
  const hookValue = (body.onCompleteValue as string)?.trim();
  if (hookType && hookValue && (hookType === "webhook" || hookType === "shell")) {
    onComplete = { type: hookType, value: hookValue };
  }

  const loop: RalphLoop = {
    id,
    name: (body.name as string)?.trim() || "",
    projectDir,
    ralphDir,
    tool: (body.tool as "amp" | "claude") || "claude",
    maxIterations: parseInt(body.maxIterations as string, 10) || 30,
    status: "idle",
    pid: null,
    currentIteration: 0,
    prd: null,
    progressLog: "",
    startedAt: null,
    output: [],
    onComplete,
    metrics: {
      iterationTimes: [],
      storyAttempts: {},
      tokensPerIteration: [],
      totalTokens: 0,
      estimatedCostUsd: 0,
    },
    lastError: null,
  };

  setLoop(loop);
  watchLoop(id);

  // Auto-open terminal with Claude if no prd.json
  const hasPrd = existsSync(join(ralphDir, "prd.json"));
  let terminalOpened = false;
  if (!hasPrd) {
    terminalOpened = openTerminalWithClaude(projectDir, ralphDir);
  }

  const loops = getAllLoops();
  const board = renderBoard(loops);
  if (terminalOpened) {
    return c.html(board + renderToast(`Terminal opened at ${ralphDir}. Type 'claude' to start.`));
  }
  return c.html(board);
});

// Start loop
app.post("/loops/:id/start", (c) => {
  const result = startLoop(c.req.param("id"));
  const board = renderBoard(getAllLoops());
  if (!result.ok) {
    return c.html(board + renderToast(result.error ?? "Failed to start loop", "error"));
  }
  return c.html(board);
});

// Stop loop
app.post("/loops/:id/stop", (c) => {
  stopLoop(c.req.param("id"));
  return c.html(renderBoard(getAllLoops()));
});

// Restart loop
app.post("/loops/:id/restart", (c) => {
  restartLoop(c.req.param("id"));
  return c.html(renderBoard(getAllLoops()));
});

// Delete loop
app.delete("/loops/:id", (c) => {
  const id = c.req.param("id");
  unwatchLoop(id);
  removeLoop(id);
  return c.html(renderBoard(getAllLoops()));
});

// Log viewer
app.get("/loops/:id/log", (c) => {
  const loop = getLoop(c.req.param("id"));
  if (!loop) return c.html('<p class="log-empty">Loop not found</p>');
  const tab = (c.req.query("tab") as string) || "progress";
  return c.html(renderLogContent(loop, tab));
});

// Output partial
app.get("/loops/:id/output", (c) => {
  const loop = getLoop(c.req.param("id"));
  if (!loop) return c.html('<p class="log-empty">Loop not found</p>');
  return c.html(renderLogContent(loop, "output"));
});

// Stories partial
app.get("/loops/:id/stories", (c) => {
  const loop = getLoop(c.req.param("id"));
  if (!loop) return c.html('<p class="log-empty">Loop not found</p>');
  return c.html(renderLogContent(loop, "stories"));
});

// Open terminal with Claude for PRD setup
app.post("/loops/:id/setup-prd", (c) => {
  const loop = getLoop(c.req.param("id"));
  if (!loop) return c.html(renderBoard(getAllLoops()));
  const opened = openTerminalWithClaude(loop.projectDir, loop.ralphDir);
  const board = renderBoard(getAllLoops());
  if (opened) {
    return c.html(board + renderToast(`Terminal opened at ${loop.ralphDir}. Type 'claude' to start.`));
  }
  return c.html(board + renderToast("Could not open terminal. Place prd.json in: " + loop.ralphDir));
});

// Update notification hook
app.post("/loops/:id/notify", async (c) => {
  const loop = getLoop(c.req.param("id"));
  if (!loop) return c.html(renderBoard(getAllLoops()));
  const body = await c.req.parseBody();
  const hookType = (body.type as string)?.trim();
  const hookValue = (body.value as string)?.trim();
  if (hookType && hookValue && (hookType === "webhook" || hookType === "shell")) {
    updateLoop(loop.id, { onComplete: { type: hookType as "webhook" | "shell", value: hookValue } });
  } else {
    updateLoop(loop.id, { onComplete: undefined });
  }
  return c.html(renderBoard(getAllLoops()) + renderToast("Notification hook updated"));
});

// Review PRD (auto-split analysis)
app.post("/loops/:id/review-prd", async (c) => {
  const loop = getLoop(c.req.param("id"));
  if (!loop) return c.html(renderBoard(getAllLoops()));
  const opened = openTerminalWithClaude(loop.projectDir, loop.ralphDir);
  const board = renderBoard(getAllLoops());
  if (opened) {
    return c.html(board + renderToast("Terminal opened. Type 'claude' to start, then ask it to analyze story sizes and dependencies."));
  }
  return c.html(board + renderToast("Could not open terminal."));
});

// Refresh loop files from disk
app.post("/loops/:id/refresh", (c) => {
  const id = c.req.param("id");
  const loop = getLoop(id);
  if (!loop) return c.html(renderBoard(getAllLoops()));
  refreshLoopFiles(id);
  return c.html(renderBoard(getAllLoops()) + renderToast("Files refreshed from disk", "success"));
});

// Validate loop setup
app.post("/loops/:id/validate", (c) => {
  const loop = getLoop(c.req.param("id"));
  if (!loop) return c.html(renderBoard(getAllLoops()));

  const issues: string[] = [];

  const ralphScript = join(loop.ralphDir, "ralph.sh");
  if (!existsSync(ralphScript)) issues.push("ralph.sh not found");

  const claudeMd = join(loop.ralphDir, "CLAUDE.md");
  if (!existsSync(claudeMd)) issues.push("CLAUDE.md not found");

  const prdPath = join(loop.ralphDir, "prd.json");
  if (!existsSync(prdPath)) {
    issues.push("prd.json not found");
  } else {
    try {
      const raw = JSON.parse(readFileSync(prdPath, "utf-8"));
      const stories = raw.userStories || raw.stories || [];
      if (!Array.isArray(stories) || stories.length === 0) {
        issues.push("prd.json has no stories");
      }
    } catch {
      issues.push("prd.json is not valid JSON");
    }
  }

  if (issues.length > 0) {
    return c.html(renderBoard(getAllLoops()) + renderToast(issues.join("; "), "error"));
  }

  // Re-read files as part of validation
  refreshLoopFiles(loop.id);
  return c.html(renderBoard(getAllLoops()) + renderToast("Validation passed — loop is ready", "success"));
});

// Dismiss error
app.post("/loops/:id/dismiss-error", (c) => {
  const id = c.req.param("id");
  updateLoop(id, { lastError: null });
  return c.html(renderBoard(getAllLoops()));
});

// Board partial
app.get("/partials/board", (c) => {
  return c.html(renderBoard(getAllLoops()));
});

function renderToast(message: string, level: "info" | "error" | "success" = "info"): string {
  const cls = level === "info" ? "toast" : `toast toast-${level}`;
  const icon = level === "error" ? "&#9888;" : level === "success" ? "&#10003;" : "&#9655;";
  return `
    <div class="${cls}" id="toast-msg"
      style="animation: toastIn 0.3s ease-out, toastOut 0.5s ease-in 5s forwards">
      <span class="toast-icon">${icon}</span>
      ${message}
    </div>
    <script>
      clearTimeout(window.__toastTimer);
      const t = document.getElementById('toast-msg');
      if (t) window.__toastTimer = setTimeout(() => t.remove(), 6000);
    </script>`;
}
