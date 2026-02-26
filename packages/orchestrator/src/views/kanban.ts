import type { RalphLoop } from "../types.js";
import { renderLoopCard } from "./loop-card.js";

const COLUMNS: { status: RalphLoop["status"][]; label: string; icon: string }[] = [
  { status: ["idle"], label: "IDLE", icon: "&#9679;" },
  { status: ["running"], label: "RUNNING", icon: "&#9658;" },
  { status: ["completed"], label: "COMPLETED", icon: "&#10003;" },
  { status: ["failed", "stopped"], label: "FAILED / STOPPED", icon: "&#10007;" },
];

export function renderBoard(loops: RalphLoop[]): string {
  return `
    <div class="kanban-view">
      <div class="kanban-header">
        <h2>LOOP BOARD</h2>
        <span class="kanban-count">${loops.length} loops</span>
      </div>
      <div class="kanban">
        ${COLUMNS.map((col) => {
          const colLoops = loops.filter((l) => col.status.includes(l.status));
          return `
          <div class="kanban-column" data-status="${col.status[0]}">
            <div class="column-header">
              <span class="column-icon">${col.icon}</span>
              <span class="column-title">${col.label}</span>
              <span class="column-count">${colLoops.length}</span>
            </div>
            <div class="column-body">
              ${colLoops.length === 0 ? '<div class="empty-column">No loops</div>' : ""}
              ${colLoops.map((l) => renderLoopCard(l)).join("")}
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>`;
}
