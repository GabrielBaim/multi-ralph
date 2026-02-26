export function renderLayout(body: string, activeView: string = "dashboard"): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RALPH ORCHESTRATOR</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/static/style.css">
  <script src="/static/htmx.min.js"></script>
  <script src="/static/sse.js"></script>
</head>
<body>
  <div class="scanlines"></div>
  <div class="boot-screen" id="boot">
    <div class="boot-text">
      <p>RALPH ORCHESTRATOR v0.1.0</p>
      <p>Initializing neural pathways...</p>
      <p>Loading autonomous loops...</p>
      <p class="boot-ready">SYSTEM READY_</p>
    </div>
  </div>
  <div class="app" id="app">
    <header class="top-bar">
      <div class="logo">
        <span class="logo-bracket">[</span>
        <span class="logo-text">RALPH</span>
        <span class="logo-bracket">]</span>
        <span class="logo-sub">ORCHESTRATOR</span>
      </div>
      <nav class="main-nav">
        <button class="nav-tab ${activeView === "dashboard" ? "active" : ""}"
          hx-get="/view/dashboard"
          hx-target="#main-content"
          hx-swap="innerHTML"
          hx-push-url="true">
          DASHBOARD
        </button>
        <button class="nav-tab ${activeView === "kanban" ? "active" : ""}"
          hx-get="/view/kanban"
          hx-target="#main-content"
          hx-swap="innerHTML"
          hx-push-url="true">
          KANBAN
        </button>
        <button class="nav-tab ${activeView === "log-viewer" ? "active" : ""}"
          hx-get="/view/log-viewer"
          hx-target="#main-content"
          hx-swap="innerHTML"
          hx-push-url="true">
          LOG VIEWER
        </button>
      </nav>
      <div class="top-actions">
        <button class="btn btn-primary" onclick="document.getElementById('new-loop-modal').classList.add('active')">
          + NEW LOOP
        </button>
      </div>
    </header>
    <main hx-ext="sse" sse-connect="/events">
      <div id="main-content" sse-swap="board-update">
        ${body}
      </div>
    </main>
    ${renderNewLoopModal()}
  </div>
  <script>
    // Boot animation
    setTimeout(() => {
      document.getElementById('boot')?.classList.add('done');
    }, 2000);
    // Close modal on backdrop click
    document.addEventListener('click', (e) => {
      if (e.target?.classList?.contains('modal-overlay')) {
        e.target.classList.remove('active');
      }
    });
  </script>
</body>
</html>`;
}

export function renderNewLoopModal(): string {
  return `
  <div class="modal-overlay" id="new-loop-modal">
    <div class="modal card modal-wide">
      <div class="modal-header">
        <h2>NEW LOOP</h2>
        <button class="btn-close" onclick="this.closest('.modal-overlay').classList.remove('active')">&times;</button>
      </div>
      <div class="form-group">
        <label class="form-label">PROJECT DIRECTORY</label>
        <div class="dir-input-row">
          <input type="text" id="projectDir" name="projectDir" placeholder="Select below or type a path" required class="input" autocomplete="off" form="create-loop-form">
          <button type="button" class="btn btn-sm btn-ghost"
            onclick="let p=document.getElementById('dir-browser-panel'); p.classList.toggle('open'); if(p.classList.contains('open') && !p.dataset.loaded) { p.dataset.loaded='1'; htmx.ajax('GET','/browse','#dir-browser-content'); }">
            BROWSE
          </button>
        </div>
        <div class="dir-browser-panel" id="dir-browser-panel">
          <div id="dir-browser-content">
            <div class="dir-loading">Loading filesystem...</div>
          </div>
        </div>
      </div>
      <form id="create-loop-form" hx-post="/loops" hx-target="#main-content" hx-swap="innerHTML" hx-on::after-request="if(event.detail.successful) this.closest('.modal-overlay').classList.remove('active')">
        <div class="form-group">
          <label for="loopName">LOOP NAME</label>
          <input type="text" id="loopName" name="name" placeholder="Auto-filled from prd.json" class="input">
        </div>
        <div class="form-row">
          <div class="form-group form-group-half">
            <label>TOOL</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" name="tool" value="claude" checked>
                <span>CLAUDE</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="tool" value="amp">
                <span>AMP</span>
              </label>
            </div>
          </div>
          <div class="form-group form-group-half">
            <label for="maxIterations">MAX ITERATIONS</label>
            <input type="number" id="maxIterations" name="maxIterations" value="30" min="1" max="100" class="input">
          </div>
        </div>
        <div class="form-group">
          <label>ON COMPLETE (OPTIONAL)</label>
          <div class="form-row">
            <div class="form-group form-group-half" style="margin-bottom:0">
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" name="onCompleteType" value="">
                  <span>NONE</span>
                </label>
                <label class="radio-label">
                  <input type="radio" name="onCompleteType" value="shell">
                  <span>SHELL</span>
                </label>
                <label class="radio-label">
                  <input type="radio" name="onCompleteType" value="webhook">
                  <span>WEBHOOK</span>
                </label>
              </div>
            </div>
            <div class="form-group form-group-half" style="margin-bottom:0">
              <input type="text" name="onCompleteValue" placeholder="notify-send 'Done!' or https://..." class="input">
            </div>
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">CREATE LOOP</button>
        </div>
      </form>
    </div>
  </div>`;
}
