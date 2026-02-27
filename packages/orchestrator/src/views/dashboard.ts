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

  // Aggregate TDD metrics
  const avgTestCoverage = calculateAverage(loops, (l) => l.metrics.testCoverage);
  const avgTestFirstCompliance = calculateAverage(loops, (l) => l.metrics.testFirstCompliance);
  const totalRollbacks = loops.reduce((sum, l) => sum + (l.metrics.rollbackCount || 0), 0);
  const avgVelocity = calculateAverage(loops, (l) => l.metrics.velocity);

  // Aggregate failure reasons
  const allFailureReasons: Record<string, number> = {};
  for (const loop of loops) {
    for (const [reason, count] of Object.entries(loop.metrics.failureReasons || {})) {
      allFailureReasons[reason] = (allFailureReasons[reason] || 0) + count;
    }
  }

  // Generate actionable insights
  const insights = generateInsights(loops, avgTestCoverage, avgTestFirstCompliance, totalRollbacks, allFailureReasons);

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
        <h3>TDD & AGILE METRICS</h3>
        <div class="tdd-metrics-grid">
          <div class="tdd-metric-card">
            <div class="tdd-metric-value">${avgTestCoverage.toFixed(0)}%</div>
            <div class="tdd-metric-label">AVG TEST COVERAGE</div>
            <div class="tdd-metric-bar">
              <div class="tdd-bar-fill" style="width: ${avgTestCoverage}%"></div>
            </div>
          </div>
          <div class="tdd-metric-card">
            <div class="tdd-metric-value">${avgTestFirstCompliance.toFixed(0)}%</div>
            <div class="tdd-metric-label">TEST-FIRST COMPLIANCE</div>
            <div class="tdd-metric-bar">
              <div class="tdd-bar-fill ${avgTestFirstCompliance < 50 ? 'tdd-bar-warning' : ''}" style="width: ${avgTestFirstCompliance}%"></div>
            </div>
          </div>
          <div class="tdd-metric-card">
            <div class="tdd-metric-value">${avgVelocity.toFixed(2)}</div>
            <div class="tdd-metric-label">AVG VELOCITY (stories/iter)</div>
          </div>
          <div class="tdd-metric-card ${totalRollbacks > 5 ? 'tdd-warning' : ''}">
            <div class="tdd-metric-value">${totalRollbacks}</div>
            <div class="tdd-metric-label">TOTAL ROLLBACKS</div>
          </div>
        </div>
      </div>

      ${Object.keys(allFailureReasons).length > 0 ? `
      <div class="dashboard-section">
        <h3>FAILURE CATEGORIES</h3>
        <div class="failure-categories">
          ${Object.entries(allFailureReasons)
            .sort((a, b) => b[1] - a[1])
            .map(([reason, count]) => `
              <div class="failure-category-item">
                <span class="failure-category-name">${escHtml(reason)}</span>
                <span class="failure-category-count">${count}</span>
              </div>
            `).join("")}
        </div>
      </div>
      ` : ''}

      ${insights.length > 0 ? `
      <div class="dashboard-section">
        <h3>ACTIONABLE INSIGHTS</h3>
        <div class="insights-list">
          ${insights.map((insight) => `
            <div class="insight-item insight-${insight.severity}">
              <span class="insight-icon">${insight.severity === 'warning' ? '⚠️' : insight.severity === 'success' ? '✓' : 'ℹ'}</span>
              <span class="insight-text">${escHtml(insight.message)}</span>
            </div>
          `).join("")}
        </div>
      </div>
      ` : ''}

      <div class="dashboard-section">
        <h3>LOOP METRICS</h3>
        ${loops.length === 0 ? '<p class="dashboard-empty">No loops yet. Create a new loop to get started.</p>' : ""}
        <div class="loop-metrics-grid">
          ${loops.map((loop) => renderLoopMetricsCard(loop)).join("")}
        </div>
      </div>
    </div>`;
}

function calculateAverage(loops: RalphLoop[], getter: (l: RalphLoop) => number | undefined): number {
  const values = loops.map(getter).filter((v): v is number => v !== undefined && v > 0);
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function generateInsights(
  loops: RalphLoop[],
  avgCoverage: number,
  avgTestFirst: number,
  rollbacks: number,
  failures: Record<string, number>
): Array<{ severity: 'success' | 'warning' | 'info'; message: string }> {
  const insights: Array<{ severity: 'success' | 'warning' | 'info'; message: string }> = [];

  // Test coverage insights
  if (avgCoverage >= 80) {
    insights.push({ severity: 'success', message: `Excellent test coverage (${avgCoverage.toFixed(0)}%). Keep maintaining high coverage.` });
  } else if (avgCoverage >= 50) {
    insights.push({ severity: 'info', message: `Test coverage is ${avgCoverage.toFixed(0)}%. Consider adding more tests for better reliability.` });
  } else if (avgCoverage > 0) {
    insights.push({ severity: 'warning', message: `Low test coverage (${avgCoverage.toFixed(0)}%). Prioritize writing more tests.` });
  }

  // Test-first compliance insights
  if (avgTestFirst >= 70) {
    insights.push({ severity: 'success', message: `Good TDD discipline (${avgTestFirst.toFixed(0)}% test-first compliance).` });
  } else if (avgTestFirst > 0) {
    insights.push({ severity: 'warning', message: `Test-first compliance is ${avgTestFirst.toFixed(0)}%. Writing tests first improves design.` });
  }

  // Rollback insights
  if (rollbacks > 10) {
    insights.push({ severity: 'warning', message: `High rollback count (${rollbacks}). Consider smaller iterations or better planning.` });
  } else if (rollbacks > 5) {
    insights.push({ severity: 'info', message: `${rollbacks} rollbacks detected. Review patterns to reduce rework.` });
  }

  // Failure pattern insights
  const topFailure = Object.entries(failures).sort((a, b) => b[1] - a[1])[0];
  if (topFailure && topFailure[1] >= 3) {
    insights.push({ severity: 'warning', message: `Common failure: "${topFailure[0]}" (${topFailure[1]} occurrences). Address root cause.` });
  }

  // Stuck loops detection
  const stuckLoops = loops.filter((l) => l.status === 'running' && l.metrics.storiesInProgress > 0 && l.currentIteration > 5);
  if (stuckLoops.length > 0) {
    insights.push({ severity: 'warning', message: `${stuckLoops.length} loop(s) may be stuck. Check logs for blockers.` });
  }

  return insights;
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

  // Calculate average time per story
  const storyTimes = Object.values(m.timePerStory || {});
  const avgStoryTime = storyTimes.length > 0
    ? storyTimes.reduce((a, b) => a + b, 0) / storyTimes.length
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

      ${m.testCoverage !== undefined || m.testFirstCompliance !== undefined || m.velocity !== undefined ? `
      <div class="metrics-tdd-row">
        ${m.testCoverage !== undefined ? `
        <div class="mini-metric">
          <span class="mini-metric-value">${m.testCoverage.toFixed(0)}%</span>
          <span class="mini-metric-label">COVERAGE</span>
        </div>
        ` : ''}
        ${m.testFirstCompliance !== undefined ? `
        <div class="mini-metric">
          <span class="mini-metric-value">${m.testFirstCompliance.toFixed(0)}%</span>
          <span class="mini-metric-label">TDD</span>
        </div>
        ` : ''}
        ${m.velocity !== undefined ? `
        <div class="mini-metric">
          <span class="mini-metric-value">${m.velocity.toFixed(1)}</span>
          <span class="mini-metric-label">VELOCITY</span>
        </div>
        ` : ''}
        ${avgStoryTime > 0 ? `
        <div class="mini-metric">
          <span class="mini-metric-value">${formatDuration(avgStoryTime)}</span>
          <span class="mini-metric-label">AVG/STORY</span>
        </div>
        ` : ''}
        ${(m.rollbackCount || 0) > 0 ? `
        <div class="mini-metric mini-metric-warning">
          <span class="mini-metric-value">${m.rollbackCount}</span>
          <span class="mini-metric-label">ROLLBACKS</span>
        </div>
        ` : ''}
      </div>
      ` : ''}

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
  if (ms < 1000) return `${Math.round(ms)}ms`;
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
