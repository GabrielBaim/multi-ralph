import type { RalphLoop } from "../types.js";
import { renderLogContent } from "./log-panel.js";

export function renderLogViewer(loops: RalphLoop[], selectedLoopId?: string, tab: string = "progress"): string {
  const selectedLoop = selectedLoopId ? loops.find((l) => l.id === selectedLoopId) : null;

  return `
    <div class="log-viewer-page">
      <div class="log-viewer-sidebar">
        <div class="sidebar-header">
          <h3>LOOPS</h3>
          <span class="sidebar-count">${loops.length}</span>
        </div>
        <div class="sidebar-list">
          ${loops.length === 0 ? `
            <div class="sidebar-empty">
              <p>No loops available</p>
              <p class="sidebar-hint">Create a new loop to get started</p>
            </div>
          ` : ""}
          ${loops.map((loop) => {
            const isSelected = selectedLoop?.id === loop.id;
            const stories = loop.prd?.stories || [];
            const passed = stories.filter(s => s.passes).length;
            const total = stories.length;
            const progressPct = total > 0 ? Math.round((passed / total) * 100) : 0;

            return `
            <button class="sidebar-item ${isSelected ? "active" : ""}"
              hx-get="/loops/${loop.id}/log?tab=${tab}"
              hx-target="#log-viewer-content"
              hx-swap="innerHTML"
              hx-indicator="#log-viewer-content">
              <div class="sidebar-item-row">
                <span class="sidebar-item-status ${loop.status}"></span>
                <span class="sidebar-item-name">${escHtml(loop.name)}</span>
              </div>
              <div class="sidebar-item-meta">
                <span class="sidebar-item-iter">${loop.currentIteration}/${loop.maxIterations}</span>
                ${total > 0 ? `
                  <div class="sidebar-progress">
                    <div class="sidebar-progress-fill" style="width: ${progressPct}%"></div>
                  </div>
                  <span class="sidebar-progress-text">${passed}/${total}</span>
                ` : ""}
              </div>
            </button>`;
          }).join("")}
        </div>
      </div>
      <div class="log-viewer-main">
        <div id="log-viewer-content" class="log-viewer-content">
          ${selectedLoop ? renderLogContent(selectedLoop, tab) : renderEmptyState()}
        </div>
      </div>
    </div>`;
}

function renderEmptyState(): string {
  return `
    <div class="log-viewer-empty">
      <div class="empty-icon">&#128203;</div>
      <h3>Select a Loop</h3>
      <p>Choose a loop from the sidebar to view its details</p>
      <p class="empty-hint">Or go to <a href="#" hx-get="/view/kanban" hx-target="#main-content" hx-swap="innerHTML">Kanban</a> to see all loops</p>
    </div>`;
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
