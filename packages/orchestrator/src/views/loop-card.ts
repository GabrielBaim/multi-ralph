import type { RalphLoop } from "../types.js";

export function renderLoopCard(loop: RalphLoop): string {
  const stories = loop.prd?.stories ?? [];
  const passed = stories.filter((s) => s.passes).length;
  const total = stories.length;
  const currentStory = stories
    .sort((a, b) => a.priority - b.priority)
    .find((s) => !s.passes);
  const progressPct = total > 0 ? Math.round((passed / total) * 100) : 0;

  const statusClass = `status-${loop.status}`;
  const m = loop.metrics;
  const hasMetrics = m && m.iterationTimes.length > 0;

  return `
    <div class="loop-card ${statusClass}" id="loop-${loop.id}">
      <div class="card-header">
        <div class="card-title">${escHtml(loop.name || "Unnamed Loop")}</div>
        <div class="card-status">${loop.status.toUpperCase()}</div>
      </div>
      ${loop.prd?.branchName ? `<div class="card-branch">${escHtml(loop.prd.branchName)}</div>` : ""}
      <div class="card-meta">
        <span class="card-tool">${loop.tool.toUpperCase()}</span>
        ${loop.status === "running" ? `<span class="card-iteration">ITER ${loop.currentIteration}/${loop.maxIterations}</span>` : ""}
        ${hasMetrics ? `<span class="card-cost">$${m.estimatedCostUsd.toFixed(2)}</span>` : ""}
      </div>
      ${total > 0 ? renderProgressBar(stories) : ""}
      ${currentStory ? `<div class="card-current-story">&#9654; ${escHtml(currentStory.title)}</div>` : ""}
      ${hasMetrics ? renderMiniMetrics(loop) : ""}
      ${loop.lastError ? `
        <div class="card-error">
          <span class="warning-icon">&#9888;</span>
          <span>${escHtml(loop.lastError)}</span>
          <button class="btn btn-sm btn-ghost"
            hx-post="/loops/${loop.id}/dismiss-error"
            hx-target="#main-content"
            hx-swap="innerHTML">
            &#10005;
          </button>
        </div>
      ` : ""}
      ${!loop.prd && loop.status === "idle" ? `
        <div class="card-warning">
          <span class="warning-icon">&#9888;</span>
          <span>No prd.json</span>
          <button class="btn btn-sm btn-warning card-setup-btn"
            hx-post="/loops/${loop.id}/setup-prd"
            hx-target="#main-content"
            hx-swap="innerHTML">
            SETUP PRD
          </button>
          <button class="btn btn-sm btn-ghost"
            hx-post="/loops/${loop.id}/validate"
            hx-target="#main-content"
            hx-swap="innerHTML">
            &#10003; VALIDATE
          </button>
        </div>
      ` : ""}
      <div class="card-actions">
        ${loop.status !== "running" ? `
          <button class="btn btn-sm btn-ghost"
            hx-post="/loops/${loop.id}/refresh"
            hx-target="#main-content"
            hx-swap="innerHTML">
            &#8635; REFRESH
          </button>
        ` : ""}
        <button class="btn btn-sm btn-ghost"
          hx-get="/view/log-viewer?loop=${loop.id}&tab=progress"
          hx-target="#main-content"
          hx-swap="innerHTML">
          VIEW LOG
        </button>
        ${loop.prd && loop.status === "idle" ? `
          <button class="btn btn-sm btn-ghost"
            hx-post="/loops/${loop.id}/review-prd"
            hx-target="#main-content"
            hx-swap="innerHTML">
            REVIEW PRD
          </button>
        ` : ""}
        ${loop.status === "idle" || loop.status === "stopped" || loop.status === "failed" ? `
          <button class="btn btn-sm btn-primary" hx-post="/loops/${loop.id}/start" hx-target="#main-content" hx-swap="innerHTML">
            START
          </button>
        ` : ""}
        ${loop.status === "running" ? `
          <button class="btn btn-sm btn-danger" hx-post="/loops/${loop.id}/stop" hx-target="#main-content" hx-swap="innerHTML">
            STOP
          </button>
        ` : ""}
        ${loop.status === "stopped" || loop.status === "failed" ? `
          <button class="btn btn-sm btn-warning" hx-post="/loops/${loop.id}/restart" hx-target="#main-content" hx-swap="innerHTML">
            RESTART
          </button>
        ` : ""}
        ${loop.status !== "running" ? `
          <button class="btn btn-sm btn-ghost btn-delete" hx-delete="/loops/${loop.id}" hx-target="#main-content" hx-swap="innerHTML" hx-confirm="Delete this loop?">
            &#10005;
          </button>
        ` : ""}
      </div>
    </div>`;
}

function renderMiniMetrics(loop: RalphLoop): string {
  const m = loop.metrics;
  if (!m || m.iterationTimes.length === 0) return "";

  const avgTime = m.iterationTimes.reduce((a, b) => a + b, 0) / m.iterationTimes.length;
  const avgStr = avgTime < 60000 ? `${(avgTime / 1000).toFixed(0)}s` : `${(avgTime / 60000).toFixed(1)}m`;

  return `
    <div class="card-metrics">
      <span class="card-metric" title="Total tokens">&#9671; ${(m.totalTokens / 1000).toFixed(0)}k tok</span>
      <span class="card-metric" title="Avg iteration time">&#9201; ${avgStr}/iter</span>
    </div>`;
}

function renderProgressBar(stories: { passes: boolean }[]): string {
  return `
    <div class="progress-bar">
      ${stories
        .map(
          (s) =>
            `<div class="progress-segment ${s.passes ? "passed" : "pending"}"></div>`
        )
        .join("")}
    </div>`;
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
