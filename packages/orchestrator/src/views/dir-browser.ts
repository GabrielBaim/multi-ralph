import { readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { homedir } from "node:os";

export function renderDirBrowser(currentPath?: string): string {
  const dir = currentPath || homedir();
  const parentDir = dirname(dir);
  const canGoUp = parentDir !== dir;

  let entries: { name: string; path: string; isProject: boolean; hasRalph: boolean; hasPrd: boolean }[] = [];

  try {
    const items = readdirSync(dir, { withFileTypes: true });
    entries = items
      .filter((d) => d.isDirectory() && !d.name.startsWith("."))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((d) => {
        const fullPath = join(dir, d.name);
        const hasRalph = existsSync(join(fullPath, "scripts/ralph/ralph.sh"));
        const hasPrd = existsSync(join(fullPath, "scripts/ralph/prd.json"));
        const isProject =
          existsSync(join(fullPath, "package.json")) ||
          existsSync(join(fullPath, "Cargo.toml")) ||
          existsSync(join(fullPath, "pyproject.toml")) ||
          existsSync(join(fullPath, ".git"));
        return { name: d.name, path: fullPath, isProject, hasRalph, hasPrd };
      });
  } catch {
    // permission denied etc
  }

  // Check current dir itself
  const currentHasRalph = existsSync(join(dir, "scripts/ralph/ralph.sh"));
  const currentHasPrd = existsSync(join(dir, "scripts/ralph/prd.json"));
  const currentIsProject =
    existsSync(join(dir, "package.json")) ||
    existsSync(join(dir, "Cargo.toml")) ||
    existsSync(join(dir, "pyproject.toml")) ||
    existsSync(join(dir, ".git"));

  return `
    <div class="dir-browser">
      <div class="dir-current">
        <span class="dir-path">${escHtml(dir)}</span>
        ${currentIsProject ? '<span class="dir-badge dir-badge-project">PROJECT</span>' : ""}
        ${currentHasRalph ? '<span class="dir-badge dir-badge-ralph">RALPH</span>' : ""}
        ${currentHasPrd ? '<span class="dir-badge dir-badge-prd">PRD</span>' : ""}
      </div>
      ${currentIsProject ? `
        <div class="dir-select-row">
          <button class="btn btn-primary btn-sm" type="button"
            onclick="document.getElementById('projectDir').value='${escAttr(dir)}'; document.getElementById('dir-browser-panel').classList.remove('open');">
            SELECT THIS DIRECTORY
          </button>
          ${!currentHasPrd ? `<span class="dir-hint-inline">No prd.json - will need /prd + /ralph</span>` : ""}
        </div>
      ` : ""}
      <div class="dir-list">
        ${canGoUp ? `
          <div class="dir-entry dir-entry-up"
            hx-get="/browse?path=${encodeURIComponent(parentDir)}"
            hx-target="#dir-browser-content"
            hx-swap="innerHTML">
            <span class="dir-icon">&#8593;</span>
            <span class="dir-name">..</span>
          </div>
        ` : ""}
        ${entries.map((e) => `
          <div class="dir-entry ${e.isProject ? "dir-entry-project" : ""}"
            hx-get="/browse?path=${encodeURIComponent(e.path)}"
            hx-target="#dir-browser-content"
            hx-swap="innerHTML">
            <span class="dir-icon">${e.isProject ? "&#9632;" : "&#9654;"}</span>
            <span class="dir-name">${escHtml(e.name)}</span>
            <span class="dir-badges">
              ${e.hasRalph ? '<span class="dir-badge dir-badge-ralph">R</span>' : ""}
              ${e.hasPrd ? '<span class="dir-badge dir-badge-prd">PRD</span>' : ""}
              ${e.isProject && !e.hasRalph ? '<span class="dir-badge dir-badge-new">NEW</span>' : ""}
            </span>
          </div>
        `).join("")}
        ${entries.length === 0 ? '<div class="dir-empty">No subdirectories</div>' : ""}
      </div>
    </div>`;
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escAttr(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
