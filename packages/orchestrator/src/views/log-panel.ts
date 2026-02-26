import type { RalphLoop } from "../types.js";

export function renderLogContent(loop: RalphLoop, tab: string = "progress"): string {
  return `
    <div class="log-detail">
      <div class="log-detail-header">
        <div class="log-detail-title-row">
          <span class="log-status-indicator ${loop.status}"></span>
          <h2 class="log-detail-title">${escHtml(loop.name)}</h2>
          <span class="log-detail-status ${loop.status}">${loop.status.toUpperCase()}</span>
        </div>
        <div class="log-detail-meta">
          <span class="log-meta-item">
            <span class="log-meta-label">Tool:</span>
            <span class="log-meta-value">${loop.tool.toUpperCase()}</span>
          </span>
          <span class="log-meta-item">
            <span class="log-meta-label">Iteration:</span>
            <span class="log-meta-value">${loop.currentIteration}/${loop.maxIterations}</span>
          </span>
          ${loop.metrics.totalTokens > 0 ? `
          <span class="log-meta-item">
            <span class="log-meta-label">Tokens:</span>
            <span class="log-meta-value">${loop.metrics.totalTokens.toLocaleString()}</span>
          </span>
          ` : ""}
          ${loop.metrics.estimatedCostUsd > 0 ? `
          <span class="log-meta-item">
            <span class="log-meta-label">Cost:</span>
            <span class="log-meta-value">$${loop.metrics.estimatedCostUsd.toFixed(2)}</span>
          </span>
          ` : ""}
        </div>
      </div>

      <div class="log-tabs-container">
        <div class="log-tabs">
          <button class="log-tab ${tab === "progress" ? "active" : ""}"
            hx-get="/loops/${loop.id}/log?tab=progress"
            hx-target="#log-viewer-content"
            hx-swap="innerHTML"
            hx-indicator=".log-loading">
            <span class="tab-icon">&#128196;</span>
            PROGRESS
          </button>
          <button class="log-tab ${tab === "timeline" ? "active" : ""}"
            hx-get="/loops/${loop.id}/log?tab=timeline"
            hx-target="#log-viewer-content"
            hx-swap="innerHTML"
            hx-indicator=".log-loading">
            <span class="tab-icon">&#128197;</span>
            TIMELINE
          </button>
          <button class="log-tab ${tab === "output" ? "active" : ""}"
            hx-get="/loops/${loop.id}/log?tab=output"
            hx-target="#log-viewer-content"
            hx-swap="innerHTML"
            hx-indicator=".log-loading">
            <span class="tab-icon">&#128187;</span>
            STDOUT
          </button>
          <button class="log-tab ${tab === "stories" ? "active" : ""}"
            hx-get="/loops/${loop.id}/log?tab=stories"
            hx-target="#log-viewer-content"
            hx-swap="innerHTML"
            hx-indicator=".log-loading">
            <span class="tab-icon">&#128203;</span>
            STORIES
          </button>
          <button class="log-tab ${tab === "metrics" ? "active" : ""}"
            hx-get="/loops/${loop.id}/log?tab=metrics"
            hx-target="#log-viewer-content"
            hx-swap="innerHTML"
            hx-indicator=".log-loading">
            <span class="tab-icon">&#128200;</span>
            METRICS
          </button>
        </div>
      </div>

      <div class="log-content-body ${tab}">
        <div class="log-loading htmx-indicator">
          <span class="loading-spinner"></span>
          <span>Loading...</span>
        </div>
        ${tab === "progress" ? renderProgress(loop) : ""}
        ${tab === "timeline" ? renderTimeline(loop) : ""}
        ${tab === "output" ? renderOutput(loop) : ""}
        ${tab === "stories" ? renderStories(loop) : ""}
        ${tab === "metrics" ? renderMetrics(loop) : ""}
      </div>
    </div>`;
}

function renderProgress(loop: RalphLoop): string {
  if (!loop.progressLog) {
    return `
      <div class="log-empty-state">
        <div class="empty-icon">&#128196;</div>
        <h3>No Progress Log</h3>
        <p>Start the loop to see progress information here.</p>
      </div>`;
  }
  return `<pre class="log-pre">${escHtml(loop.progressLog)}</pre>`;
}

function renderTimeline(loop: RalphLoop): string {
  const entries = parseProgressEntries(loop.progressLog);
  if (entries.length === 0) {
    return `
      <div class="log-empty-state">
        <div class="empty-icon">&#128197;</div>
        <h3>No Timeline Data</h3>
        <p>Timeline entries will appear as the loop processes stories.</p>
      </div>`;
  }

  const metrics = loop.metrics;

  return `
    <div class="timeline">
      ${entries.map((entry, i) => {
        const time = metrics.iterationTimes[i];
        const tokens = metrics.tokensPerIteration[i];
        const timeStr = time ? formatDuration(time) : "—";
        const tokenStr = tokens ? `~${tokens.toLocaleString()} tok` : "";

        return `
        <div class="timeline-entry ${entry.passed ? "timeline-pass" : "timeline-fail"}">
          <div class="timeline-marker"></div>
          <div class="timeline-content">
            <div class="timeline-header">
              <span class="timeline-story-id">${escHtml(entry.storyId)}</span>
              <span class="timeline-badge">${entry.passed ? "PASS" : "ATTEMPT"}</span>
              <span class="timeline-time">${escHtml(entry.timestamp)}</span>
            </div>
            <div class="timeline-summary">${escHtml(entry.summary)}</div>
            <div class="timeline-meta">
              ${timeStr ? `<span class="timeline-duration">&#9201; ${timeStr}</span>` : ""}
              ${tokenStr ? `<span class="timeline-tokens">&#9671; ${tokenStr}</span>` : ""}
            </div>
          </div>
        </div>`;
      }).join("")}
    </div>`;
}

function renderOutput(loop: RalphLoop): string {
  if (!loop.output.length) {
    return `
      <div class="log-empty-state">
        <div class="empty-icon">&#128187;</div>
        <h3>No Output Yet</h3>
        <p>Stdout will appear here when the loop is running.</p>
      </div>`;
  }
  return `<pre class="log-pre log-output">${loop.output.map(escHtml).join("\n")}</pre>`;
}

function renderStories(loop: RalphLoop): string {
  if (!loop.prd?.stories.length) {
    return `
      <div class="log-empty-state">
        <div class="empty-icon">&#128203;</div>
        <h3>No Stories</h3>
        <p>Add a prd.json with user stories to see them here.</p>
      </div>`;
  }

  const stories = loop.prd.stories;
  const metrics = loop.metrics;
  const passedCount = stories.filter(s => s.passes).length;
  const totalCount = stories.length;

  return `
    <div class="stories-container">
      <div class="stories-header">
        <span class="stories-progress-text">${passedCount}/${totalCount} stories completed</span>
        <div class="stories-progress-bar">
          <div class="stories-progress-fill" style="width: ${totalCount > 0 ? (passedCount/totalCount*100) : 0}%"></div>
        </div>
      </div>
      <div class="stories-list">
        ${stories
          .sort((a, b) => a.priority - b.priority)
          .map((s) => {
            const attempts = metrics.storyAttempts[s.id] || 0;
            const deps = s.dependsOn?.length ? s.dependsOn.join(", ") : "";
            const hasVerification = !!s.verification;

            return `
          <div class="story-item ${s.passes ? "story-pass" : "story-pending"}">
            <div class="story-status-icon">
              ${s.passes ? "&#10003;" : "&#9675;"}
            </div>
            <div class="story-content">
              <div class="story-header">
                <span class="story-id">${escHtml(s.id)}</span>
                <span class="story-title">${escHtml(s.title)}</span>
              </div>
              <div class="story-meta">
                ${attempts > 0 ? `<span class="story-attempts">${attempts} attempt${attempts > 1 ? 's' : ''}</span>` : ""}
                ${deps ? `<span class="story-deps">&#8594; depends on: ${escHtml(deps)}</span>` : ""}
                ${hasVerification ? '<span class="story-verified">&#10003; verified</span>' : ""}
              </div>
            </div>
          </div>`;
          })
          .join("")}
      </div>
    </div>`;
}

function renderMetrics(loop: RalphLoop): string {
  const m = loop.metrics;
  if (!m || m.iterationTimes.length === 0) {
    return `
      <div class="log-empty-state">
        <div class="empty-icon">&#128200;</div>
        <h3>No Metrics Yet</h3>
        <p>Start the loop to collect metrics data.</p>
      </div>`;
  }

  const totalTime = m.iterationTimes.reduce((a, b) => a + b, 0);
  const avgTime = totalTime / m.iterationTimes.length;
  const totalStories = loop.prd?.stories.length || 0;
  const passedStories = loop.prd?.stories.filter((s) => s.passes).length || 0;

  // Calculate first-attempt success rate
  const storyIds = Object.keys(m.storyAttempts);
  const firstAttemptSuccess = storyIds.filter((id) => m.storyAttempts[id] === 1).length;
  const successRate = storyIds.length > 0
    ? Math.round((firstAttemptSuccess / storyIds.length) * 100)
    : 0;

  // Build a simple bar chart of iteration times
  const maxTime = Math.max(...m.iterationTimes);
  const barChart = m.iterationTimes.map((t, i) => {
    const pct = maxTime > 0 ? Math.round((t / maxTime) * 100) : 0;
    return `<div class="metrics-bar-row">
      <span class="metrics-bar-label">#${i + 1}</span>
      <div class="metrics-bar-track">
        <div class="metrics-bar-fill" style="width: ${pct}%"></div>
      </div>
      <span class="metrics-bar-value">${formatDuration(t)}</span>
    </div>`;
  }).join("");

  return `
    <div class="metrics-panel">
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">&#128260;</div>
          <div class="metric-content">
            <div class="metric-value">${m.iterationTimes.length}</div>
            <div class="metric-label">ITERATIONS</div>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon">&#9201;</div>
          <div class="metric-content">
            <div class="metric-value">${formatDuration(avgTime)}</div>
            <div class="metric-label">AVG TIME</div>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon">&#9671;</div>
          <div class="metric-content">
            <div class="metric-value">${m.totalTokens.toLocaleString()}</div>
            <div class="metric-label">TOTAL TOKENS</div>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon">&#36;</div>
          <div class="metric-content">
            <div class="metric-value">$${m.estimatedCostUsd.toFixed(2)}</div>
            <div class="metric-label">EST. COST</div>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon">&#10003;</div>
          <div class="metric-content">
            <div class="metric-value">${passedStories}/${totalStories}</div>
            <div class="metric-label">STORIES DONE</div>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon">&#127942;</div>
          <div class="metric-content">
            <div class="metric-value">${successRate}%</div>
            <div class="metric-label">1ST ATTEMPT</div>
          </div>
        </div>
      </div>
      <div class="metrics-chart">
        <div class="metrics-chart-title">ITERATION DURATION</div>
        ${barChart}
      </div>
    </div>`;
}

// --- Helpers ---

interface ProgressEntry {
  timestamp: string;
  storyId: string;
  summary: string;
  passed: boolean;
}

function parseProgressEntries(log: string): ProgressEntry[] {
  if (!log) return [];
  const entries: ProgressEntry[] = [];

  // Match "## [Date/Time] - [Story ID]" sections
  const sections = log.split(/^## /m).filter(Boolean);
  for (const section of sections) {
    // Skip header sections like "Codebase Patterns" or "Ralph Progress Log"
    const headerMatch = section.match(/^\[?([^\]\n]+)\]?\s*-\s*([\w-]+)/);
    if (!headerMatch) continue;

    const timestamp = headerMatch[1].trim();
    const storyId = headerMatch[2].trim();
    const lines = section.split("\n").slice(1).filter((l) => l.trim());
    const summary = lines.slice(0, 2).map((l) => l.replace(/^-\s*/, "")).join("; ");
    const passed = !section.toLowerCase().includes("failed") && !section.toLowerCase().includes("not marked as passed");

    entries.push({ timestamp, storyId, summary, passed });
  }

  return entries;
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
