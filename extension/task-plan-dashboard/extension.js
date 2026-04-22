"use strict";

const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

const EXTENSION_ID = "local.task-plan-dashboard";
const DEFAULT_PLAN_NAME = "TASK-PLAN.md";
const DEFAULT_FEATURE_PREP_NAME = "FEATURE-PREPARATION.md";
const DEFAULT_EVENTS_PATH = path.join(".task-plan", "events.jsonl");
const STATUS_ORDER = [
  "draft",
  "ready",
  "in_progress",
  "blocked",
  "needs_review",
  "approved",
  "done",
  "dropped"
];

const STATUS_COLORS = {
  draft: "#6b7280",
  ready: "#0ea5e9",
  in_progress: "#f59e0b",
  blocked: "#ef4444",
  needs_review: "#8b5cf6",
  approved: "#10b981",
  done: "#22c55e",
  dropped: "#94a3b8"
};

function resolveDashboardLanguage() {
  const configured = vscode.workspace.getConfiguration("taskPlanDashboard").get("language", "auto");
  if (configured === "en" || configured === "ru") {
    return configured;
  }

  const language = String(vscode.env.language || "en").toLowerCase();
  return language.startsWith("ru") ? "ru" : "en";
}

function loadDashboardStrings(extensionPath, language) {
  const localesDir = path.join(extensionPath, "resources", "locales");
  const fallbackPath = path.join(localesDir, "en.json");
  const fallback = JSON.parse(fs.readFileSync(fallbackPath, "utf8"));
  const localizedPath = path.join(localesDir, `${language}.json`);

  if (!fs.existsSync(localizedPath)) {
    return fallback;
  }

  try {
    return JSON.parse(fs.readFileSync(localizedPath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function formatTemplate(template, values = {}) {
  return String(template || "").replace(/\{(\w+)\}/g, (_match, key) => {
    return Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : "";
  });
}

function getDemoWorkspaceForLanguage(language) {
  const demoFolder = language === "ru" ? "demo-ru" : "demo-en";
  return path.resolve(__dirname, "..", "..", "examples", demoFolder);
}

function getExistingDemoWorkspace(language) {
  const preferred = getDemoWorkspaceForLanguage(language);
  if (fs.existsSync(preferred)) {
    return preferred;
  }
  const fallback = getDemoWorkspaceForLanguage("ru");
  return fs.existsSync(fallback) ? fallback : null;
}

function localizeStatusLabel(strings, status) {
  return strings?.statusLabels?.[status] || String(status || "").replace(/_/g, " ");
}

class DashboardTreeItem extends vscode.TreeItem {
  constructor(label, collapsibleState, options = {}) {
    super(label, collapsibleState);
    Object.assign(this, options);
  }
}

class TaskPlanService {
  constructor(context) {
    this.context = context;
    this.language = resolveDashboardLanguage();
    this.strings = loadDashboardStrings(this.context.extensionPath, this.language);
    this.panel = null;
    this.selectedTaskId = null;
    this.changeEmitter = new vscode.EventEmitter();
    this.onDidChange = this.changeEmitter.event;
    this.watchers = [];
  }

  async initialize() {
    await this.refresh();
  }

  dispose() {
    for (const watcher of this.watchers) {
      watcher.dispose();
    }
    this.watchers = [];
    this.changeEmitter.dispose();
  }

  getModel() {
    return this.model;
  }

  getStrings() {
    return this.strings;
  }

  async refresh() {
    this.language = resolveDashboardLanguage();
    this.strings = loadDashboardStrings(this.context.extensionPath, this.language);
    this.planPath = await this.resolvePlanPath();
    this.model = await this.loadModel(this.planPath);
    this.installWatchers(this.model);
    this.changeEmitter.fire();
    this.refreshPanel();
    return this.model;
  }

  async pickPlanFile() {
    const picked = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      openLabel: this.strings.pickPlanOpenLabel,
      filters: { Markdown: ["md"] }
    });

    if (!picked || picked.length === 0) {
      return;
    }

    const fsPath = picked[0].fsPath;
    await this.context.globalState.update("taskPlanDashboard.selectedPlanPath", fsPath);
    await this.refresh();
  }

  async openDashboard(taskId = null) {
    if (!this.model) {
      await this.refresh();
    }

    if (!this.model || !this.model.planPath) {
      void vscode.window.showWarningMessage(
        this.strings.warningNoPlan
      );
      return;
    }

    this.selectedTaskId = taskId || this.selectedTaskId || this.model.tasks[0]?.task_id || null;

    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel(
        "taskPlanDashboard.panel",
        this.strings.panelTitle,
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          retainContextWhenHidden: true
        }
      );

      this.panel.onDidDispose(() => {
        this.panel = null;
      });

      this.panel.webview.onDidReceiveMessage(async (message) => {
        await this.handleWebviewMessage(message);
      });
    }

    this.panel.title = `${this.strings.panelTitle}${this.model.feature?.feature_title ? ` · ${this.model.feature.feature_title}` : ""}`;
    this.panel.webview.html = this.renderWebview(this.panel.webview, this.model, this.selectedTaskId);
    this.panel.reveal(vscode.ViewColumn.Beside, true);
  }

  async openDemoWorkspace() {
    const existingDemoWorkspace = getExistingDemoWorkspace(this.language);
    if (!existingDemoWorkspace) {
      void vscode.window.showWarningMessage("Demo workspace was not found next to the extension source.");
      return;
    }
    const uri = vscode.Uri.file(existingDemoWorkspace);
    await vscode.commands.executeCommand("vscode.openFolder", uri, { forceReuseWindow: false });
  }

  async openPlanFile() {
    if (!this.model?.planPath) {
      return;
    }
    const doc = await vscode.workspace.openTextDocument(this.model.planPath);
    await vscode.window.showTextDocument(doc, { preview: false });
  }

  async openFeaturePrep() {
    if (!this.model?.featurePrepPath || !fs.existsSync(this.model.featurePrepPath)) {
      void vscode.window.showWarningMessage(this.strings.warningFeaturePrepMissing);
      return;
    }

    const doc = await vscode.workspace.openTextDocument(this.model.featurePrepPath);
    await vscode.window.showTextDocument(doc, { preview: false });
  }

  async openArtifact(filePath) {
    if (!filePath) {
      return;
    }

    const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(this.model.planDir, filePath);
    if (!fs.existsSync(absolutePath)) {
      void vscode.window.showWarningMessage(`${this.strings.warningArtifactMissingPrefix} ${absolutePath}`);
      return;
    }

    const doc = await vscode.workspace.openTextDocument(absolutePath);
    await vscode.window.showTextDocument(doc, { preview: false });
  }

  async handleWebviewMessage(message) {
    switch (message.type) {
      case "selectTask":
        this.selectedTaskId = message.taskId || null;
        this.refreshPanel();
        return;
      case "refresh":
        await this.refresh();
        return;
      case "openPlan":
        await this.openPlanFile();
        return;
      case "openFeaturePrep":
        await this.openFeaturePrep();
        return;
      case "openArtifact":
        await this.openArtifact(message.path);
        return;
      default:
        return;
    }
  }

  refreshPanel() {
    if (!this.panel || !this.model || !this.model.planPath) {
      return;
    }
    this.panel.webview.html = this.renderWebview(this.panel.webview, this.model, this.selectedTaskId);
  }

  installWatchers(model) {
    for (const watcher of this.watchers) {
      watcher.dispose();
    }
    this.watchers = [];

    if (!model?.planPath) {
      return;
    }

    const pathsToWatch = [model.planPath, model.featurePrepPath, model.eventsPath].filter(Boolean);
    for (const targetPath of pathsToWatch) {
      const watcher = fs.watch(targetPath, { persistent: false }, async () => {
        await this.refresh();
      });
      this.watchers.push({ dispose: () => watcher.close() });
    }
  }

  async resolvePlanPath() {
    const configPath = vscode.workspace.getConfiguration("taskPlanDashboard").get("planPath");
    if (configPath && fs.existsSync(configPath)) {
      return configPath;
    }

    const persistedPath = this.context.globalState.get("taskPlanDashboard.selectedPlanPath");
    if (persistedPath && fs.existsSync(persistedPath)) {
      return persistedPath;
    }

    const discovered = await vscode.workspace.findFiles(`**/${DEFAULT_PLAN_NAME}`, "**/node_modules/**", 20);
    if (discovered.length > 0) {
      return discovered[0].fsPath;
    }

    const existingDemoWorkspace = getExistingDemoWorkspace(this.language);
    const demoPlanPath = existingDemoWorkspace ? path.join(existingDemoWorkspace, DEFAULT_PLAN_NAME) : null;
    if (demoPlanPath && fs.existsSync(demoPlanPath)) {
      return demoPlanPath;
    }

    return null;
  }

  async loadModel(planPath) {
    if (!planPath) {
      return {
        planPath: null,
        planDir: null,
        language: this.language,
        ui: this.strings.webview,
        tasks: [],
        events: [],
        timeline: [],
        feature: {},
        prep: { checked: 0, total: 0, percent: 0 },
        counts: {}
      };
    }

    const markdown = fs.readFileSync(planPath, "utf8");
    const planDir = path.dirname(planPath);
    const parsedPlan = parseTaskPlan(markdown, planDir);
    const featurePrepPath = path.join(planDir, parsedPlan.featurePreparationPath || DEFAULT_FEATURE_PREP_NAME);
    const prep = parseFeaturePreparation(featurePrepPath);
    const eventsPath = path.join(planDir, DEFAULT_EVENTS_PATH);
    const events = parseEvents(eventsPath);
    const enriched = enrichTasks(parsedPlan.tasks, events);

    const counts = {};
    for (const status of STATUS_ORDER) {
      counts[status] = enriched.filter((task) => task.status === status).length;
    }

    const reviewQueue = enriched.filter((task) => task.status === "needs_review" || task.owner_role === "reviewer").length;
    const testQueue = enriched.filter((task) => task.owner_role === "tester" || task.status === "approved").length;
    const doneCount = counts.done || 0;
    const total = enriched.length;
    const timeline = events.slice().sort((a, b) => String(b.ts).localeCompare(String(a.ts)));

    return {
      planPath,
      planDir,
      language: this.language,
      ui: this.strings.webview,
      featurePrepPath,
      eventsPath,
      feature: parsedPlan.feature,
      executionPolicy: parsedPlan.executionPolicy,
      tasks: enriched,
      events,
      timeline,
      prep,
      counts,
      reviewQueue,
      testQueue,
      doneCount,
      total,
      graph: buildGraph(enriched),
      ownerBreakdown: groupByOwner(enriched)
    };
  }

  renderWebview(webview, model, selectedTaskId) {
    const nonce = createNonce();
    const ui = model.ui || this.strings.webview;
    const selectedTask = model.tasks.find((task) => task.task_id === selectedTaskId) || model.tasks[0] || null;
    const payload = JSON.stringify({
      language: model.language || this.language,
      ui,
      feature: model.feature,
      planPath: model.planPath,
      featurePrepPath: model.featurePrepPath,
      counts: model.counts,
      reviewQueue: model.reviewQueue,
      testQueue: model.testQueue,
      doneCount: model.doneCount,
      total: model.total,
      prep: model.prep,
      tasks: model.tasks,
      timeline: model.timeline,
      graph: model.graph,
      ownerBreakdown: model.ownerBreakdown,
      selectedTaskId: selectedTask?.task_id || null
    }).replace(/</g, "\\u003c");

    return `<!DOCTYPE html>
<html lang="${model.language || this.language}">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${this.strings.panelTitle}</title>
  <style>
    :root {
      --bg: #0f172a;
      --panel: #111827;
      --panel-2: #172033;
      --panel-3: #0b1222;
      --text: #e5e7eb;
      --muted: #9ca3af;
      --border: rgba(255, 255, 255, 0.08);
      --accent: #60a5fa;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      background: linear-gradient(180deg, #0b1220 0%, #101827 100%);
      color: var(--text);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    button {
      border: 1px solid var(--border);
      background: #192235;
      color: var(--text);
      border-radius: 10px;
      padding: 8px 12px;
      cursor: pointer;
    }
    button:hover { background: #21304a; }
    .page {
      display: grid;
      grid-template-columns: minmax(0, 1.7fr) minmax(340px, 0.9fr);
      gap: 18px;
      padding: 18px;
    }
    .main, .side {
      display: flex;
      flex-direction: column;
      gap: 18px;
      min-width: 0;
    }
    .panel {
      background: rgba(15, 23, 42, 0.84);
      border: 1px solid var(--border);
      border-radius: 18px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
      overflow: hidden;
    }
    .panel-inner { padding: 16px; }
    .hero {
      background: radial-gradient(circle at top right, rgba(96, 165, 250, 0.28), transparent 32%), linear-gradient(135deg, #111827 0%, #0b1222 100%);
    }
    .hero h1 {
      margin: 0;
      font-size: 26px;
      line-height: 1.15;
    }
    .hero p {
      color: var(--muted);
      margin: 10px 0 0;
      max-width: 70ch;
    }
    .toolbar {
      display: flex;
      gap: 8px;
      margin-top: 14px;
      flex-wrap: wrap;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 12px;
    }
    .summary-card {
      background: linear-gradient(180deg, #121b2d, #0d1423);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 14px;
    }
    .summary-card .label {
      color: var(--muted);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .summary-card .value {
      font-size: 26px;
      font-weight: 700;
      margin-top: 10px;
    }
    .prep-bar {
      margin-top: 10px;
      height: 10px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 999px;
      overflow: hidden;
    }
    .prep-bar > span {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, #34d399, #60a5fa);
      border-radius: 999px;
    }
    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
    }
    .section-head h2 {
      margin: 0;
      font-size: 18px;
    }
    .subtle {
      color: var(--muted);
      font-size: 13px;
    }
    .kanban {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }
    .column {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 12px;
      min-height: 210px;
    }
    .column h3 {
      margin: 0 0 10px;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted);
    }
    .task-card {
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 12px;
      background: #101827;
      margin-bottom: 10px;
      cursor: pointer;
      transition: transform 120ms ease, border-color 120ms ease;
    }
    .task-card:hover {
      transform: translateY(-1px);
      border-color: rgba(96, 165, 250, 0.55);
    }
    .task-card.selected {
      border-color: var(--accent);
      box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.3);
    }
    .task-card .top {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: flex-start;
    }
    .task-card .title {
      font-weight: 600;
      line-height: 1.25;
    }
    .task-card .meta {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 10px;
      color: var(--muted);
      font-size: 12px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      padding: 5px 9px;
      border: 1px solid transparent;
      white-space: nowrap;
    }
    .graph-wrap {
      overflow-x: auto;
      padding-bottom: 8px;
    }
    .graph-node {
      cursor: pointer;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .detail-card {
      border: 1px solid var(--border);
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.02);
      padding: 12px;
    }
    .detail-card h4 {
      margin: 0 0 8px;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted);
    }
    .list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .list-item {
      border: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.02);
      border-radius: 12px;
      padding: 10px 12px;
    }
    .timeline {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 420px;
      overflow-y: auto;
    }
    .timeline-item {
      border-left: 3px solid #334155;
      padding: 8px 0 8px 12px;
    }
    .timeline-item .head {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      font-size: 13px;
    }
    .timeline-item .body {
      color: var(--muted);
      margin-top: 4px;
      font-size: 12px;
    }
    .artifact-button {
      width: 100%;
      text-align: left;
    }
    .owners {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    .owner-box {
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 10px 12px;
    }
    .owner-box .count {
      font-size: 24px;
      font-weight: 700;
      margin-top: 6px;
    }
    @media (max-width: 1280px) {
      .page {
        grid-template-columns: 1fr;
      }
      .summary-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .kanban {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="main">
      <section class="panel hero">
        <div class="panel-inner">
          <h1 id="hero-title"></h1>
          <p id="hero-subtitle"></p>
          <div class="toolbar">
            <button id="open-plan">${ui.buttons.openPlan}</button>
            <button id="open-feature-prep">${ui.buttons.openFeaturePrep}</button>
            <button id="refresh-dashboard">${ui.buttons.refresh}</button>
          </div>
        </div>
      </section>
      <section class="panel">
        <div class="panel-inner">
          <div class="summary-grid" id="summary-grid"></div>
        </div>
      </section>
      <section class="panel">
        <div class="panel-inner">
          <div class="section-head">
            <h2>${ui.sections.kanban}</h2>
            <div class="subtle">${ui.hints.kanban}</div>
          </div>
          <div class="kanban" id="kanban"></div>
        </div>
      </section>
      <section class="panel">
        <div class="panel-inner">
          <div class="section-head">
            <h2>${ui.sections.dependencyGraph}</h2>
            <div class="subtle">${ui.hints.dependencyGraph}</div>
          </div>
          <div class="graph-wrap" id="graph-wrap"></div>
        </div>
      </section>
    </div>
    <aside class="side">
      <section class="panel">
        <div class="panel-inner">
          <div class="section-head">
            <h2>${ui.sections.selectedTask}</h2>
            <div class="subtle">${ui.hints.selectedTask}</div>
          </div>
          <div id="selected-task"></div>
        </div>
      </section>
      <section class="panel">
        <div class="panel-inner">
          <div class="section-head">
            <h2>${ui.sections.ownerBreakdown}</h2>
            <div class="subtle">${ui.hints.ownerBreakdown}</div>
          </div>
          <div class="owners" id="owners"></div>
        </div>
      </section>
      <section class="panel">
        <div class="panel-inner">
          <div class="section-head">
            <h2>${ui.sections.eventTimeline}</h2>
            <div class="subtle">${ui.hints.eventTimeline}</div>
          </div>
          <div class="timeline" id="timeline"></div>
        </div>
      </section>
    </aside>
  </div>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const STATUS_ORDER = ${JSON.stringify(STATUS_ORDER)};
    const STATUS_COLORS = ${JSON.stringify(STATUS_COLORS)};
    const data = ${payload};
    const ui = data.ui;
    let selectedTaskId = data.selectedTaskId;

    function statusLabel(value) {
      return ui.statusLabels?.[value] || String(value || "").replace(/_/g, " ");
    }

    function colorForStatus(status) {
      return STATUS_COLORS[status] || "#64748b";
    }

    function escapeHtml(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function formatUiTemplate(template, values) {
      return String(template || "").replace(/\{(\w+)\}/g, (_match, key) => {
        return Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : "";
      });
    }

    function badge(label, status) {
      const color = colorForStatus(status);
      return '<span class="badge" style="background:' + color + '22;border-color:' + color + '66;color:' + color + ';">' + escapeHtml(label) + '</span>';
    }

    function taskById(taskId) {
      return data.tasks.find((task) => task.task_id === taskId) || null;
    }

    function setSelectedTask(taskId) {
      selectedTaskId = taskId;
      renderSelectedTask();
      renderKanban();
      renderGraph();
      vscode.postMessage({ type: "selectTask", taskId });
    }

    function renderHero() {
      document.getElementById("hero-title").textContent =
        data.feature.feature_title || ui.heroFallbackTitle;
      document.getElementById("hero-subtitle").textContent =
        data.feature.goal || ui.heroFallbackSubtitle;
    }

    function renderSummary() {
      const items = [
        { label: ui.summary.tasks, value: data.total, hint: ui.summary.tasksHint },
        { label: ui.summary.done, value: data.doneCount, hint: ui.summary.doneHint },
        { label: ui.summary.reviewQueue, value: data.reviewQueue, hint: ui.summary.reviewQueueHint },
        { label: ui.summary.testQueue, value: data.testQueue, hint: ui.summary.testQueueHint },
        { label: ui.summary.blocked, value: data.counts.blocked || 0, hint: ui.summary.blockedHint },
        {
          label: ui.summary.featurePrep,
          value: data.prep.percent + "%",
          hint: formatUiTemplate(ui.summary.featurePrepHintTemplate, { checked: data.prep.checked, total: data.prep.total }),
          progress: data.prep.percent
        }
      ];

      document.getElementById("summary-grid").innerHTML = items.map((item) => {
        const progress = item.progress != null
          ? '<div class="prep-bar"><span style="width:' + item.progress + '%;"></span></div>'
          : "";
        return '<div class="summary-card">' +
          '<div class="label">' + escapeHtml(item.label) + '</div>' +
          '<div class="value">' + escapeHtml(item.value) + '</div>' +
          '<div class="subtle" style="margin-top:8px;">' + escapeHtml(item.hint) + '</div>' +
          progress +
        '</div>';
      }).join("");
    }

    function renderKanban() {
      const columns = [
        ["draft", "ready"],
        ["in_progress", "needs_review"],
        ["approved", "blocked"],
        ["done", "dropped"]
      ];

      const columnHtml = columns.map((pair) => {
        const tasks = data.tasks.filter((task) => pair.includes(task.status));
        const cards = tasks.map((task) => {
          const selected = selectedTaskId === task.task_id ? " selected" : "";
          const approvals = Array.isArray(task.required_approvals) ? task.required_approvals.length : 0;
          const deps = Array.isArray(task.dependencies) ? task.dependencies.filter((dep) => dep.startsWith("T-")).length : 0;
          return '<div class="task-card' + selected + '" data-task-id="' + escapeHtml(task.task_id) + '">' +
            '<div class="top">' +
              '<div>' +
                '<div class="title">' + escapeHtml(task.task_id + " · " + task.title) + '</div>' +
                '<div class="meta">' +
                  badge(statusLabel(task.status), task.status) +
                  badge(task.owner_role || "unassigned", task.status) +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="meta">' +
              '<span>' + escapeHtml(ui.kanban.approvals) + ': ' + approvals + '</span>' +
              '<span>' + escapeHtml(ui.kanban.dependencies) + ': ' + deps + '</span>' +
              '<span>' + escapeHtml(ui.kanban.next) + ': ' + escapeHtml(task.next_role || statusLabel("done")) + '</span>' +
            '</div>' +
          '</div>';
        }).join("");
        const title = pair.map((status) => statusLabel(status)).join(" / ");
        return '<div class="column"><h3>' + escapeHtml(title) + '</h3>' + (cards || '<div class="subtle">' + escapeHtml(ui.kanban.noTasks) + '</div>') + '</div>';
      }).join("");

      document.getElementById("kanban").innerHTML = columnHtml;
      document.querySelectorAll(".task-card").forEach((node) => {
        node.addEventListener("click", () => setSelectedTask(node.dataset.taskId));
      });
    }

    function renderGraph() {
      const width = Math.max(960, (data.graph.levelCount + 1) * 280);
      const height = Math.max(420, data.graph.maxRows * 130 + 80);
      const nodesById = new Map(data.graph.nodes.map((node) => [node.task_id, node]));

      const edges = data.graph.edges.map((edge) => {
        const from = nodesById.get(edge.from);
        const to = nodesById.get(edge.to);
        if (!from || !to) {
          return "";
        }
        const startX = from.x + 220;
        const startY = from.y + 42;
        const endX = to.x;
        const endY = to.y + 42;
        const midX = (startX + endX) / 2;
        return '<path d="M ' + startX + ' ' + startY + ' C ' + midX + ' ' + startY + ', ' + midX + ' ' + endY + ', ' + endX + ' ' + endY + '" stroke="#64748b" stroke-width="2" fill="none" marker-end="url(#arrow)" />';
      }).join("");

      const nodes = data.graph.nodes.map((node) => {
        const selected = selectedTaskId === node.task_id;
        const stroke = selected ? "#60a5fa" : "#334155";
        const fill = selected ? "#172554" : "#0f172a";
        const statusColor = colorForStatus(node.status);
        return '<g class="graph-node" data-task-id="' + escapeHtml(node.task_id) + '">' +
          '<rect x="' + node.x + '" y="' + node.y + '" width="220" height="84" rx="16" fill="' + fill + '" stroke="' + stroke + '" />' +
          '<rect x="' + (node.x + 14) + '" y="' + (node.y + 14) + '" width="12" height="12" rx="6" fill="' + statusColor + '" />' +
          '<text x="' + (node.x + 34) + '" y="' + (node.y + 25) + '" fill="#e5e7eb" font-size="13" font-weight="700">' + escapeHtml(node.task_id) + '</text>' +
          '<text x="' + (node.x + 14) + '" y="' + (node.y + 46) + '" fill="#cbd5e1" font-size="12">' + escapeHtml(node.title.slice(0, 30)) + '</text>' +
          '<text x="' + (node.x + 14) + '" y="' + (node.y + 66) + '" fill="#94a3b8" font-size="11">' + escapeHtml(statusLabel(node.status) + " · " + node.owner_role) + '</text>' +
        '</g>';
      }).join("");

      document.getElementById("graph-wrap").innerHTML = '<svg width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '">' +
        '<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L8,4 L0,8 z" fill="#64748b"/></marker></defs>' +
        edges + nodes +
      '</svg>';

      document.querySelectorAll(".graph-node").forEach((node) => {
        node.addEventListener("click", () => setSelectedTask(node.dataset.taskId));
      });
    }

    function renderOwners() {
      document.getElementById("owners").innerHTML = data.ownerBreakdown.map((entry) => {
        return '<div class="owner-box">' +
          '<div class="subtle">' + escapeHtml(entry.role) + '</div>' +
          '<div class="count">' + escapeHtml(entry.count) + '</div>' +
        '</div>';
      }).join("");
    }

    function renderSelectedTask() {
      const task = taskById(selectedTaskId);
      if (!task) {
        document.getElementById("selected-task").innerHTML = '<div class="subtle">' + escapeHtml(ui.task.selectHint) + '</div>';
        return;
      }

      const blocks = [
        { title: ui.task.status, value: badge(statusLabel(task.status), task.status) + " " + badge(task.owner_role || "unassigned", task.status) },
        { title: ui.task.goal, value: escapeHtml(task.goal || ui.task.noGoalRecorded) },
        { title: ui.task.dependencies, value: renderList(task.dependencies) },
        { title: ui.task.blockedBy, value: renderList(task.blocked_by) },
        { title: ui.task.approvals, value: renderList(task.required_approvals) },
        { title: ui.task.agentSequence, value: renderList(task.agent_sequence) },
        { title: ui.task.acceptanceChecks, value: renderList(task.acceptance_checks) },
        { title: ui.task.commandsRun, value: renderList(task.commands_run) },
        { title: ui.task.risks, value: renderList(task.risks) },
        { title: ui.task.artifacts, value: renderArtifacts(task.artifact_locations) }
      ];

      document.getElementById("selected-task").innerHTML =
        '<div class="list-item" style="margin-bottom:12px;">' +
          '<div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">' +
            '<div>' +
              '<div style="font-size:20px;font-weight:700;">' + escapeHtml(task.task_id + " · " + task.title) + '</div>' +
              '<div class="subtle" style="margin-top:6px;">' + escapeHtml(task.rationale || ui.task.noRationaleRecorded) + '</div>' +
            '</div>' +
            '<div class="subtle">' + escapeHtml(ui.task.nextRole) + ': ' + escapeHtml(task.next_role || ui.task.none) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="detail-grid">' +
          blocks.map((block) => '<div class="detail-card"><h4>' + escapeHtml(block.title) + '</h4><div>' + block.value + '</div></div>').join("") +
        '</div>';
    }

    function renderList(items) {
      if (!Array.isArray(items) || items.length === 0) {
        return '<div class="subtle">' + escapeHtml(ui.task.none) + '</div>';
      }
      return '<div class="list">' + items.map((item) => '<div class="list-item">' + escapeHtml(item) + '</div>').join("") + '</div>';
    }

    function renderArtifacts(items) {
      if (!Array.isArray(items) || items.length === 0) {
        return '<div class="subtle">' + escapeHtml(ui.task.noArtifactLocations) + '</div>';
      }
      return '<div class="list">' + items.map((item) => {
        return '<button class="artifact-button" data-artifact-path="' + escapeHtml(item) + '">' + escapeHtml(item) + '</button>';
      }).join("") + '</div>';
    }

    function renderTimeline() {
      const container = document.getElementById("timeline");
      container.innerHTML = data.timeline.map((event) => {
        const title = [event.task_id, event.role, event.event].filter(Boolean).join(" · ");
        const bodyParts = [event.summary, event.next_role ? ui.timeline.nextPrefix + ": " + event.next_role : "", event.path].filter(Boolean);
        return '<div class="timeline-item">' +
          '<div class="head"><strong>' + escapeHtml(title) + '</strong><span class="subtle">' + escapeHtml(event.ts || "") + '</span></div>' +
          '<div class="body">' + escapeHtml(bodyParts.join(" | ")) + '</div>' +
        '</div>';
      }).join("");
    }

    function attachGlobalEvents() {
      document.getElementById("open-plan").addEventListener("click", () => vscode.postMessage({ type: "openPlan" }));
      document.getElementById("open-feature-prep").addEventListener("click", () => vscode.postMessage({ type: "openFeaturePrep" }));
      document.getElementById("refresh-dashboard").addEventListener("click", () => vscode.postMessage({ type: "refresh" }));
      document.addEventListener("click", (event) => {
        const artifactButton = event.target.closest("[data-artifact-path]");
        if (artifactButton) {
          vscode.postMessage({ type: "openArtifact", path: artifactButton.dataset.artifactPath });
        }
      });
    }

    renderHero();
    renderSummary();
    renderKanban();
    renderGraph();
    renderOwners();
    renderSelectedTask();
    renderTimeline();
    attachGlobalEvents();
  </script>
</body>
</html>`;
  }
}

class TaskPlanTreeProvider {
  constructor(service) {
    this.service = service;
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.service.onDidChange(() => this.refresh());
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element) {
    return element;
  }

  async getChildren(element) {
    const model = this.service.getModel();
    const strings = this.service.getStrings();

    if (!element) {
      const rootItems = [
        new DashboardTreeItem(strings.tree.openDashboard, vscode.TreeItemCollapsibleState.None, {
          description: model?.feature?.feature_title || strings.tree.openDashboardDescription,
          iconPath: new vscode.ThemeIcon("dashboard"),
          command: {
            command: "taskPlanDashboard.openDashboard",
            title: strings.tree.openDashboard
          }
        }),
        new DashboardTreeItem(strings.tree.openDemoWorkspace, vscode.TreeItemCollapsibleState.None, {
          description: strings.tree.openDemoWorkspaceDescription,
          iconPath: new vscode.ThemeIcon("rocket"),
          command: {
            command: "taskPlanDashboard.openDemoWorkspace",
            title: strings.tree.openDemoWorkspace
          }
        })
      ];

      if (!model || !model.planPath) {
        rootItems.push(
          new DashboardTreeItem(strings.tree.noPlanFound, vscode.TreeItemCollapsibleState.None, {
            description: strings.tree.noPlanFoundDescription,
            iconPath: new vscode.ThemeIcon("warning")
          })
        );
        return rootItems;
      }

      rootItems.push(
        new DashboardTreeItem(`${model.feature?.feature_title || path.basename(model.planPath)}`, vscode.TreeItemCollapsibleState.None, {
          description: formatTemplate(strings.tree.prepSummary, { percent: model.prep.percent, total: model.total }),
          iconPath: new vscode.ThemeIcon("file-code"),
          command: {
            command: "taskPlanDashboard.openPlanFile",
            title: strings.tree.openPlanFileTitle
          }
        })
      );

      for (const status of STATUS_ORDER) {
        const count = model.counts?.[status] || 0;
        if (count === 0) {
          continue;
        }
        rootItems.push(
          new DashboardTreeItem(localizeStatusLabel(strings, status), vscode.TreeItemCollapsibleState.Expanded, {
            contextValue: `status-${status}`,
            description: `${count}`,
            iconPath: new vscode.ThemeIcon(iconForStatus(status)),
            statusKey: status
          })
        );
      }

      return rootItems;
    }

    if (element.statusKey) {
      const tasks = model.tasks.filter((task) => task.status === element.statusKey);
      return tasks.map((task) => new DashboardTreeItem(`${task.task_id} · ${task.title}`, vscode.TreeItemCollapsibleState.None, {
        description: `${task.owner_role || "unassigned"} → ${task.next_role || "done"}`,
        iconPath: new vscode.ThemeIcon(iconForStatus(task.status)),
        tooltip: buildTaskTooltip(task, strings),
        command: {
          command: "taskPlanDashboard.openDashboardForTask",
          title: strings.tree.openDashboardForTaskTitle,
          arguments: [task.task_id]
        }
      }));
    }

    return [];
  }
}

function activate(context) {
  const service = new TaskPlanService(context);
  const provider = new TaskPlanTreeProvider(service);

  context.subscriptions.push(
    provider,
    service,
    vscode.window.createTreeView("taskPlanDashboardView", {
      treeDataProvider: provider,
      showCollapseAll: false
    }),
    vscode.commands.registerCommand("taskPlanDashboard.openDashboard", async () => {
      await service.openDashboard();
    }),
    vscode.commands.registerCommand("taskPlanDashboard.refresh", async () => {
      await service.refresh();
    }),
    vscode.commands.registerCommand("taskPlanDashboard.pickPlanFile", async () => {
      await service.pickPlanFile();
    }),
    vscode.commands.registerCommand("taskPlanDashboard.openPlanFile", async () => {
      await service.openPlanFile();
    }),
    vscode.commands.registerCommand("taskPlanDashboard.openFeaturePrep", async () => {
      await service.openFeaturePrep();
    }),
    vscode.commands.registerCommand("taskPlanDashboard.openDemoWorkspace", async () => {
      await service.openDemoWorkspace();
    }),
    vscode.commands.registerCommand("taskPlanDashboard.openDashboardForTask", async (taskId) => {
      await service.openDashboard(taskId);
    })
  );

  void service.initialize();
}

function deactivate() {}

function parseTaskPlan(markdown, planDir) {
  const taskHeadingRegex = /^### TASK\s+([^\n]+)$/gm;
  const matches = [...markdown.matchAll(taskHeadingRegex)];
  const headerEnd = matches[0]?.index ?? markdown.length;
  const headerBlock = markdown.slice(0, headerEnd);
  const featureSection = extractSection(headerBlock, "Feature Layer");
  const executionPolicySection = extractSection(headerBlock, "Execution Policy");
  const preImplementationSection = extractSection(headerBlock, "Pre-Implementation Gate");

  const feature = parseKeyValueSection(featureSection || "");
  const executionPolicy = parseKeyValueSection(executionPolicySection || "");
  const preImplementation = parseKeyValueSection(preImplementationSection || "");

  const tasks = matches.map((match, index) => {
    const taskIdFromHeading = match[1].trim();
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? markdown.length;
    let block = markdown.slice(start, end).trim();
    const contractsIndex = block.indexOf("#### Agent Contracts");
    let contractsSection = "";
    if (contractsIndex >= 0) {
      contractsSection = block.slice(contractsIndex);
      block = block.slice(0, contractsIndex).trim();
    }

    const task = parseKeyValueSection(block);
    const agentContracts = parseAgentContracts(contractsSection);

    task.task_id = task.task_id || taskIdFromHeading.split(/\s+/)[0];
    task.title = task.title || taskIdFromHeading.replace(task.task_id, "").trim() || task.task_id;
    task.status = task.status || "draft";
    task.owner_role = task.owner_role || "planner";
    task.agent_sequence = normalizeArray(task.agent_sequence);
    task.required_approvals = normalizeArray(task.required_approvals);
    task.dependencies = normalizeArray(task.dependencies).filter(Boolean);
    task.blocked_by = normalizeArray(task.blocked_by).filter(Boolean);
    task.unblocks = normalizeArray(task.unblocks).filter(Boolean);
    task.artifact_locations = normalizeArray(task.artifact_locations).filter(Boolean);
    task.acceptance_checks = normalizeArray(task.acceptance_checks).filter(Boolean);
    task.commands_run = normalizeArray(task.commands_run).filter(Boolean);
    task.risks = normalizeArray(task.risks).filter(Boolean);
    task.agentContracts = agentContracts;
    task.planDir = planDir;

    return task;
  });

  return {
    feature,
    executionPolicy,
    preImplementation,
    featurePreparationPath: preImplementation.feature_preparation_path || DEFAULT_FEATURE_PREP_NAME,
    tasks
  };
}

function extractSection(markdown, name) {
  const regex = new RegExp(`## ${escapeRegex(name)}\\n([\\s\\S]*?)(?=\\n## |$)`, "m");
  const match = markdown.match(regex);
  return match ? match[1].trim() : "";
}

function parseKeyValueSection(text) {
  const result = {};
  let currentKey = null;
  const lines = text.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("|") || trimmed.startsWith("```")) {
      continue;
    }
    if (trimmed.startsWith("#")) {
      currentKey = null;
      continue;
    }

    const keyValueMatch = trimmed.match(/^([A-Za-z0-9_]+):(?:\s*(.*))?$/);
    if (keyValueMatch) {
      const [, key, value = ""] = keyValueMatch;
      currentKey = key;
      if (value.length > 0) {
        result[key] = parseInlineValue(value);
      } else {
        result[key] = [];
      }
      continue;
    }

    if (/^-\s+/.test(trimmed) && currentKey) {
      if (!Array.isArray(result[currentKey])) {
        result[currentKey] = result[currentKey] ? [String(result[currentKey])] : [];
      }
      result[currentKey].push(trimmed.replace(/^-\s+/, ""));
      continue;
    }

    if (currentKey && typeof result[currentKey] === "string") {
      result[currentKey] = `${result[currentKey]} ${trimmed}`.trim();
      continue;
    }

    if (currentKey && Array.isArray(result[currentKey])) {
      result[currentKey].push(trimmed);
    }
  }

  return result;
}

function parseInlineValue(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return trimmed;
}

function parseAgentContracts(section) {
  if (!section) {
    return [];
  }

  const headingRegex = /^#####\s+([^\n]+)$/gm;
  const matches = [...section.matchAll(headingRegex)];
  return matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? section.length;
    const block = section.slice(start, end).trim();
    const parsed = parseKeyValueSection(block);
    parsed.contract_id = match[1].trim();
    parsed.role = parsed.role || parsed.contract_id;
    parsed.entry_criteria = normalizeArray(parsed.entry_criteria);
    parsed.input_artifacts = normalizeArray(parsed.input_artifacts);
    parsed.steps = normalizeArray(parsed.steps);
    parsed.output_artifacts = normalizeArray(parsed.output_artifacts);
    parsed.approval_gate = normalizeArray(parsed.approval_gate);
    parsed.stop_conditions = normalizeArray(parsed.stop_conditions);
    return parsed;
  });
}

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  return [];
}

function parseFeaturePreparation(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return { checked: 0, total: 0, percent: 0 };
  }

  const content = fs.readFileSync(filePath, "utf8");
  const matches = [...content.matchAll(/- \[( |x|X)\]/g)];
  const checked = matches.filter((match) => match[1].toLowerCase() === "x").length;
  const total = matches.length;
  const percent = total === 0 ? 0 : Math.round((checked / total) * 100);
  return { checked, total, percent };
}

function parseEvents(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return [];
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean);
  const events = [];
  for (const line of lines) {
    try {
      events.push(JSON.parse(line));
    } catch (error) {
      // Ignore malformed lines in the timeline feed.
    }
  }
  return events;
}

function enrichTasks(tasks, events) {
  const lastEventByTask = new Map();
  for (const event of events) {
    lastEventByTask.set(event.task_id, event);
  }

  return tasks.map((task) => {
    const agentSequence = task.agent_sequence.length > 0 ? task.agent_sequence : ["planner", "implementer", "reviewer", "tester", "docs_sync"];
    const ownerIndex = agentSequence.indexOf(task.owner_role);
    let nextRole = ownerIndex >= 0 ? agentSequence[ownerIndex + 1] || null : agentSequence[0] || null;
    if (task.status === "done" || task.status === "dropped") {
      nextRole = null;
    } else if (task.status === "needs_review") {
      nextRole = "reviewer";
    } else if (task.status === "approved") {
      nextRole = "tester";
    }

    return {
      ...task,
      latestEvent: lastEventByTask.get(task.task_id) || null,
      next_role: nextRole
    };
  });
}

function buildGraph(tasks) {
  const taskMap = new Map(tasks.map((task) => [task.task_id, task]));
  const cache = new Map();

  function depth(taskId, stack = new Set()) {
    if (cache.has(taskId)) {
      return cache.get(taskId);
    }
    if (stack.has(taskId)) {
      return 0;
    }
    stack.add(taskId);
    const task = taskMap.get(taskId);
    const deps = normalizeArray(task?.dependencies).filter((dep) => dep.startsWith("T-") && taskMap.has(dep));
    const value = deps.length === 0 ? 0 : Math.max(...deps.map((dep) => depth(dep, stack))) + 1;
    cache.set(taskId, value);
    stack.delete(taskId);
    return value;
  }

  const levels = new Map();
  for (const task of tasks) {
    const level = depth(task.task_id);
    if (!levels.has(level)) {
      levels.set(level, []);
    }
    levels.get(level).push(task);
  }

  const nodes = [];
  let maxRows = 0;
  for (const [level, levelTasks] of [...levels.entries()].sort((a, b) => a[0] - b[0])) {
    maxRows = Math.max(maxRows, levelTasks.length);
    levelTasks.forEach((task, index) => {
      nodes.push({
        task_id: task.task_id,
        title: task.title,
        status: task.status,
        owner_role: task.owner_role,
        level,
        x: 30 + level * 280,
        y: 30 + index * 120
      });
    });
  }

  const edges = [];
  for (const task of tasks) {
    for (const dep of normalizeArray(task.dependencies).filter((value) => value.startsWith("T-") && taskMap.has(value))) {
      edges.push({ from: dep, to: task.task_id });
    }
  }

  return {
    nodes,
    edges,
    levelCount: levels.size,
    maxRows
  };
}

function groupByOwner(tasks) {
  const counts = new Map();
  for (const task of tasks) {
    const key = task.owner_role || "unassigned";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count || a.role.localeCompare(b.role));
}

function iconForStatus(status) {
  switch (status) {
    case "draft":
      return "circle-outline";
    case "ready":
      return "play-circle";
    case "in_progress":
      return "sync";
    case "blocked":
      return "error";
    case "needs_review":
      return "eye";
    case "approved":
      return "pass";
    case "done":
      return "check";
    case "dropped":
      return "chrome-close";
    default:
      return "circle-large-outline";
  }
}

function buildTaskTooltip(task, strings) {
  const lines = [
    `${task.task_id} · ${task.title}`,
    `Status: ${localizeStatusLabel(strings, task.status)}`,
    `Owner: ${task.owner_role || "unassigned"}`,
    `Next: ${task.next_role || "none"}`
  ];
  const blockers = normalizeArray(task.blocked_by).filter(Boolean);
  if (blockers.length > 0) {
    lines.push(`Blocked by: ${blockers.join(", ")}`);
  }
  return lines.join("\n");
}

function createNonce() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let value = "";
  for (let index = 0; index < 32; index += 1) {
    value += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return value;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  activate,
  deactivate
};
