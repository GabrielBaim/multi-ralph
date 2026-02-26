import type { RalphLoop } from "../types.js";

export function renderDashboard(loops: RalphLoop[]): string {
  const totalLoops = loops.length;
  const runningLoops = loops.filter((l) => l.status === "running").length;
  const completedLoops = loops.filter((l) => l.status === "completed").length;
  const failedLoops = loops.filter((l) => ["failed", "stopped"].includes(l.status)).length;

  const totalTokens = loops.reduce((sum, l) => sum + l.metrics.totalTokens, 0);
  const totalCost = loops.reduce((sum, l) => sum + l.metrics.estimatedCostUsd, 0);
  const totalIterations = loops.reduce((sum, l) => sum + l.metrics.iterationTimes.length, 0);

  const totalStories = loops.reduce((sum, l) => sum + (l.prd?.stories.length || 0), 0);
  const passedStories = loops.reduce((sum, l) => sum + (l.prd?.stories.filter((s) => s.passes).length || 0), 0);

  return `
    <div class="dashboard-view">
      <div class="dashboard-header">
        <h2>SYSTEM OVERVIEW</h2>
      </div>

      <div class="dashboard-summary">
        <div class="summary-card">
          <div class="summary-value">${totalLoops}</div>
          <div class="summary-label">TOTAL LOOPS</div>
        </div>
        <div class="summary-card summary-running">
          <div class="summary-value">${runningLoops}</div>
          <div class="summary-label">RUNNING</div>
        </div>
        <div class="summary-card summary-completed">
          <div class="summary-value">${completedLoops}</div>
          <div class="summary-label">COMPLETED</div>
        </div>
        <div class="summary-card summary-failed">
          <div class="summary-value">${failedLoops}</div>
          <div class="summary-label">FAILED</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${totalIterations}</div>
          <div class="summary-label">ITERATIONS</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${totalTokens.toLocaleString()}</div>
          <div class="summary-label">TOTAL TOKENS</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">$${totalCost.toFixed(2)}</div>
          <div class="summary-label">EST. COST</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${passedStories}/${totalStories}</div>
          <div class="summary-label">STORIES</div>
        </div>
      </div>

      <div class="dashboard-section">
        <h3>LOOP METRICS</h3>
        ${loops.length === 0 ? '<p class="dashboard-empty">No loops yet. Create a new loop to get started.</p>' : ""}
        <div class="loop-metrics-grid">
          ${loops.map((loop) => renderLoopMetricsCard(loop)).join("")}
        </div>
      </div>
    </div>`;
}

function renderLoopMetricsCard(loop: RalphLoop): string {
  const m = loop.metrics;
  const totalStories = loop.prd?.stories.length || 0;
  const passedStories = loop.prd?.stories.filter((s) => s.passes).length || 0;
  const progressPct = totalStories > 0 ? Math.round((passedStories / totalStories) * 100) : 0;

  const statusClass = loop.status === "running" ? "metrics-running" :
    loop.status === "completed" ? "metrics-completed" :
      ["failed", "stopped"].includes(loop.status) ? "metrics-failed" : "";

  const avgTime = m.iterationTimes.length > 0
    ? m.iterationTimes.reduce((a, b) => a + b, 0) / m.iterationTimes.length
    : 0;

  return `
    <div class="loop-metrics-card ${statusClass}">
      <div class="metrics-card-header">
        <span class="metrics-card-title">${escHtml(loop.name)}</span>
        <span class="metrics-card-status ${loop.status}">${loop.status.toUpperCase()}</span>
      </div>

      <div class="metrics-card-progress">
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width: ${progressPct}%"></div>
        </div>
        <span class="progress-text">${passedStories}/${totalStories} (${progressPct}%)</span>
      </div>

      <div class="metrics-card-grid">
        <div class="mini-metric">
          <span class="mini-metric-value">${m.iterationTimes.length}</span>
          <span class="mini-metric-label">ITERS</span>
        </div>
        <div class="mini-metric">
          <span class="mini-metric-value">${formatDuration(avgTime)}</span>
          <span class="mini-metric-label">AVG TIME</span>
        </div>
        <div class="mini-metric">
          <span class="mini-metric-value">${m.totalTokens > 0 ? (m.totalTokens / 1000).toFixed(1) + "k" : "0"}</span>
          <span class="mini-metric-label">TOKENS</span>
        </div>
        <div class="mini-metric">
          <span class="mini-metric-value">$${m.estimatedCostUsd.toFixed(2)}</span>
          <span class="mini-metric-label">COST</span>
        </div>
      </div>

      <div class="metrics-card-actions">
        <button class="btn btn-sm btn-ghost"
          hx-get="/loops/${loop.id}/log?tab=metrics"
          hx-target="#main-content"
          hx-swap="innerHTML">
          DETAILS
        </button>
      </div>
    </div>`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.round((ms % 60000) / 1000);
  return `${mins}m${secs}s`;
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
