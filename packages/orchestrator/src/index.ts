import { serve } from "@hono/node-server";
import { app } from "./server/routes.js";
import { loadState } from "./server/state.js";
import { initWatchers, unwatchAll } from "./server/file-watcher.js";
import { cleanupAll } from "./server/process-manager.js";
import { exec } from "node:child_process";
import { platform } from "node:os";

const PORT = 4747;

// Load persisted state
loadState();
initWatchers();

console.log(`
  ╔═══════════════════════════════════════╗
  ║   RALPH ORCHESTRATOR v0.1.0           ║
  ║   http://localhost:${PORT}              ║
  ╚═══════════════════════════════════════╝
`);

serve({ fetch: app.fetch, port: PORT });

// Auto-open browser
const url = `http://localhost:${PORT}`;
const cmd = platform() === "darwin" ? `open ${url}` : `xdg-open ${url}`;
exec(cmd, () => {});

// Cleanup on exit
process.on("SIGINT", () => {
  console.log("\nShutting down...");
  cleanupAll();
  unwatchAll();
  process.exit(0);
});

process.on("SIGTERM", () => {
  cleanupAll();
  unwatchAll();
  process.exit(0);
});
