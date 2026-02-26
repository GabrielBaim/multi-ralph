import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Scans the project directory for all CLAUDE.md files and consolidates
 * them into a single project-context.md in the loop's ralph directory.
 * This gives the agent a warm cache of project knowledge on every iteration.
 */
export function scanProjectClaudeMdFiles(projectDir: string, ralphDir: string): void {
  try {
    // Include ALL CLAUDE.md files from projectDir - loop's own CLAUDE.md is in ralphDir
    // so there's no collision. Root CLAUDE.md contains essential project-level context.
    const claudeFiles = findClaudeMdFiles(projectDir);

    if (claudeFiles.length === 0) return;

    let content = "";
    for (const filePath of claudeFiles) {
      const relPath = relative(projectDir, filePath);
      const fileContent = readFileSync(filePath, "utf-8").trim();
      if (!fileContent) continue;
      content += `### ${relPath}\n\n${fileContent}\n\n---\n\n`;
    }

    if (content) {
      writeFileSync(join(ralphDir, "project-context.md"), content);
    }
  } catch {
    // Best effort — don't block loop creation
  }
}

const SKIP_DIRS = new Set([
  "node_modules", ".git", ".next", "dist", "build", ".cache",
  "__pycache__", ".venv", "venv", ".turbo", ".vercel", "coverage",
  "scripts", // Skip ralph's own scripts directory
]);

function findClaudeMdFiles(dir: string, depth = 0): string[] {
  if (depth > 5) return []; // Limit depth to avoid deep recursion

  const results: string[] = [];

  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "CLAUDE.md" && entry.isFile()) {
        results.push(join(dir, entry.name));
      }
      if (entry.isDirectory() && !SKIP_DIRS.has(entry.name) && !entry.name.startsWith(".")) {
        results.push(...findClaudeMdFiles(join(dir, entry.name), depth + 1));
      }
    }
  } catch {
    // Permission errors, etc.
  }

  return results;
}
