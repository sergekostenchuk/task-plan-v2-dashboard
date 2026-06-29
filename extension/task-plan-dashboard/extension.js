"use strict";

const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

const EXTENSION_ID = "local.task-plan-dashboard";
const DEFAULT_PLAN_NAME = "TASK-PLAN.md";
const DEFAULT_PLAN_FILE_NAMES = ["TASK-PLAN.md", "TASK-PLAN.MD", "TASKS.MD", "TASKS.md"];
const DEFAULT_FEATURE_PREP_NAME = "FEATURE-PREPARATION.md";
const DEFAULT_EXECUTION_STATE_NAME = "EXECUTION-STATE.md";
const DEFAULT_EVENTS_PATH = path.join(".task-plan", "events.jsonl");
const DEFAULT_DASHBOARD_SNAPSHOT_PATH = path.join(".task-plan", "dashboard-snapshot.json");
const SUPPORTED_LANGUAGES = ["en", "ru", "es", "fr", "de", "zh", "ja"];
const DEFAULT_AUDIO_FILE = "deep-techno-mix-2026.mp3";
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

function normalizeDashboardLanguage(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw || raw === "auto") {
    return null;
  }
  if (SUPPORTED_LANGUAGES.includes(raw)) {
    return raw;
  }
  if (raw.startsWith("ru")) {
    return "ru";
  }
  if (raw.startsWith("es")) {
    return "es";
  }
  if (raw.startsWith("fr")) {
    return "fr";
  }
  if (raw.startsWith("de")) {
    return "de";
  }
  if (raw.startsWith("zh")) {
    return "zh";
  }
  if (raw.startsWith("ja")) {
    return "ja";
  }
  if (raw.startsWith("en")) {
    return "en";
  }
  return "en";
}

function resolveDashboardLanguage() {
  const configured = vscode.workspace.getConfiguration("taskPlanDashboard").get("language", "auto");
  const configuredLanguage = normalizeDashboardLanguage(configured);
  if (configuredLanguage) {
    return configuredLanguage;
  }
  return normalizeDashboardLanguage(vscode.env.language) || "en";
}

function mergeDeep(baseValue, overrideValue) {
  if (Array.isArray(baseValue)) {
    return Array.isArray(overrideValue) ? overrideValue : baseValue.slice();
  }

  if (
    baseValue &&
    typeof baseValue === "object" &&
    !Array.isArray(baseValue) &&
    overrideValue &&
    typeof overrideValue === "object" &&
    !Array.isArray(overrideValue)
  ) {
    const merged = { ...baseValue };
    for (const key of Object.keys(overrideValue)) {
      merged[key] = Object.prototype.hasOwnProperty.call(baseValue, key)
        ? mergeDeep(baseValue[key], overrideValue[key])
        : overrideValue[key];
    }
    return merged;
  }

  return overrideValue == null ? baseValue : overrideValue;
}

function loadDashboardLocaleCatalog(extensionPath) {
  const localesDir = path.join(extensionPath, "resources", "locales");
  const fallbackPath = path.join(localesDir, "en.json");
  const fallback = JSON.parse(fs.readFileSync(fallbackPath, "utf8"));
  const catalog = { en: fallback };

  for (const language of SUPPORTED_LANGUAGES) {
    const localizedPath = path.join(localesDir, `${language}.json`);
    if (!fs.existsSync(localizedPath)) {
      catalog[language] = fallback;
      continue;
    }

    try {
      const localized = JSON.parse(fs.readFileSync(localizedPath, "utf8"));
      catalog[language] = mergeDeep(fallback, localized);
    } catch (_error) {
      catalog[language] = fallback;
    }
  }

  return catalog;
}

function loadDashboardStrings(extensionPath, language) {
  const catalog = loadDashboardLocaleCatalog(extensionPath);
  return catalog[language] || catalog.en;
}

function resolveBundledAudioPath(extensionPath, planPath) {
  const candidates = [
    path.resolve(extensionPath, "..", "..", "media", DEFAULT_AUDIO_FILE),
    path.join(extensionPath, "media", DEFAULT_AUDIO_FILE)
  ];

  if (planPath) {
    let currentDir = path.dirname(planPath);
    while (currentDir && currentDir !== path.dirname(currentDir)) {
      candidates.push(path.join(currentDir, "media", DEFAULT_AUDIO_FILE));
      currentDir = path.dirname(currentDir);
    }
  }

  const seen = new Set();
  for (const candidate of candidates) {
    if (seen.has(candidate)) {
      continue;
    }
    seen.add(candidate);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
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

function looksLikeTaskPlan(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return false;
  }
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== ".md") {
    return false;
  }
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return (
      content.includes("# TASK-PLAN v2") ||
      (content.includes("## Task Register") && content.includes("### TASK T-")) ||
      /type:\s*task-plan/i.test(content)
    );
  } catch (_error) {
    return false;
  }
}

function normalizeFsPath(targetPath) {
  return path.resolve(String(targetPath || ""));
}

function isPathInside(parentPath, childPath) {
  if (!parentPath || !childPath) {
    return false;
  }
  const normalizedParent = normalizeFsPath(parentPath);
  const normalizedChild = normalizeFsPath(childPath);
  if (normalizedParent === normalizedChild) {
    return true;
  }
  const relativePath = path.relative(normalizedParent, normalizedChild);
  return Boolean(relativePath) && !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
}

function isPathInsideAnyWorkspace(targetPath, workspaceRoots) {
  return normalizeArray(workspaceRoots).some((workspaceRoot) => isPathInside(workspaceRoot, targetPath));
}

function getKnownPlanCandidatesInDirectory(directoryPath) {
  if (!directoryPath || !fs.existsSync(directoryPath)) {
    return [];
  }

  const matches = [];
  for (const fileName of DEFAULT_PLAN_FILE_NAMES) {
    const candidatePath = path.join(directoryPath, fileName);
    if (looksLikeTaskPlan(candidatePath)) {
      matches.push(candidatePath);
    }
  }

  return matches;
}

function getWorkspaceDepth(rootPath, targetPath) {
  if (!rootPath || !targetPath || !isPathInside(rootPath, targetPath)) {
    return Number.POSITIVE_INFINITY;
  }
  const relativePath = path.relative(rootPath, targetPath);
  return relativePath.split(path.sep).filter(Boolean).length;
}

function rankTaskPlanCandidates(candidatePaths, activeEditorPath, workspaceRoots) {
  const uniquePaths = [...new Set(normalizeArray(candidatePaths).filter(Boolean).map((entry) => normalizeFsPath(entry)))];

  return uniquePaths
    .map((candidatePath) => {
      const baseName = path.basename(candidatePath);
      const knownName = DEFAULT_PLAN_FILE_NAMES.includes(baseName) ? 1 : 0;
      const workspaceDepth = workspaceRoots.reduce((best, workspaceRoot) => {
        return Math.min(best, getWorkspaceDepth(workspaceRoot, candidatePath));
      }, Number.POSITIVE_INFINITY);
      let activeMatchDistance = Number.POSITIVE_INFINITY;
      if (activeEditorPath) {
        const activeDir = path.dirname(activeEditorPath);
        const candidateDir = path.dirname(candidatePath);
        if (normalizeFsPath(candidatePath) === normalizeFsPath(activeEditorPath)) {
          activeMatchDistance = -1;
        } else if (isPathInside(candidateDir, activeDir)) {
          const relativePath = path.relative(candidateDir, activeDir);
          activeMatchDistance = relativePath.split(path.sep).filter(Boolean).length;
        }
      }
      let modifiedAt = 0;
      try {
        modifiedAt = fs.statSync(candidatePath).mtimeMs || 0;
      } catch (_error) {
        modifiedAt = 0;
      }

      return {
        candidatePath,
        knownName,
        workspaceDepth,
        activeMatchDistance,
        modifiedAt
      };
    })
    .sort((left, right) => {
      if (left.activeMatchDistance !== right.activeMatchDistance) {
        return left.activeMatchDistance - right.activeMatchDistance;
      }
      if (left.knownName !== right.knownName) {
        return right.knownName - left.knownName;
      }
      if (left.workspaceDepth !== right.workspaceDepth) {
        return left.workspaceDepth - right.workspaceDepth;
      }
      if (left.modifiedAt !== right.modifiedAt) {
        return right.modifiedAt - left.modifiedAt;
      }
      return left.candidatePath.localeCompare(right.candidatePath);
    })
    .map((entry) => entry.candidatePath);
}

function findNearestTaskPlanForActivePath(activePath, workspaceRoots) {
  if (!activePath || !fs.existsSync(activePath)) {
    return null;
  }

  const roots = normalizeArray(workspaceRoots).map((entry) => normalizeFsPath(entry));
  let currentDirectory = fs.statSync(activePath).isDirectory() ? activePath : path.dirname(activePath);

  while (currentDirectory && fs.existsSync(currentDirectory)) {
    const knownCandidates = getKnownPlanCandidatesInDirectory(currentDirectory);
    if (knownCandidates.length > 0) {
      return rankTaskPlanCandidates(knownCandidates, activePath, roots)[0] || knownCandidates[0];
    }

    const inWorkspace = roots.some((workspaceRoot) => isPathInside(workspaceRoot, currentDirectory));
    const parentDirectory = path.dirname(currentDirectory);
    if (!inWorkspace || parentDirectory === currentDirectory) {
      break;
    }
    currentDirectory = parentDirectory;
  }

  return null;
}

function findTaskPlanCandidatesInFolder(folderPath, maxDepth = 2) {
  const results = [];

  function walk(currentPath, depth) {
    if (depth > maxDepth || !fs.existsSync(currentPath)) {
      return;
    }
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git") {
        continue;
      }
      const fullPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, depth + 1);
        continue;
      }
      if (looksLikeTaskPlan(fullPath)) {
        results.push(fullPath);
      }
    }
  }

  walk(folderPath, 0);
  return results;
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
    this.languageOverride = normalizeDashboardLanguage(this.context.globalState.get("taskPlanDashboard.sessionLanguage"));
    this.language = this.languageOverride || resolveDashboardLanguage();
    this.strings = loadDashboardStrings(this.context.extensionPath, this.language);
    this.localeCatalog = loadDashboardLocaleCatalog(this.context.extensionPath);
    this.panel = null;
    this.selectedTaskId = null;
    this.changeEmitter = new vscode.EventEmitter();
    this.onDidChange = this.changeEmitter.event;
    this.watchers = [];
    this.refreshTimer = null;
  }

  async initialize() {
    await this.refresh();
  }

  dispose() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
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

  scheduleRefresh(delayMs = 150) {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    this.refreshTimer = setTimeout(() => {
      this.refreshTimer = null;
      void this.refresh();
    }, delayMs);
  }

  async refresh() {
    this.language = this.languageOverride || resolveDashboardLanguage();
    this.strings = loadDashboardStrings(this.context.extensionPath, this.language);
    this.localeCatalog = loadDashboardLocaleCatalog(this.context.extensionPath);
    this.planPath = await this.resolvePlanPath();
    this.model = await this.loadModel(this.planPath);
    const wroteEvents = await this.syncAutoEvents(this.model);
    if (wroteEvents) {
      this.model = await this.loadModel(this.planPath);
    }
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
      const localResourceRoots = [
        vscode.Uri.file(this.context.extensionPath)
      ];
      const bundledAudioPath = resolveBundledAudioPath(this.context.extensionPath, this.model.planPath);
      if (bundledAudioPath) {
        localResourceRoots.push(vscode.Uri.file(path.dirname(bundledAudioPath)));
      }
      this.panel = vscode.window.createWebviewPanel(
        "taskPlanDashboard.panel",
        this.strings.panelTitle,
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots
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
        return;
      case "setLanguage": {
        this.languageOverride = normalizeDashboardLanguage(message.language);
        await this.context.globalState.update("taskPlanDashboard.sessionLanguage", this.languageOverride || null);
        this.language = this.languageOverride || resolveDashboardLanguage();
        this.strings = loadDashboardStrings(this.context.extensionPath, this.language);
        this.localeCatalog = loadDashboardLocaleCatalog(this.context.extensionPath);
        if (this.model) {
          this.model.language = this.language;
          this.model.ui = this.strings.webview;
          this.model.locales = this.localeCatalog;
        }
        if (this.panel && this.model) {
          this.panel.title = `${this.strings.panelTitle}${this.model.feature?.feature_title ? ` · ${this.model.feature.feature_title}` : ""}`;
        }
        this.changeEmitter.fire();
        return;
      }
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

  async syncAutoEvents(model) {
    if (!model?.planDir || !model?.planPath) {
      return false;
    }

    const snapshotPath = path.join(model.planDir, DEFAULT_DASHBOARD_SNAPSHOT_PATH);
    const previousSnapshot = readJsonFile(snapshotPath);
    const nextSnapshot = buildDashboardSnapshot(model);
    const generatedEvents = deriveAutoEvents(previousSnapshot, nextSnapshot, model);

    ensureParentDirectory(snapshotPath);
    fs.writeFileSync(snapshotPath, JSON.stringify(nextSnapshot, null, 2));

    if (generatedEvents.length === 0) {
      return false;
    }

    appendEvents(model.eventsPath, generatedEvents);
    return true;
  }

  installWatchers(model) {
    for (const watcher of this.watchers) {
      watcher.dispose();
    }
    this.watchers = [];

    if (!model?.planPath) {
      return;
    }

    const pathsToWatch = [model.planPath, model.featurePrepPath, model.eventsPath, model.executionStatePath]
      .filter(Boolean)
      .filter((targetPath) => fs.existsSync(targetPath));
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

    const workspaceFolders = vscode.workspace.workspaceFolders || [];
    const workspaceRoots = workspaceFolders.map((folder) => folder.uri.fsPath);
    const activeEditorPath = vscode.window.activeTextEditor?.document?.uri?.scheme === "file"
      ? vscode.window.activeTextEditor.document.uri.fsPath
      : null;
    if (activeEditorPath && looksLikeTaskPlan(activeEditorPath)) {
      return activeEditorPath;
    }

    const nearestPlan = findNearestTaskPlanForActivePath(activeEditorPath, workspaceRoots);
    if (nearestPlan) {
      return nearestPlan;
    }

    const persistedPath = this.context.globalState.get("taskPlanDashboard.selectedPlanPath");
    if (
      persistedPath &&
      looksLikeTaskPlan(persistedPath) &&
      (workspaceRoots.length === 0 || isPathInsideAnyWorkspace(persistedPath, workspaceRoots))
    ) {
      return persistedPath;
    }

    const workspaceCandidates = [];
    for (const folder of workspaceFolders) {
      workspaceCandidates.push(...getKnownPlanCandidatesInDirectory(folder.uri.fsPath));
      workspaceCandidates.push(...findTaskPlanCandidatesInFolder(folder.uri.fsPath, 2));
    }
    const rankedWorkspaceCandidates = rankTaskPlanCandidates(workspaceCandidates, activeEditorPath, workspaceRoots);
    if (rankedWorkspaceCandidates.length > 0) {
      return rankedWorkspaceCandidates[0];
    }

    const discovered = await vscode.workspace.findFiles(`**/${DEFAULT_PLAN_NAME}`, "**/node_modules/**", 20);
    if (discovered.length > 0) {
      return discovered[0].fsPath;
    }

    const markdownCandidates = await vscode.workspace.findFiles("**/*.{md,MD}", "**/node_modules/**", 200);
    for (const candidate of markdownCandidates) {
      if (looksLikeTaskPlan(candidate.fsPath)) {
        return candidate.fsPath;
      }
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
    const executionStatePath = path.join(planDir, DEFAULT_EXECUTION_STATE_NAME);
    const executionState = parseExecutionState(executionStatePath);
    const prep = parseFeaturePreparation(featurePrepPath);
    const eventsPath = path.join(planDir, DEFAULT_EVENTS_PATH);
    const snapshotPath = path.join(planDir, DEFAULT_DASHBOARD_SNAPSHOT_PATH);
    const events = parseEvents(eventsPath);
    let enriched = enrichTasks(parsedPlan.tasks, events, parsedPlan.taskRegisterRows, executionState);
    enriched = normalizeClosureStatuses(enriched);

    const counts = {};
    for (const status of STATUS_ORDER) {
      counts[status] = enriched.filter((task) => task.status === status).length;
    }

    const reviewQueue = enriched.filter((task) => task.status === "needs_review" || task.owner_role === "reviewer").length;
    const testQueue = enriched.filter((task) => task.owner_role === "tester" || task.status === "approved").length;
    const doneCount = counts.done || 0;
    const total = enriched.length;
    const governanceWarnings = enriched.reduce((sum, task) => sum + normalizeArray(task.governance_issues).length, 0);
    const timeline = buildTimeline(events, executionState);

    return {
      planPath,
      planDir,
      language: this.language,
      ui: this.strings.webview,
      locales: this.localeCatalog,
      featurePrepPath,
      executionStatePath,
      snapshotPath,
      executionState,
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
      governanceWarnings,
      total,
      graph: buildGraph(enriched),
      ownerBreakdown: groupByOwner(enriched)
    };
  }

  renderWebview(webview, model, selectedTaskId) {
    const nonce = createNonce();
    const ui = model.ui || this.strings.webview;
    const selectedTask = model.tasks.find((task) => task.task_id === selectedTaskId) || model.tasks[0] || null;
    const bundledAudioPath = resolveBundledAudioPath(this.context.extensionPath, model.planPath);
    const bundledBgmUri = bundledAudioPath
      ? webview.asWebviewUri(vscode.Uri.file(bundledAudioPath)).toString()
      : "";
    const payload = JSON.stringify({
      language: model.language || this.language,
      ui,
      locales: model.locales || this.localeCatalog,
      feature: model.feature,
      planPath: model.planPath,
      featurePrepPath: model.featurePrepPath,
      executionState: model.executionState,
      counts: model.counts,
      reviewQueue: model.reviewQueue,
      testQueue: model.testQueue,
      doneCount: model.doneCount,
      governanceWarnings: model.governanceWarnings,
      total: model.total,
      prep: model.prep,
      tasks: model.tasks,
      timeline: model.timeline,
      graph: model.graph,
      ownerBreakdown: model.ownerBreakdown,
      audio: {
        bundledBgmUri,
        bundledBgmName: bundledAudioPath ? path.basename(bundledAudioPath) : ""
      },
      selectedTaskId: selectedTask?.task_id || null
    }).replace(/</g, "\\u003c");

    return `<!DOCTYPE html>
<html lang="${model.language || this.language}">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; media-src ${webview.cspSource} data: blob:; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${this.strings.panelTitle}</title>
  <style>
    :root {
      --bg: #03060f;
      --panel: rgba(10, 16, 33, 0.72);
      --panel-border: rgba(96, 165, 250, 0.1);
      --panel-border-active: rgba(96, 165, 250, 0.35);
      --text: #f3f4f6;
      --muted: #64748b;
      --c-planner: #00d2ff;
      --c-worker: #ff9d00;
      --c-reviewer: #bd00ff;
      --c-tester: #00ff87;
      --c-docs: #ff007b;
      --c-alert: #ff3c3c;
      --c-inactive: #1e293b;
    }

    * {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      min-height: 100%;
    }

    body {
      background:
        radial-gradient(circle at 50% 0%, #0c152b 0%, var(--bg) 95%),
        linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0));
      color: var(--text);
      font-family: "Outfit", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      padding: 20px;
    }

    button,
    select,
    input[type="range"] {
      font: inherit;
    }

    button {
      cursor: pointer;
    }

    .dashboard-grid {
      max-width: 1650px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
      gap: 20px;
    }

    header {
      grid-column: 1 / -1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 16px 28px;
      background: var(--panel);
      backdrop-filter: blur(20px);
      border: 1px solid var(--panel-border);
      border-radius: 20px;
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.05);
    }

    .brand h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: 0.3px;
      background: linear-gradient(90deg, #38bdf8, #a855f7, #ec4899);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand p {
      margin: 6px 0 0;
      font-size: 12px;
      color: var(--muted);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .brand p::before {
      content: "";
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--c-tester);
      box-shadow: 0 0 8px var(--c-tester);
      animation: pulseIndicator 1s infinite alternate;
    }

    .brand-title-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      flex-wrap: wrap;
    }

    .brand-chip {
      font-size: 11px;
      line-height: 1;
      background: rgba(0, 210, 255, 0.1);
      color: var(--c-planner);
      padding: 4px 8px;
      border-radius: 8px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      border: 1px solid rgba(0, 210, 255, 0.2);
    }

    .controls {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 10px;
      align-items: center;
    }

    .audio-toggle {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--panel-border);
      color: var(--text);
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      padding: 0;
    }

    .audio-toggle.active,
    .audio-toggle:hover {
      background: rgba(0, 210, 255, 0.1);
      border-color: var(--c-planner);
      color: var(--c-planner);
      box-shadow: 0 0 10px rgba(0, 210, 255, 0.2);
    }

    .btn {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--panel-border);
      color: var(--text);
      padding: 10px 18px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 13px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
      text-align: center;
    }

    .btn:hover {
      background: rgba(255, 255, 255, 0.07);
      border-color: rgba(255, 255, 255, 0.15);
      transform: translateY(-1px);
    }

    .btn-primary {
      background: linear-gradient(135deg, #0099ff, #bd00ff);
      border: none;
    }

    .btn-primary:hover {
      box-shadow: 0 4px 15px rgba(189, 0, 255, 0.35);
    }

    .btn-danger {
      background: rgba(255, 60, 60, 0.1);
      border-color: rgba(255, 60, 60, 0.2);
      color: #ffa4a4;
    }

    .btn-danger:hover {
      background: rgba(255, 60, 60, 0.2);
      border-color: var(--c-alert);
    }

    .settings-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
      padding: 12px 16px;
      background: rgba(15, 23, 42, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      backdrop-filter: blur(10px);
      grid-column: 1 / -1;
    }

    .setting-item {
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 36px;
    }

    .setting-item label,
    .setting-item .setting-label {
      font-size: 12px;
      color: var(--muted);
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .setting-item select,
    .setting-item input[type="checkbox"] {
      accent-color: var(--c-planner);
    }

    .setting-item select {
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #fff;
      padding: 6px 12px;
      border-radius: 6px;
    }

    .setting-pill {
      padding: 6px 10px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(255, 255, 255, 0.03);
      border-radius: 999px;
      color: #cbd5e1;
      font-size: 11px;
      max-width: 420px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .left-col,
    .right-col {
      display: flex;
      flex-direction: column;
      gap: 20px;
      min-width: 0;
    }

    .panel {
      background: var(--panel);
      backdrop-filter: blur(20px);
      border: 1px solid var(--panel-border);
      border-radius: 24px;
      padding: 24px;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.04);
      position: relative;
      overflow: hidden;
    }

    .panel-title,
    .section-head {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      letter-spacing: 0.02em;
    }

    .section-head h2,
    .panel-title h2 {
      margin: 0;
      font-size: inherit;
      font-weight: inherit;
    }

    .section-head .subtle,
    .panel-title .subtle {
      font-size: 12px;
      padding: 3px 10px;
      border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.04);
      background: rgba(255,255,255,0.02);
      color: var(--muted);
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 12px;
      grid-column: 1 / -1;
    }

    .summary-card {
      background: linear-gradient(180deg, rgba(255,255,255,0.015), rgba(255,255,255,0.003));
      border: 1px solid var(--panel-border);
      border-radius: 16px;
      padding: 14px;
      min-height: 110px;
    }

    .summary-card .label {
      color: var(--muted);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }

    .summary-card .value {
      font-size: 24px;
      font-weight: 700;
      margin-top: 8px;
      background: linear-gradient(135deg, #fff 0%, #cbd5e1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .prep-bar {
      height: 6px;
      background: rgba(255,255,255,0.05);
      border-radius: 10px;
      margin-top: 8px;
      overflow: hidden;
    }

    .prep-bar > span {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, var(--c-planner), var(--c-tester));
      border-radius: 10px;
    }

    .subtle {
      color: var(--muted);
      font-size: 12px;
    }

    .graph-panel.fullscreen-active {
      position: fixed;
      inset: 0;
      z-index: 9999;
      margin: 0;
      border: none;
      border-radius: 0;
      background: rgba(10, 15, 30, 0.96);
      padding: 24px;
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .graph-panel.fullscreen-active .graph-canvas-wrap {
      flex: 1;
      min-height: calc(100vh - 140px);
    }

    .graph-tools {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .btn-sm {
      padding: 6px 10px;
      font-size: 11px;
      border-radius: 8px;
    }

    .graph-canvas-wrap {
      background: #020408;
      border: 1px solid var(--panel-border);
      border-radius: 16px;
      position: relative;
      overflow: hidden;
      height: clamp(420px, 48vh, 620px);
      min-height: 420px;
      box-shadow: inset 0 2px 10px rgba(0,0,0,0.8);
    }

    .graph-wrap {
      width: 100%;
      height: 100%;
      min-width: 100%;
      min-height: 100%;
    }

    .graph-wrap svg {
      display: block;
      width: 100%;
      height: 100%;
      min-width: 0;
    }

    #graph-svg {
      width: 100%;
      height: 100%;
      cursor: grab;
      user-select: none;
      touch-action: none;
    }

    #graph-svg.is-panning {
      cursor: grabbing;
    }

    .graph-node {
      cursor: grab;
      transition: filter 0.2s ease;
    }

    .graph-node text {
      pointer-events: none;
    }

    .graph-node.dragging {
      cursor: grabbing;
      filter: drop-shadow(0 0 14px rgba(96, 165, 250, 0.35));
    }

    .graph-node rect {
      fill: #0c1224;
      stroke: var(--panel-border);
      stroke-width: 1.5;
      rx: 14px;
      transition: fill 0.25s, stroke 0.25s;
    }

    .graph-node:hover rect {
      stroke: rgba(255,255,255,0.25);
    }

    .graph-node.active rect {
      fill: #0b1a3d;
      stroke: var(--c-planner);
      stroke-width: 2;
    }

    .graph-node.done rect {
      stroke: var(--c-tester);
    }

    .graph-node.blocked rect {
      stroke: var(--c-alert);
    }

    .graph-connection-line {
      fill: none;
      stroke: #334155;
      stroke-width: 2.5;
      transition: stroke 0.3s, stroke-width 0.3s;
    }

    .graph-connection-line.active {
      stroke: var(--c-planner);
      stroke-width: 3.5;
      stroke-dasharray: 6 4;
      animation: dashMove 0.8s linear infinite;
    }

    .graph-connection-line.blocked {
      stroke: var(--c-alert);
      stroke-width: 3.5;
      stroke-dasharray: 5 3;
      animation: dashMove 0.4s linear infinite;
    }

    .graph-connection-line.done {
      stroke: var(--c-tester);
      stroke-width: 3;
    }

    .kanban-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }

    .kanban-column {
      background: rgba(255,255,255,0.01);
      border: 1px solid var(--panel-border);
      border-radius: 18px;
      padding: 12px;
      min-height: 250px;
    }

    .kanban-column h3 {
      margin: 0 0 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid rgba(255,255,255,0.03);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--muted);
      font-weight: 700;
    }

    .kanban-card,
    .task-card {
      background: #080d18;
      border: 1px solid var(--panel-border);
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .kanban-card:hover,
    .task-card:hover {
      border-color: var(--panel-border-active);
      transform: translateY(-1px);
    }

    .kanban-card.selected,
    .task-card.selected {
      border-color: var(--c-planner);
      background: #0a172e;
      box-shadow: 0 0 10px rgba(0, 210, 255, 0.1);
    }

    .kanban-card .title,
    .task-card .title {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 8px;
      line-height: 1.35;
    }

    .meta-badges {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .card-badge {
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 20px;
      background: rgba(255,255,255,0.04);
      color: var(--muted);
      border: 1px solid rgba(255,255,255,0.04);
    }

    .card-badge.status-ready { color: var(--c-planner); background: rgba(0, 210, 255, 0.08); }
    .card-badge.status-work { color: var(--c-worker); background: rgba(255, 157, 0, 0.08); }
    .card-badge.status-review { color: var(--c-reviewer); background: rgba(189, 0, 255, 0.08); }
    .card-badge.status-done { color: var(--c-tester); background: rgba(0, 255, 135, 0.08); }
    .card-badge.status-blocked { color: var(--c-alert); background: rgba(255, 60, 60, 0.08); }

    .console-panel {
      background: #020408;
      border: 1px solid var(--panel-border);
      border-radius: 16px;
      padding: 16px;
      font-family: "Fira Code", "SFMono-Regular", ui-monospace, monospace;
      font-size: 12px;
      line-height: 1.55;
      min-height: 220px;
      max-height: 260px;
      overflow-y: auto;
      box-shadow: inset 0 2px 8px rgba(0,0,0,0.8);
      color: #38bdf8;
      white-space: pre-wrap;
    }

    .console-line {
      padding: 2px 0;
    }

    .console-line.system {
      color: #7dd3fc;
    }

    .console-line.success {
      color: #86efac;
    }

    .console-line.warn {
      color: #fcd34d;
    }

    .console-line.error {
      color: #fca5a5;
    }

    .agent-stage-inner {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
      position: relative;
      padding: 20px 0;
    }

    .agent-stage-wrap {
      position: relative;
      padding-top: 98px;
      overflow: visible;
    }

    .stage-overlay-bubble {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      z-index: 30;
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 14px 16px;
      border-radius: 16px;
      border: 1px solid rgba(96, 165, 250, 0.35);
      background: linear-gradient(180deg, rgba(12, 20, 40, 0.96), rgba(8, 14, 28, 0.94));
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
      opacity: 0;
      transform: translateY(-8px);
      pointer-events: none;
      transition: opacity 0.22s ease, transform 0.22s ease;
    }

    .stage-overlay-bubble.visible {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }

    .stage-overlay-bubble-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .stage-overlay-role {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #dbeafe;
    }

    .stage-overlay-role::before {
      content: "";
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
      box-shadow: 0 0 10px currentColor;
    }

    .stage-overlay-close {
      width: 28px;
      height: 28px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.04);
      color: #cbd5e1;
      font-size: 15px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease;
    }

    .stage-overlay-close:hover {
      background: rgba(255,255,255,0.08);
      border-color: rgba(255,255,255,0.18);
      color: #fff;
    }

    .stage-overlay-text {
      font-size: 13px;
      line-height: 1.45;
      color: #e2e8f0;
      max-width: 100%;
      word-break: break-word;
    }

    .agent-laser-track {
      position: absolute;
      top: 75px;
      left: 10%;
      width: 80%;
      height: 4px;
      background: rgba(255,255,255,0.02);
      border-radius: 10px;
      z-index: 1;
    }

    .agent-laser-beam {
      position: absolute;
      inset: 0 auto 0 0;
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, var(--c-planner), var(--c-worker), var(--c-reviewer), var(--c-tester), var(--c-docs));
      box-shadow: 0 0 10px rgba(0, 210, 255, 0.7);
      border-radius: 10px;
      transition: width 0.6s ease;
    }

    .agent-podium {
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 2;
      position: relative;
    }

    .avatar-wrap {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: radial-gradient(circle at center, #0d1222 0%, #05070e 100%);
      border: 2px solid rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .avatar-wrap::before {
      content: "";
      position: absolute;
      inset: -6px;
      border-radius: 50%;
      border: 2px dashed transparent;
      opacity: 0;
      transition: all 0.3s ease;
    }

    .agent-podium.active .avatar-wrap {
      transform: scale(1.15) translateY(-5px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }

    .agent-podium.active .avatar-wrap::before {
      opacity: 1;
      animation: spinBorder 15s linear infinite;
    }

    .agent-podium[data-role="planner"].active .avatar-wrap,
    .agent-podium[data-role="planner"].active .avatar-wrap::before { border-color: var(--c-planner); }
    .agent-podium[data-role="worker"].active .avatar-wrap,
    .agent-podium[data-role="worker"].active .avatar-wrap::before { border-color: var(--c-worker); }
    .agent-podium[data-role="reviewer"].active .avatar-wrap,
    .agent-podium[data-role="reviewer"].active .avatar-wrap::before { border-color: var(--c-reviewer); }
    .agent-podium[data-role="tester"].active .avatar-wrap,
    .agent-podium[data-role="tester"].active .avatar-wrap::before { border-color: var(--c-tester); }
    .agent-podium[data-role="docs"].active .avatar-wrap,
    .agent-podium[data-role="docs"].active .avatar-wrap::before { border-color: var(--c-docs); }

    .bot-svg {
      width: 64px;
      height: 64px;
      transform-origin: bottom center;
    }

    .agent-podium.active .bot-svg {
      animation: breatheBot 1.8s ease-in-out infinite alternate;
    }

    .gear-cw { transform-origin: 32px 28px; }
    .gear-ccw { transform-origin: 32px 28px; }
    .agent-podium[data-role="planner"].active .gear-cw { animation: spinCW 8s linear infinite; }
    .agent-podium[data-role="planner"].active .gear-ccw { animation: spinCCW 6s linear infinite; }

    .worker-hand-l { transform-origin: 22px 52px; }
    .worker-hand-r { transform-origin: 42px 52px; }
    .agent-podium[data-role="worker"].active .worker-hand-l { animation: handTypeL 0.15s infinite alternate; }
    .agent-podium[data-role="worker"].active .worker-hand-r { animation: handTypeR 0.12s infinite alternate; }

    .reviewer-laser { display: none; }
    .agent-podium[data-role="reviewer"].active .reviewer-laser { display: block; animation: scanBeam 1s alternate infinite; }

    .b-flask-1 { transform-origin: 15px 50px; }
    .agent-podium[data-role="tester"].active .b-flask-1 { animation: bubbleRising 1.2s infinite linear; }

    .docs-page-r { transform-origin: 32px 30px; }
    .agent-podium[data-role="docs"].active .docs-page-r { animation: bookPageFlip 1.8s infinite ease-in-out; }

    .agent-glyph {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 700;
      background: rgba(255,255,255,0.03);
      color: #f8fafc;
      box-shadow: inset 0 1px 1px rgba(255,255,255,0.05);
    }

    .role-label {
      margin-top: 10px;
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--muted);
    }

    .agent-podium.active .role-label {
      color: var(--text);
    }

    .speech-bubble {
      display: none;
    }

    .detail-grid,
    .details-split-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .detail-card {
      border: 1px solid var(--panel-border);
      border-radius: 14px;
      background: rgba(255,255,255,0.01);
      padding: 12px;
    }

    .detail-card h4 {
      margin: 0 0 8px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--muted);
      font-weight: 700;
    }

    .list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .list-item {
      border: 1px solid var(--panel-border);
      background: rgba(255,255,255,0.02);
      border-radius: 12px;
      padding: 10px 12px;
    }

    .artifact-button {
      width: 100%;
      text-align: left;
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--panel-border);
      color: #cfe8ff;
      padding: 10px 12px;
      border-radius: 12px;
    }

    .artifact-button:hover {
      border-color: var(--panel-border-active);
      background: rgba(255,255,255,0.04);
    }

    .owners {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .owner-box {
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--panel-border);
      border-radius: 12px;
      padding: 10px 12px;
    }

    .owner-box .count {
      font-size: 24px;
      font-weight: 700;
      margin-top: 6px;
    }

    .chat-container,
    .timeline {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 320px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .chat-msg {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.015);
      border: 1px solid var(--panel-border);
      max-width: 92%;
      animation: slideMsg 0.3s ease forwards;
    }

    .chat-msg.left {
      align-self: flex-start;
      border-top-left-radius: 3px;
    }

    .chat-msg.right {
      align-self: flex-end;
      border-top-right-radius: 3px;
      background: rgba(255, 255, 255, 0.025);
    }

    .chat-header {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--muted);
    }

    .chat-body {
      font-size: 12.5px;
      line-height: 1.45;
      color: #cbd5e1;
    }

    .task-meta-item {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      font-size: 12px;
    }

    .task-meta-item:last-child {
      border-bottom: none;
    }

    .audio-drawer-toggle {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--c-planner), var(--c-worker));
      border: none;
      box-shadow: 0 8px 32px rgba(0, 210, 255, 0.3);
      color: #fff;
      z-index: 1000;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      padding: 0;
    }

    .audio-drawer-toggle:hover {
      transform: scale(1.1) rotate(15deg);
      box-shadow: 0 12px 40px rgba(0, 210, 255, 0.5);
    }

    .audio-drawer-toggle.active {
      transform: scale(0.9) rotate(-90deg);
      background: #1e293b;
      border: 1px solid rgba(255,255,255,0.1);
      box-shadow: none;
    }

    .audio-drawer {
      position: fixed;
      bottom: 84px;
      right: -360px;
      width: 320px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 20px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
      z-index: 999;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      opacity: 0;
      transform: translateY(20px);
      pointer-events: none;
    }

    .audio-drawer.open {
      right: 24px;
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }

    .audio-drawer-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 16px;
    }

    .audio-drawer-head h3 {
      margin: 0;
      font-size: 14px;
      color: var(--c-planner);
    }

    .audio-drawer-head button {
      background: none;
      border: none;
      color: var(--muted);
      width: auto;
      height: auto;
      padding: 0;
      font-size: 16px;
    }

    .bgm-track-info {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 16px;
      font-size: 11px;
      border: 1px solid rgba(255, 255, 255, 0.03);
    }

    .bgm-track-title {
      font-weight: 600;
      color: #f8fafc;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 4px;
    }

    .bgm-track-meta {
      color: var(--muted);
      display: flex;
      justify-content: space-between;
      gap: 10px;
      font-size: 11px;
    }

    .audio-control-row {
      margin-bottom: 16px;
    }

    .audio-control-row label {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--muted);
      margin-bottom: 6px;
    }

    .audio-control-row label strong {
      color: #fff;
    }

    .audio-control-row input[type="range"] {
      width: 100%;
      height: 4px;
      border-radius: 2px;
      background: rgba(255, 255, 255, 0.1);
      outline: none;
      -webkit-appearance: none;
      accent-color: var(--c-planner);
    }

    .audio-buttons {
      display: flex;
      gap: 8px;
    }

    .audio-buttons button {
      flex: 1;
    }

    .audio-upload-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 12px;
    }

    .empty-state {
      color: var(--muted);
      font-size: 12px;
      padding: 8px 0;
    }

    @keyframes spinBorder {
      100% { transform: rotate(360deg); }
    }

    @keyframes breatheBot {
      0% { transform: translateY(0); }
      100% { transform: translateY(-5px); }
    }

    @keyframes spinCW {
      100% { transform: rotate(360deg); }
    }

    @keyframes spinCCW {
      100% { transform: rotate(-360deg); }
    }

    @keyframes handTypeL {
      0% { transform: translateY(0); }
      100% { transform: translateY(-3px); }
    }

    @keyframes handTypeR {
      0% { transform: translateY(0); }
      100% { transform: translateY(-3px); }
    }

    @keyframes scanBeam {
      0% { transform: translateY(-3px); opacity: 0.3; }
      100% { transform: translateY(10px); opacity: 0.8; }
    }

    @keyframes bubbleRising {
      0% { transform: translateY(6px) scale(0.6); opacity: 0.2; }
      100% { transform: translateY(-16px) scale(1.1); opacity: 0; }
    }

    @keyframes bookPageFlip {
      0%, 100% { transform: scaleX(1); }
      50% { transform: scaleX(0); }
    }

    @keyframes pulseIndicator {
      0% { opacity: 0.6; }
      100% { opacity: 1; }
    }

    @keyframes dashMove {
      100% { stroke-dashoffset: -20; }
    }

    @keyframes slideMsg {
      from { transform: translateY(10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @media (max-width: 1250px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 900px) {
      body {
        padding: 14px;
      }
      header {
        flex-direction: column;
        align-items: stretch;
      }
      .controls {
        justify-content: flex-start;
      }
      .kanban-grid,
      .detail-grid,
      .details-split-grid,
      .owners,
      .agent-stage-inner {
        grid-template-columns: 1fr;
      }
      .agent-laser-track {
        display: none;
      }
      .audio-drawer {
        width: calc(100vw - 48px);
      }
    }
  </style>
</head>
<body>
  <div class="dashboard-grid">
    <header>
      <div class="brand">
        <div class="brand-title-row">
          <h1 id="hero-title"></h1>
          <span class="brand-chip">UNIFIED</span>
        </div>
        <p id="hero-subtitle"></p>
      </div>
      <div class="controls">
        <button class="audio-toggle" id="header-audio-toggle" title="Audio">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        </button>
        <button class="btn btn-primary" id="open-plan">${ui.buttons.openPlan}</button>
        <button class="btn" id="open-feature-prep">${ui.buttons.openFeaturePrep}</button>
        <button class="btn btn-danger" id="refresh-dashboard">${ui.buttons.refresh}</button>
        <button class="btn" id="narrate-selected-task"></button>
      </div>
    </header>

    <div class="settings-bar">
      <div class="setting-item">
        <span class="setting-label">🌐 <span id="language-switcher-label"></span></span>
        <select id="language-switcher"></select>
      </div>
      <div class="setting-item">
        <label><input type="checkbox" id="tts-autoplay" /> Auto TTS</label>
      </div>
      <div class="setting-item">
        <span class="setting-label">📍 Plan</span>
        <span class="setting-pill" id="plan-path-pill"></span>
      </div>
      <div class="setting-item">
        <span class="setting-label">🎵 BGM</span>
        <span class="setting-pill" id="bgm-status-pill"></span>
      </div>
    </div>

    <div class="summary-grid" id="summary-grid"></div>

    <div class="left-col">
      <section class="panel graph-panel" id="panel-dependency-graph">
        <div class="section-head">
          <h2 id="graph-title">${ui.sections.dependencyGraph}</h2>
          <div class="graph-tools">
            <span class="subtle" id="graph-hint">${ui.hints.dependencyGraph}</span>
            <button class="btn btn-sm" id="graph-reset-view">Reset View</button>
            <button class="btn btn-sm" id="graph-fullscreen-toggle">Fullscreen</button>
          </div>
        </div>
        <div class="graph-canvas-wrap">
          <div class="graph-wrap" id="graph-wrap"></div>
        </div>
      </section>

      <section class="panel">
        <div class="section-head">
          <h2 id="kanban-title">${ui.sections.kanban}</h2>
          <span class="subtle" id="kanban-hint">${ui.hints.kanban}</span>
        </div>
        <div class="kanban-grid" id="kanban"></div>
      </section>

      <section class="panel">
        <div class="section-head">
          <h2>Terminal Monitor</h2>
          <span class="subtle">Commands and active execution evidence</span>
        </div>
        <div class="console-panel" id="terminal-console"></div>
      </section>
    </div>

    <div class="right-col">
      <section class="panel">
        <div class="section-head">
          <h2>Active Agent Pipeline</h2>
          <span class="subtle">Current ownership and handoff state</span>
        </div>
        <div class="agent-stage-wrap">
          <div class="stage-overlay-bubble" id="stage-overlay-bubble" aria-hidden="true">
            <div class="stage-overlay-bubble-header">
              <div class="stage-overlay-role" id="stage-overlay-role">Planner</div>
              <button class="stage-overlay-close" id="stage-overlay-close" type="button" aria-label="Close">×</button>
            </div>
            <div class="stage-overlay-text" id="stage-overlay-text"></div>
          </div>
          <div class="agent-stage-inner">
            <div class="agent-laser-track"><div class="agent-laser-beam" id="agent-laser-beam"></div></div>
            <div class="agent-podium" data-role="planner">
              <div class="speech-bubble" id="bubble-planner"></div>
              <div class="avatar-wrap">
              <svg class="bot-svg" viewBox="0 0 64 64">
                <circle cx="32" cy="28" r="18" fill="rgba(0, 210, 255, 0.05)" stroke="var(--c-planner)" stroke-width="1.5"/>
                <circle class="gear-cw" cx="32" cy="28" r="12" fill="none" stroke="var(--c-planner)" stroke-width="0.8" stroke-dasharray="3 3"/>
                <circle class="gear-ccw" cx="32" cy="28" r="7" fill="none" stroke="var(--c-planner)" stroke-width="1" stroke-dasharray="4 2"/>
                <rect x="21" y="27" width="22" height="3" rx="1.5" fill="#020408"/>
                <rect x="23" y="28" width="18" height="1.2" rx="0.6" fill="#00ffff" />
                <path d="M 24 46 L 40 46 L 37 56 L 27 56 Z" fill="#1b2a4a" />
              </svg>
              </div>
              <div class="role-label">Planner</div>
            </div>
            <div class="agent-podium" data-role="worker">
              <div class="speech-bubble" id="bubble-worker"></div>
              <div class="avatar-wrap">
              <svg class="bot-svg" viewBox="0 0 64 64">
                <rect x="18" y="14" width="28" height="24" rx="6" fill="#1e293b" stroke="var(--c-worker)" stroke-width="1.5"/>
                <path id="worker-eyes" d="M 24 25 L 29 25 M 35 25 L 40 25" stroke="var(--c-worker)" stroke-width="2.5" stroke-linecap="round"/>
                <rect x="28" y="38" width="8" height="8" fill="#0f172a" stroke="#475569" stroke-width="1"/>
                <path d="M 20 46 L 44 46 L 40 56 L 24 56 Z" fill="#334155"/>
                <g class="worker-hand-l"><circle cx="18" cy="51" r="3.5" fill="#f8fafc" stroke="var(--c-worker)" stroke-width="1"/></g>
                <g class="worker-hand-r"><circle cx="46" cy="51" r="3.5" fill="#f8fafc" stroke="var(--c-worker)" stroke-width="1"/></g>
              </svg>
              </div>
              <div class="role-label">Worker</div>
            </div>
            <div class="agent-podium" data-role="reviewer">
              <div class="speech-bubble" id="bubble-reviewer"></div>
              <div class="avatar-wrap">
              <svg class="bot-svg" viewBox="0 0 64 64">
                <path d="M 32 10 L 48 36 L 16 36 Z" fill="#2e1065" stroke="var(--c-reviewer)" stroke-width="1.5"/>
                <rect x="28" y="36" width="8" height="10" fill="#1e1b4b"/>
                <path d="M 22 46 L 42 46 L 38 56 L 26 56 Z" fill="#4c1d95"/>
                <circle cx="32" cy="25" r="5" fill="#020617" stroke="var(--c-reviewer)" stroke-width="1.2"/>
                <polygon class="reviewer-laser" points="32,25 15,56 49,56" fill="rgba(189, 0, 255, 0.15)"/>
              </svg>
              </div>
              <div class="role-label">Reviewer</div>
            </div>
            <div class="agent-podium" data-role="tester">
              <div class="speech-bubble" id="bubble-tester"></div>
              <div class="avatar-wrap">
              <svg class="bot-svg" viewBox="0 0 64 64">
                <path d="M 20 16 C 20 16 20 8 32 8 C 44 8 44 16 44 16 L 42 38 C 42 38 42 42 32 42 C 22 42 22 38 22 38 Z" fill="#064e3b" stroke="var(--c-tester)" stroke-width="1.5"/>
                <rect x="27" y="42" width="10" height="8" fill="#022c22"/>
                <rect x="25" y="18" width="14" height="10" rx="2" fill="#022c22"/>
                <circle class="b-flask-1" cx="16" cy="50" r="2.5" fill="var(--c-tester)"/>
                <circle class="b-flask-1" cx="48" cy="46" r="2.5" fill="var(--c-tester)"/>
              </svg>
              </div>
              <div class="role-label">Tester</div>
            </div>
            <div class="agent-podium" data-role="docs">
              <div class="speech-bubble" id="bubble-docs"></div>
              <div class="avatar-wrap">
              <svg class="bot-svg" viewBox="0 0 64 64">
                <ellipse cx="32" cy="18" rx="12" ry="9" fill="#4d0023" stroke="var(--c-docs)" stroke-width="1.5"/>
                <g class="docs-page-r">
                  <path d="M 32 30 C 40 26 48 30 48 30 L 46 44 C 46 44 40 40 32 44 Z" fill="rgba(255, 0, 123, 0.2)" stroke="var(--c-docs)" stroke-width="1"/>
                </g>
                <path d="M 32 30 C 24 26 16 30 16 30 L 18 44 C 18 44 24 40 32 44 Z" fill="rgba(255, 0, 123, 0.15)" stroke="var(--c-docs)" stroke-width="1"/>
                <rect x="29" y="44" width="6" height="10" fill="#4d0023"/>
              </svg>
              </div>
              <div class="role-label">Docs</div>
            </div>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="section-head">
          <h2 id="selected-task-title">${ui.sections.selectedTask}</h2>
          <span class="subtle" id="selected-task-hint">${ui.hints.selectedTask}</span>
        </div>
        <div id="selected-task"></div>
      </section>

      <section class="panel">
        <div class="section-head">
          <h2 id="execution-state-title">${ui.sections.currentExecutionState}</h2>
          <span class="subtle" id="execution-state-hint">${ui.hints.currentExecutionState}</span>
        </div>
        <div id="execution-state"></div>
      </section>

      <section class="panel">
        <div class="section-head">
          <h2 id="owners-title">${ui.sections.ownerBreakdown}</h2>
          <span class="subtle" id="owners-hint">${ui.hints.ownerBreakdown}</span>
        </div>
        <div class="owners" id="owners"></div>
      </section>

      <section class="panel">
        <div class="section-head">
          <h2 id="timeline-title">${ui.sections.eventTimeline}</h2>
          <span class="subtle" id="timeline-hint">${ui.hints.eventTimeline}</span>
        </div>
        <div class="chat-container" id="timeline"></div>
      </section>
    </div>
  </div>

  <button class="audio-drawer-toggle" id="btn-audio-drawer" title="">♪</button>
  <div class="audio-drawer" id="audio-drawer-panel" aria-hidden="true">
    <div class="audio-drawer-head">
      <h3 id="audio-panel-title"></h3>
      <button id="btn-close-audio-drawer">✕</button>
    </div>
    <div class="bgm-track-info">
      <div class="bgm-track-title" id="drawer-bgm-title"></div>
      <div class="bgm-track-meta">
        <span id="drawer-now-playing-label"></span>
        <span id="drawer-bgm-index"></span>
      </div>
    </div>
    <div class="audio-control-row">
      <label for="slider-bgm-vol">
        <strong id="label-bgm-vol"></strong>
        <span id="val-bgm-vol">25%</span>
      </label>
      <input type="range" id="slider-bgm-vol" min="0" max="100" value="25" />
    </div>
    <div class="audio-control-row">
      <label for="slider-sfx-vol">
        <strong id="label-sfx-vol"></strong>
        <span id="val-sfx-vol">30%</span>
      </label>
      <input type="range" id="slider-sfx-vol" min="0" max="100" value="30" />
    </div>
    <input type="file" id="bgm-playlist-input" multiple accept="audio/*" hidden />
    <input type="file" id="sfx-upload-input" accept="audio/*" hidden />
    <div class="audio-upload-row">
      <button class="btn" id="drawer-btn-load-bgm">Load Playlist</button>
      <button class="btn" id="drawer-btn-load-sfx">Load UI SFX</button>
    </div>
    <div class="subtle" id="drawer-custom-sfx-status">Default synth FX</div>
    <div class="audio-buttons">
      <button class="btn" id="drawer-btn-play-pause"></button>
      <button class="btn" id="drawer-btn-next"></button>
    </div>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const STATUS_ORDER = ${JSON.stringify(STATUS_ORDER)};
    const STATUS_COLORS = ${JSON.stringify(STATUS_COLORS)};
    const SUPPORTED_LANGUAGES = ${JSON.stringify(SUPPORTED_LANGUAGES)};
    const LANGUAGE_NAMES = ${JSON.stringify({
      en: "English",
      ru: "Русский",
      es: "Español",
      fr: "Français",
      de: "Deutsch",
      zh: "中文",
      ja: "日本語"
    })};
    const data = ${payload};
    const localeCatalog = data.locales || {};
    const audioState = {
      bgmVolume: 0.25,
      sfxVolume: 0.30,
      drawerOpen: false,
      playlist: data.audio && data.audio.bundledBgmUri
        ? [{ name: data.audio.bundledBgmName || "Bundled Track", uri: data.audio.bundledBgmUri }]
        : [],
      playlistIndex: 0,
      customSfxUrl: "",
      customSfxName: "Default synth FX"
    };
    const bgmPlayer = new Audio(audioState.playlist[0] ? audioState.playlist[0].uri : "");
    bgmPlayer.preload = "auto";
    bgmPlayer.loop = true;
    bgmPlayer.volume = audioState.bgmVolume;

    let currentLanguage = data.language || "en";
    let currentLocale = getLocale(currentLanguage);
    let currentUi = currentLocale.webview || data.ui;
    let selectedTaskId = data.selectedTaskId || (data.executionState && data.executionState.current_task) || (data.tasks[0] && data.tasks[0].task_id) || null;
    let ttsAutoplayEnabled = false;
    let lastNarratedSignature = "";
    let terminalTypingToken = 0;
    const NODE_WIDTH = 220;
    const NODE_HEIGHT = 84;
    const ROLE_ORDER = ["planner", "worker", "reviewer", "tester", "docs"];
    const graphPositions = {};
    const graphState = {
      panX: 0,
      panY: 0,
      zoomScale: 1,
      isPanning: false,
      activeDragTaskId: null,
      dragOffset: { x: 0, y: 0 },
      panStart: { x: 0, y: 0 },
      hasFitted: false,
      cleanup: null
    };
    const speechBubbleTimers = {};
    const stageBubbleState = {
      currentSignature: "",
      dismissedSignature: ""
    };

    try {
      ttsAutoplayEnabled = window.localStorage.getItem("taskPlanDashboard.ttsAutoplay") === "true";
    } catch (_error) {
      ttsAutoplayEnabled = false;
    }

    (data.graph && data.graph.nodes ? data.graph.nodes : []).forEach(function (node) {
      graphPositions[node.task_id] = { x: node.x, y: node.y };
    });

    class SoundEngine {
      constructor() {
        this.ctx = null;
      }

      async init() {
        if (!this.ctx) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            this.ctx = new AudioContextClass();
          }
        }
        if (this.ctx && this.ctx.state === "suspended") {
          try {
            await this.ctx.resume();
          } catch (_error) {
            return null;
          }
        }
        return this.ctx;
      }

      async playTone(frequency, durationMs, type) {
        const ctx = await this.init();
        if (!ctx || audioState.sfxVolume <= 0) {
          return;
        }
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = type || "sine";
        oscillator.frequency.value = frequency;
        gain.gain.value = Math.max(0.01, Math.min(0.2, audioState.sfxVolume * 0.18));
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        const now = ctx.currentTime;
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.04, durationMs / 1000));
        oscillator.start(now);
        oscillator.stop(now + Math.max(0.05, durationMs / 1000));
      }
    }

    const soundEngine = new SoundEngine();

    function getLocale(language) {
      return localeCatalog[language] || localeCatalog.en || { statusLabels: {}, webview: data.ui };
    }

    function normalizeList(value) {
      if (Array.isArray(value)) {
        return value.filter(Boolean);
      }
      if (value == null || value === "") {
        return [];
      }
      return [String(value)];
    }

    function firstText(value, fallback) {
      const items = normalizeList(value);
      return items.length > 0 ? items.join(" ") : String(fallback || "");
    }

    function statusLabel(value) {
      const labels = currentLocale.statusLabels || {};
      return labels[value] || String(value || "").replace(/_/g, " ");
    }

    function normalizeRole(role) {
      switch (String(role || "").toLowerCase()) {
        case "planner":
          return "planner";
        case "reviewer":
          return "reviewer";
        case "tester":
          return "tester";
        case "docs":
        case "docs_sync":
          return "docs";
        case "implementer":
        case "worker":
          return "worker";
        default:
          return "planner";
      }
    }

    function roleLabel(role) {
      const normalizedRole = normalizeRole(role);
      switch (normalizedRole) {
        case "worker":
          return "Worker";
        case "reviewer":
          return "Reviewer";
        case "tester":
          return "Tester";
        case "docs":
          return "Docs";
        case "planner":
        default:
          return "Planner";
      }
    }

    function roleColor(role) {
      switch (normalizeRole(role)) {
        case "worker":
          return "var(--c-worker)";
        case "reviewer":
          return "var(--c-reviewer)";
        case "tester":
          return "var(--c-tester)";
        case "docs":
          return "var(--c-docs)";
        case "planner":
        default:
          return "var(--c-planner)";
      }
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
      return String(template || "").replace(/\{(\w+)\}/g, function (_match, key) {
        return Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : "";
      });
    }

    function numericTaskId(taskId) {
      const match = String(taskId || "").match(/(\d+)/);
      return match ? Number(match[1]) : 0;
    }

    function taskSortTimestamp(task) {
      const candidates = [
        task && task.latestEvent && task.latestEvent.ts,
        task && task.execution_state_overlay && task.execution_state_overlay.updated_at,
        task && task.register_row && task.register_row.updated_at
      ].filter(Boolean);
      for (const candidate of candidates) {
        const value = Date.parse(candidate);
        if (!Number.isNaN(value)) {
          return value;
        }
      }
      return 0;
    }

    function edgeId(fromTaskId, toTaskId) {
      return "edge-" + String(fromTaskId || "").toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + String(toTaskId || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    }

    function nodePosition(taskId) {
      const fallback = (data.graph.nodes || []).find(function (node) { return node.task_id === taskId; });
      if (!graphPositions[taskId] && fallback) {
        graphPositions[taskId] = { x: fallback.x, y: fallback.y };
      }
      return graphPositions[taskId] || (fallback ? { x: fallback.x, y: fallback.y } : null);
    }

    function currentStageTask() {
      return taskById((data.executionState && data.executionState.current_task) || selectedTaskId) || taskById(selectedTaskId) || data.tasks[0] || null;
    }

    function resolveTaskRole(task) {
      if (!task) {
        return "planner";
      }
      if (task.status === "needs_review") {
        return "reviewer";
      }
      if (task.status === "approved") {
        return "tester";
      }
      if (task.status === "done" || task.status === "dropped") {
        return normalizeRole(task.owner_role || "docs");
      }
      return normalizeRole(task.owner_role || task.next_role || "planner");
    }

    function buildStageBubbleText(task) {
      if (!task) {
        return currentUi.task.selectHint || "Select a task to inspect live progress.";
      }
      if (task.execution_state_overlay && task.execution_state_overlay.next_step) {
        return task.execution_state_overlay.next_step;
      }
      if (task.latestEvent && task.latestEvent.summary) {
        return task.latestEvent.summary;
      }
      if (task.status === "blocked" && normalizeList(task.blocked_by).length > 0) {
        return task.task_id + " blocked by " + normalizeList(task.blocked_by).join(", ");
      }
      return firstText(task.goal, task.task_id + " · " + task.title);
    }

    function badge(label, status) {
      const color = colorForStatus(status);
      return '<span class="badge" style="background:' + color + '22;border-color:' + color + '66;color:' + color + ';">' + escapeHtml(label) + "</span>";
    }

    function taskById(taskId) {
      return data.tasks.find(function (task) { return task.task_id === taskId; }) || null;
    }

    function setSelectedTask(taskId) {
      if (!taskId) {
        return;
      }
      const changed = taskId !== selectedTaskId;
      selectedTaskId = taskId;
      renderKanban();
      renderGraph();
      renderSelectedTask();
      renderAgentStage(changed);
      renderTerminal();
      renderTimeline();
      updateNarrationButton();
      if (changed) {
        playUiSfx("select");
      }
      vscode.postMessage({ type: "selectTask", taskId: taskId });
    }

    function playUiSfx(kind) {
      if (audioState.customSfxUrl) {
        const uploadedFx = new Audio(audioState.customSfxUrl);
        uploadedFx.volume = audioState.sfxVolume;
        uploadedFx.play().then(function () {
          return null;
        }).catch(function () {
          switch (kind) {
            case "drawer":
              soundEngine.playTone(660, 90, "triangle");
              break;
            case "language":
              soundEngine.playTone(520, 110, "sine");
              break;
            case "narrate":
              soundEngine.playTone(740, 80, "triangle");
              break;
            case "button":
              soundEngine.playTone(460, 65, "square");
              break;
            case "select":
            default:
              soundEngine.playTone(820, 55, "triangle");
              break;
          }
        });
        return;
      }
      switch (kind) {
        case "drawer":
          soundEngine.playTone(660, 90, "triangle");
          break;
        case "language":
          soundEngine.playTone(520, 110, "sine");
          break;
        case "narrate":
          soundEngine.playTone(740, 80, "triangle");
          break;
        case "button":
          soundEngine.playTone(460, 65, "square");
          break;
        case "select":
        default:
          soundEngine.playTone(820, 55, "triangle");
          break;
      }
    }

    function currentPlaylistTrack() {
      return audioState.playlist[audioState.playlistIndex] || null;
    }

    function applyStaticText() {
      document.documentElement.lang = currentLanguage;
      document.getElementById("open-plan").textContent = currentUi.buttons.openPlan;
      document.getElementById("open-feature-prep").textContent = currentUi.buttons.openFeaturePrep;
      document.getElementById("refresh-dashboard").textContent = currentUi.buttons.refresh;
      document.getElementById("kanban-title").textContent = currentUi.sections.kanban;
      document.getElementById("kanban-hint").textContent = currentUi.hints.kanban;
      document.getElementById("graph-title").textContent = currentUi.sections.dependencyGraph;
      document.getElementById("graph-hint").textContent = currentUi.hints.dependencyGraph;
      document.getElementById("selected-task-title").textContent = currentUi.sections.selectedTask;
      document.getElementById("selected-task-hint").textContent = currentUi.hints.selectedTask;
      document.getElementById("execution-state-title").textContent = currentUi.sections.currentExecutionState;
      document.getElementById("execution-state-hint").textContent = currentUi.hints.currentExecutionState;
      document.getElementById("owners-title").textContent = currentUi.sections.ownerBreakdown;
      document.getElementById("owners-hint").textContent = currentUi.hints.ownerBreakdown;
      document.getElementById("timeline-title").textContent = currentUi.sections.eventTimeline;
      document.getElementById("timeline-hint").textContent = currentUi.hints.eventTimeline;
      document.getElementById("language-switcher-label").textContent = currentUi.languageLabel || "Language";
      document.getElementById("narrate-selected-task").textContent = currentUi.narrateTask || "Narrate Task";
      document.getElementById("graph-reset-view").textContent = currentUi.btnResetZoom || "Reset View";
      document.getElementById("graph-fullscreen-toggle").textContent = currentUi.btnToggleFullscreen || "Fullscreen";
      document.getElementById("header-audio-toggle").title = currentUi.audioToggleTitle || currentUi.audioControlTitle || "Audio Panel";
      document.getElementById("btn-audio-drawer").title = currentUi.audioToggleTitle || currentUi.audioControlTitle || "Audio Panel";
      document.getElementById("audio-panel-title").textContent = currentUi.audioControlTitle || "Audio Panel";
      document.getElementById("btn-close-audio-drawer").setAttribute("aria-label", currentUi.closeLabel || "Close");
      document.getElementById("btn-close-audio-drawer").title = currentUi.closeLabel || "Close";
      document.getElementById("stage-overlay-close").setAttribute("aria-label", currentUi.closeLabel || "Close");
      document.getElementById("stage-overlay-close").title = currentUi.closeLabel || "Close";
      document.getElementById("drawer-now-playing-label").textContent = currentUi.nowPlayingLabel || "Now Playing";
      document.getElementById("label-bgm-vol").textContent = currentUi.bgmVolumeLabel || "BGM Volume";
      document.getElementById("label-sfx-vol").textContent = currentUi.sfxVolumeLabel || "SFX Volume";
      document.getElementById("drawer-btn-next").textContent = currentUi.btnNextTrack || "Next Track";
      document.getElementById("plan-path-pill").textContent = data.planPath ? String(data.planPath).split(/[\\/]/).pop() : "TASK-PLAN.md";
      document.getElementById("tts-autoplay").checked = ttsAutoplayEnabled;
      updateLanguageSelector();
      updateAudioUi();
      updateNarrationButton();
    }

    function updateLanguageSelector() {
      const select = document.getElementById("language-switcher");
      if (!select.dataset.ready) {
        select.innerHTML = SUPPORTED_LANGUAGES.map(function (language) {
          return '<option value="' + language + '">' + escapeHtml(LANGUAGE_NAMES[language] || language.toUpperCase()) + "</option>";
        }).join("");
        select.dataset.ready = "true";
      }
      select.value = currentLanguage;
    }

    function updateNarrationButton() {
      const button = document.getElementById("narrate-selected-task");
      button.disabled = !taskById(selectedTaskId) || !window.speechSynthesis || typeof window.SpeechSynthesisUtterance === "undefined";
    }

    function updateAudioUi() {
      const track = currentPlaylistTrack();
      const hasTrack = Boolean(track && track.uri);
      const bgmSlider = document.getElementById("slider-bgm-vol");
      const sfxSlider = document.getElementById("slider-sfx-vol");
      bgmSlider.value = String(Math.round(audioState.bgmVolume * 100));
      sfxSlider.value = String(Math.round(audioState.sfxVolume * 100));
      document.getElementById("val-bgm-vol").textContent = String(Math.round(audioState.bgmVolume * 100)) + "%";
      document.getElementById("val-sfx-vol").textContent = String(Math.round(audioState.sfxVolume * 100)) + "%";
      document.getElementById("drawer-bgm-title").textContent = hasTrack
        ? (track.name || currentUi.noBgmActive || "No BGM Active")
        : (currentUi.noBgmActive || "No BGM Active");
      document.getElementById("drawer-bgm-index").textContent = hasTrack ? (String(audioState.playlistIndex + 1) + " / " + String(audioState.playlist.length)) : "0 / 0";
      document.getElementById("drawer-btn-play-pause").textContent = bgmPlayer.paused
        ? (currentUi.playLabel || "Play")
        : (currentUi.pauseLabel || "Pause");
      document.getElementById("drawer-btn-play-pause").disabled = !hasTrack;
      document.getElementById("drawer-btn-next").disabled = !hasTrack;
      document.getElementById("bgm-status-pill").textContent = hasTrack
        ? (track.name || currentUi.playLabel || "Bundled Track")
        : (currentUi.noBgmActive || "No BGM Active");
      document.getElementById("drawer-custom-sfx-status").textContent = audioState.customSfxName;
      document.getElementById("audio-drawer-panel").classList.toggle("open", audioState.drawerOpen);
      document.getElementById("audio-drawer-panel").setAttribute("aria-hidden", audioState.drawerOpen ? "false" : "true");
      document.getElementById("btn-audio-drawer").classList.toggle("active", audioState.drawerOpen);
      document.getElementById("header-audio-toggle").classList.toggle("active", audioState.drawerOpen || !bgmPlayer.paused);
    }

    function renderHero() {
      document.getElementById("hero-title").textContent = firstText(data.feature.feature_title, currentUi.heroFallbackTitle);
      document.getElementById("hero-subtitle").textContent = firstText(data.feature.goal, currentUi.heroFallbackSubtitle);
    }

    function renderSummary() {
      const items = [
        { label: currentUi.summary.tasks, value: data.total, hint: currentUi.summary.tasksHint },
        { label: currentUi.summary.done, value: data.doneCount, hint: currentUi.summary.doneHint },
        { label: currentUi.summary.reviewQueue, value: data.reviewQueue, hint: currentUi.summary.reviewQueueHint },
        { label: currentUi.summary.testQueue, value: data.testQueue, hint: currentUi.summary.testQueueHint },
        { label: currentUi.summary.blocked, value: data.counts.blocked || 0, hint: currentUi.summary.blockedHint },
        { label: currentUi.summary.governanceWarnings, value: data.governanceWarnings || 0, hint: currentUi.summary.governanceWarningsHint },
        {
          label: currentUi.summary.featurePrep,
          value: String(data.prep.percent) + "%",
          hint: formatUiTemplate(currentUi.summary.featurePrepHintTemplate, { checked: data.prep.checked, total: data.prep.total }),
          progress: data.prep.percent
        }
      ];

      document.getElementById("summary-grid").innerHTML = items.map(function (item) {
        const progress = item.progress != null
          ? '<div class="prep-bar"><span style="width:' + item.progress + '%;"></span></div>'
          : "";
        return '<div class="summary-card">' +
          '<div class="label">' + escapeHtml(item.label) + "</div>" +
          '<div class="value">' + escapeHtml(item.value) + "</div>" +
          '<div class="subtle" style="margin-top:8px;">' + escapeHtml(item.hint) + "</div>" +
          progress +
        "</div>";
      }).join("");
    }

    function kanbanBadgeClass(status) {
      switch (status) {
        case "ready":
          return "status-ready";
        case "in_progress":
          return "status-work";
        case "needs_review":
        case "approved":
          return "status-review";
        case "done":
        case "dropped":
          return "status-done";
        case "blocked":
          return "status-blocked";
        default:
          return "";
      }
    }

    function sortedTasksForStatuses(statuses) {
      const currentTaskId = data.executionState && data.executionState.current_task;
      return data.tasks
        .filter(function (task) { return statuses.includes(task.status); })
        .sort(function (left, right) {
          if (statuses.includes("done") || statuses.includes("dropped")) {
            const delta = taskSortTimestamp(right) - taskSortTimestamp(left);
            if (delta !== 0) {
              return delta;
            }
            return numericTaskId(right.task_id) - numericTaskId(left.task_id);
          }
          if (left.task_id === currentTaskId && right.task_id !== currentTaskId) {
            return -1;
          }
          if (right.task_id === currentTaskId && left.task_id !== currentTaskId) {
            return 1;
          }
          return numericTaskId(left.task_id) - numericTaskId(right.task_id);
        });
    }

    function renderKanban() {
      const columns = [
        { id: "draft-ready", statuses: ["draft", "ready"] },
        { id: "progress-review", statuses: ["in_progress", "needs_review"] },
        { id: "approved-blocked", statuses: ["approved", "blocked"] },
        { id: "done-dropped", statuses: ["done", "dropped"] }
      ];

      document.getElementById("kanban").innerHTML = columns.map(function (column) {
        const tasks = sortedTasksForStatuses(column.statuses);
        const cards = tasks.map(function (task) {
          const selected = selectedTaskId === task.task_id ? " selected" : "";
          const approvals = normalizeList(task.required_approvals).length;
          const deps = normalizeList(task.dependencies).filter(function (dep) { return dep.startsWith("T-"); }).length;
          return '<div class="kanban-card' + selected + '" data-task-id="' + escapeHtml(task.task_id) + '">' +
            '<div class="title">' + escapeHtml(task.task_id + " · " + task.title) + "</div>" +
            '<div class="meta-badges">' +
              '<span class="card-badge ' + kanbanBadgeClass(task.status) + '">' + escapeHtml(statusLabel(task.status)) + "</span>" +
              '<span class="card-badge">' + escapeHtml(roleLabel(task.owner_role || "planner")) + "</span>" +
            "</div>" +
            '<div class="meta" style="display:flex;flex-wrap:wrap;gap:10px;margin-top:10px;font-size:11px;color:var(--muted);">' +
              "<span>" + escapeHtml(currentUi.kanban.approvals) + ": " + approvals + "</span>" +
              "<span>" + escapeHtml(currentUi.kanban.dependencies) + ": " + deps + "</span>" +
              "<span>" + escapeHtml(currentUi.kanban.next) + ": " + escapeHtml(task.next_role ? roleLabel(task.next_role) : statusLabel("done")) + "</span>" +
            "</div>" +
          "</div>";
        }).join("");
        const title = column.statuses.map(function (status) { return statusLabel(status); }).join(" / ");
        return '<div class="kanban-column" id="kanban-column-' + escapeHtml(column.id) + '"><h3>' + escapeHtml(title) + "</h3>" +
          (cards || '<div class="empty-state">' + escapeHtml(currentUi.kanban.noTasks) + "</div>") +
          "</div>";
      }).join("");
    }

    function getOptimalPorts(fromNode, toNode) {
      const fromCenter = { x: fromNode.x + NODE_WIDTH / 2, y: fromNode.y + NODE_HEIGHT / 2 };
      const toCenter = { x: toNode.x + NODE_WIDTH / 2, y: toNode.y + NODE_HEIGHT / 2 };
      const dx = toCenter.x - fromCenter.x;
      const dy = toCenter.y - fromCenter.y;
      const portsFrom = {
        top: { x: fromNode.x + NODE_WIDTH / 2, y: fromNode.y, dir: "up" },
        bottom: { x: fromNode.x + NODE_WIDTH / 2, y: fromNode.y + NODE_HEIGHT, dir: "down" },
        left: { x: fromNode.x, y: fromNode.y + NODE_HEIGHT / 2, dir: "left" },
        right: { x: fromNode.x + NODE_WIDTH, y: fromNode.y + NODE_HEIGHT / 2, dir: "right" }
      };
      const portsTo = {
        top: { x: toNode.x + NODE_WIDTH / 2, y: toNode.y, dir: "up" },
        bottom: { x: toNode.x + NODE_WIDTH / 2, y: toNode.y + NODE_HEIGHT, dir: "down" },
        left: { x: toNode.x, y: toNode.y + NODE_HEIGHT / 2, dir: "left" },
        right: { x: toNode.x + NODE_WIDTH, y: toNode.y + NODE_HEIGHT / 2, dir: "right" }
      };

      if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0
          ? { from: portsFrom.right, to: portsTo.left }
          : { from: portsFrom.left, to: portsTo.right };
      }

      return dy > 0
        ? { from: portsFrom.bottom, to: portsTo.top }
        : { from: portsFrom.top, to: portsTo.bottom };
    }

    function buildBezierPath(fromNode, toNode) {
      const ports = getOptimalPorts(fromNode, toNode);
      const fromPort = ports.from;
      const toPort = ports.to;
      let cp1x = fromPort.x;
      let cp1y = fromPort.y;
      let cp2x = toPort.x;
      let cp2y = toPort.y;
      const strength = 68;

      if (fromPort.dir === "right") { cp1x += strength; }
      if (fromPort.dir === "left") { cp1x -= strength; }
      if (fromPort.dir === "down") { cp1y += strength; }
      if (fromPort.dir === "up") { cp1y -= strength; }
      if (toPort.dir === "right") { cp2x += strength; }
      if (toPort.dir === "left") { cp2x -= strength; }
      if (toPort.dir === "down") { cp2y += strength; }
      if (toPort.dir === "up") { cp2y -= strength; }

      return "M " + fromPort.x + " " + fromPort.y +
        " C " + cp1x + " " + cp1y + ", " + cp2x + " " + cp2y + ", " + toPort.x + " " + toPort.y;
    }

    function graphViewportSize() {
      const wrap = document.getElementById("graph-wrap");
      const rect = wrap ? wrap.getBoundingClientRect() : null;
      return {
        width: Math.max(360, Math.round((rect && rect.width) || 1100)),
        height: Math.max(280, Math.round((rect && rect.height) || 520))
      };
    }

    function syncGraphSvgSize() {
      const svg = document.getElementById("graph-svg");
      if (!svg) {
        return graphViewportSize();
      }
      const viewport = graphViewportSize();
      svg.setAttribute("viewBox", "0 0 " + viewport.width + " " + viewport.height);
      svg.setAttribute("width", String(viewport.width));
      svg.setAttribute("height", String(viewport.height));
      return viewport;
    }

    function graphContentBounds() {
      const positions = (data.graph.nodes || []).map(function (node) {
        return nodePosition(node.task_id) || { x: node.x, y: node.y };
      }).filter(Boolean);

      if (positions.length === 0) {
        return { minX: 0, minY: 0, maxX: NODE_WIDTH, maxY: NODE_HEIGHT, width: NODE_WIDTH, height: NODE_HEIGHT };
      }

      const minX = positions.reduce(function (best, position) { return Math.min(best, position.x); }, positions[0].x);
      const minY = positions.reduce(function (best, position) { return Math.min(best, position.y); }, positions[0].y);
      const maxX = positions.reduce(function (best, position) { return Math.max(best, position.x + NODE_WIDTH); }, positions[0].x + NODE_WIDTH);
      const maxY = positions.reduce(function (best, position) { return Math.max(best, position.y + NODE_HEIGHT); }, positions[0].y + NODE_HEIGHT);
      return {
        minX,
        minY,
        maxX,
        maxY,
        width: Math.max(NODE_WIDTH, maxX - minX),
        height: Math.max(NODE_HEIGHT, maxY - minY)
      };
    }

    function fitGraphToViewport() {
      const group = document.getElementById("graph-viewport-group");
      if (!group) {
        return;
      }
      const viewport = syncGraphSvgSize();
      const bounds = graphContentBounds();
      const padding = 52;
      const availableWidth = Math.max(160, viewport.width - padding * 2);
      const availableHeight = Math.max(140, viewport.height - padding * 2);
      const scale = Math.max(0.36, Math.min(1.12, Math.min(availableWidth / bounds.width, availableHeight / bounds.height)));

      graphState.zoomScale = scale;
      graphState.panX = Math.round((viewport.width - bounds.width * scale) / 2 - bounds.minX * scale);
      graphState.panY = Math.round((viewport.height - bounds.height * scale) / 2 - bounds.minY * scale);
      updateViewportTransform();
    }

    function graphDragLimits() {
      const viewport = graphViewportSize();
      const bounds = graphContentBounds();
      return {
        minX: -viewport.width,
        minY: -viewport.height,
        maxX: Math.max(viewport.width * 2, bounds.maxX + viewport.width),
        maxY: Math.max(viewport.height * 2, bounds.maxY + viewport.height)
      };
    }

    function updateViewportTransform() {
      const group = document.getElementById("graph-viewport-group");
      if (!group) {
        return;
      }
      group.setAttribute("transform", "translate(" + graphState.panX + ", " + graphState.panY + ") scale(" + graphState.zoomScale + ")");
    }

    function updateGraphLines() {
      data.graph.edges.forEach(function (edge) {
        const line = document.getElementById(edgeId(edge.from, edge.to));
        const fromNode = nodePosition(edge.from);
        const toNode = nodePosition(edge.to);
        if (!line || !fromNode || !toNode) {
          return;
        }
        line.setAttribute("d", buildBezierPath(fromNode, toNode));
      });
    }

    function setLineStatus(lineId, status) {
      const line = document.getElementById(lineId);
      if (!line) {
        return;
      }
      line.classList.remove("active", "blocked", "done");
      line.setAttribute("marker-end", "url(#arrow)");
      if (status === "active") {
        line.classList.add("active");
        line.setAttribute("marker-end", "url(#arrow-active)");
      } else if (status === "blocked") {
        line.classList.add("blocked");
        line.setAttribute("marker-end", "url(#arrow-alert)");
      } else if (status === "done") {
        line.classList.add("done");
      }
    }

    function edgeVisualStatus(edge) {
      const fromTask = taskById(edge.from);
      const toTask = taskById(edge.to);
      const currentTaskId = data.executionState && data.executionState.current_task;
      if (!fromTask || !toTask) {
        return "none";
      }
      if (toTask.status === "blocked") {
        return "blocked";
      }
      if (toTask.task_id === currentTaskId || ["in_progress", "needs_review", "approved"].includes(toTask.status)) {
        return "active";
      }
      if (["done", "dropped"].includes(toTask.status) && ["done", "dropped"].includes(fromTask.status)) {
        return "done";
      }
      return "none";
    }

    function syncArrowGlows() {
      data.graph.edges.forEach(function (edge) {
        setLineStatus(edgeId(edge.from, edge.to), edgeVisualStatus(edge));
      });
    }

    function resetGraphView() {
      fitGraphToViewport();
      graphState.hasFitted = true;
    }

    function toggleGraphFullscreen() {
      const panel = document.getElementById("panel-dependency-graph");
      if (!panel) {
        return;
      }
      panel.classList.toggle("fullscreen-active");
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          fitGraphToViewport();
          graphState.hasFitted = true;
        });
      });
    }

    function detachGraphInteractions() {
      if (graphState.cleanup) {
        graphState.cleanup();
        graphState.cleanup = null;
      }
    }

    function attachGraphInteractions() {
      detachGraphInteractions();
      const svg = document.getElementById("graph-svg");
      if (!svg) {
        return;
      }

      const nodeElements = Array.from(document.querySelectorAll(".graph-node"));

      function onMouseMove(event) {
        if (graphState.activeDragTaskId) {
          const rect = svg.getBoundingClientRect();
          const mouseX = (event.clientX - rect.left - graphState.panX) / graphState.zoomScale;
          const mouseY = (event.clientY - rect.top - graphState.panY) / graphState.zoomScale;
          const limits = graphDragLimits();
          const nextX = Math.max(limits.minX, Math.min(limits.maxX, mouseX - graphState.dragOffset.x));
          const nextY = Math.max(limits.minY, Math.min(limits.maxY, mouseY - graphState.dragOffset.y));
          graphPositions[graphState.activeDragTaskId] = { x: nextX, y: nextY };
          const node = document.querySelector('.graph-node[data-task-id="' + graphState.activeDragTaskId + '"]');
          if (node) {
            node.setAttribute("transform", "translate(" + nextX + ", " + nextY + ")");
          }
          updateGraphLines();
          syncArrowGlows();
          return;
        }

        if (graphState.isPanning) {
          graphState.panX = event.clientX - graphState.panStart.x;
          graphState.panY = event.clientY - graphState.panStart.y;
          updateViewportTransform();
        }
      }

      function onMouseUp() {
        graphState.isPanning = false;
        svg.classList.remove("is-panning");
        if (graphState.activeDragTaskId) {
          const activeNode = document.querySelector('.graph-node[data-task-id="' + graphState.activeDragTaskId + '"]');
          if (activeNode) {
            activeNode.classList.remove("dragging");
          }
        }
        graphState.activeDragTaskId = null;
      }

      function onBackgroundMouseDown(event) {
        if (event.button !== 0 || (event.target.closest && event.target.closest(".graph-node"))) {
          return;
        }
        graphState.isPanning = true;
        graphState.panStart.x = event.clientX - graphState.panX;
        graphState.panStart.y = event.clientY - graphState.panY;
        svg.classList.add("is-panning");
        event.preventDefault();
      }

      function onWheel(event) {
        event.preventDefault();
        const rect = svg.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const delta = event.deltaY * -0.0015;
        const nextScale = Math.max(0.25, Math.min(3, graphState.zoomScale + delta));
        graphState.panX = mouseX - (mouseX - graphState.panX) * (nextScale / graphState.zoomScale);
        graphState.panY = mouseY - (mouseY - graphState.panY) * (nextScale / graphState.zoomScale);
        graphState.zoomScale = nextScale;
        updateViewportTransform();
      }

      nodeElements.forEach(function (nodeEl) {
        nodeEl.addEventListener("mousedown", function (event) {
          if (event.button !== 0) {
            return;
          }
          const taskId = nodeEl.dataset.taskId;
          const rect = svg.getBoundingClientRect();
          const position = nodePosition(taskId);
          if (!position) {
            return;
          }
          graphState.activeDragTaskId = taskId;
          graphState.dragOffset.x = (event.clientX - rect.left - graphState.panX) / graphState.zoomScale - position.x;
          graphState.dragOffset.y = (event.clientY - rect.top - graphState.panY) / graphState.zoomScale - position.y;
          nodeEl.classList.add("dragging");
          event.stopPropagation();
          event.preventDefault();
        });
      });

      function onResize() {
        syncGraphSvgSize();
        updateViewportTransform();
      }

      svg.addEventListener("mousedown", onBackgroundMouseDown);
      svg.addEventListener("wheel", onWheel, { passive: false });
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("resize", onResize);

      graphState.cleanup = function () {
        svg.removeEventListener("mousedown", onBackgroundMouseDown);
        svg.removeEventListener("wheel", onWheel);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        window.removeEventListener("resize", onResize);
      };

      syncGraphSvgSize();
      updateViewportTransform();
      updateGraphLines();
      syncArrowGlows();
      if (!graphState.hasFitted) {
        fitGraphToViewport();
        graphState.hasFitted = true;
      }
    }

    function renderGraph() {
      const viewport = graphViewportSize();

      const edges = data.graph.edges.map(function (edge) {
        const fromNode = nodePosition(edge.from);
        const toNode = nodePosition(edge.to);
        if (!fromNode || !toNode) {
          return "";
        }
        return '<path id="' + edgeId(edge.from, edge.to) + '" class="graph-connection-line" d="' + buildBezierPath(fromNode, toNode) + '" marker-end="url(#arrow)" />';
      }).join("");

      const nodes = data.graph.nodes.map(function (node) {
        const position = nodePosition(node.task_id) || { x: node.x, y: node.y };
        const task = taskById(node.task_id) || node;
        const classes = [
          "graph-node",
          selectedTaskId === node.task_id ? "active" : "",
          task.status === "done" || task.status === "dropped" ? "done" : "",
          task.status === "blocked" ? "blocked" : ""
        ].filter(Boolean).join(" ");

        return '<g class="' + classes + '" data-task-id="' + escapeHtml(node.task_id) + '" transform="translate(' + position.x + ", " + position.y + ')">' +
          '<rect width="' + NODE_WIDTH + '" height="' + NODE_HEIGHT + '" rx="16" />' +
          '<circle cx="16" cy="16" r="6" fill="' + colorForStatus(task.status) + '" />' +
          '<text x="34" y="21" fill="#e5e7eb" font-size="13" font-weight="700">' + escapeHtml(node.task_id) + "</text>" +
          '<text x="14" y="46" fill="#cbd5e1" font-size="12">' + escapeHtml(String(node.title || "").slice(0, 30)) + "</text>" +
          '<text x="14" y="67" fill="#94a3b8" font-size="11">' + escapeHtml(statusLabel(task.status) + " · " + roleLabel(task.owner_role || "planner")) + "</text>" +
        "</g>";
      }).join("");

      document.getElementById("graph-wrap").innerHTML =
        '<svg id="graph-svg" width="' + viewport.width + '" height="' + viewport.height + '" viewBox="0 0 ' + viewport.width + " " + viewport.height + '" role="img" aria-labelledby="graph-title">' +
          '<defs>' +
            '<pattern id="graph-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M 32 0 L 0 0 0 32" fill="none" stroke="#1e293b" stroke-opacity="0.28" stroke-width="1"/></pattern>' +
            '<marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L8,4 L0,8 z" fill="#64748b"/></marker>' +
            '<marker id="arrow-active" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L8,4 L0,8 z" fill="#0ea5e9"/></marker>' +
            '<marker id="arrow-alert" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L8,4 L0,8 z" fill="#ef4444"/></marker>' +
          "</defs>" +
          '<rect width="100%" height="100%" fill="url(#graph-grid)" />' +
          '<g id="graph-viewport-group">' + edges + nodes + "</g>" +
        "</svg>";

      attachGraphInteractions();
    }

    function activateAgentPodium(role) {
      const normalizedRole = normalizeRole(role);
      document.querySelectorAll(".agent-podium").forEach(function (podium) {
        const podiumRole = podium.getAttribute("data-role");
        if (podiumRole && speechBubbleTimers[podiumRole]) {
          clearTimeout(speechBubbleTimers[podiumRole]);
        }
        podium.classList.remove("active");
      });

      const activePodium = document.querySelector('.agent-podium[data-role="' + normalizedRole + '"]');
      if (activePodium) {
        activePodium.classList.add("active");
      }

      const beam = document.getElementById("agent-laser-beam");
      const roleIndex = Math.max(0, ROLE_ORDER.indexOf(normalizedRole));
      if (beam) {
        beam.style.width = (10 + roleIndex * 20) + "%";
      }
    }

    function showSpeechBubble(role, text, taskId) {
      const normalizedRole = normalizeRole(role);
      const overlay = document.getElementById("stage-overlay-bubble");
      const overlayRole = document.getElementById("stage-overlay-role");
      const overlayText = document.getElementById("stage-overlay-text");
      if (!overlay || !overlayRole || !overlayText) {
        return;
      }
      const signature = normalizedRole + "|" + String(taskId || "") + "|" + String(text || "");
      stageBubbleState.currentSignature = signature;
      overlayRole.textContent = roleLabel(normalizedRole);
      overlayRole.style.color = roleColor(normalizedRole);
      overlayText.textContent = text || "";

      if (!text) {
        overlay.classList.remove("visible");
        overlay.setAttribute("aria-hidden", "true");
        return;
      }

      if (stageBubbleState.dismissedSignature === signature) {
        overlay.classList.remove("visible");
        overlay.setAttribute("aria-hidden", "true");
        return;
      }

      overlay.classList.add("visible");
      overlay.setAttribute("aria-hidden", "false");
    }

    function closeStageBubble() {
      stageBubbleState.dismissedSignature = stageBubbleState.currentSignature;
      const overlay = document.getElementById("stage-overlay-bubble");
      if (!overlay) {
        return;
      }
      overlay.classList.remove("visible");
      overlay.setAttribute("aria-hidden", "true");
    }

    function setWorkerFace(mood) {
      const eyes = document.getElementById("worker-eyes");
      if (!eyes) {
        return;
      }
      if (mood === "working") {
        eyes.setAttribute("d", "M 24 26 L 29 24 M 35 24 L 40 26");
      } else if (mood === "happy") {
        eyes.setAttribute("d", "M 24 26 C 26 23, 27 23, 29 26 M 35 26 C 37 23, 38 23, 40 26");
      } else if (mood === "sad") {
        eyes.setAttribute("d", "M 24 24 C 26 27, 27 27, 29 24 M 35 24 C 37 27, 38 27, 40 24");
      } else {
        eyes.setAttribute("d", "M 24 25 L 29 25 M 35 25 L 40 25");
      }
    }

    function renderAgentStage(forceNarration) {
      const task = currentStageTask();
      const role = resolveTaskRole(task);
      const bubbleText = buildStageBubbleText(task);
      setWorkerFace(task && task.status === "blocked" ? "sad" : (role === "worker" ? "working" : (task && (task.status === "done" || task.status === "approved") ? "happy" : "normal")));
      activateAgentPodium(role);
      showSpeechBubble(role, bubbleText, task ? task.task_id : "");

      const signature = [currentLanguage, role, bubbleText, task ? task.task_id : ""].join("|");
      if (ttsAutoplayEnabled && (forceNarration || signature !== lastNarratedSignature)) {
        speakStepBubble(role, bubbleText, currentLanguage);
        lastNarratedSignature = signature;
      }
    }

    function buildTerminalLines(task) {
      const lines = [];
      const executionState = data.executionState;
      if (executionState && executionState.current_task) {
        lines.push("$ current_task -> " + executionState.current_task);
      }
      if (executionState && executionState.next_step) {
        lines.push("> " + executionState.next_step);
      }
      if (task && task.latestEvent && task.latestEvent.summary) {
        lines.push("[timeline] " + task.latestEvent.summary);
      }
      normalizeList(task && task.commands_run).forEach(function (command) {
        lines.push("✓ " + command);
      });
      if (lines.length === 0) {
        normalizeList(task && task.commands_planned).forEach(function (command) {
          lines.push("… planned -> " + command);
        });
      }
      if (task && task.status === "blocked" && normalizeList(task.blocked_by).length > 0) {
        lines.push("! blocked_by -> " + normalizeList(task.blocked_by).join(", "));
      }
      if (lines.length === 0) {
        lines.push(currentUi.executionState.noState || "No execution evidence yet.");
      }
      return lines.slice(0, 10);
    }

    function consoleLineClass(line) {
      if (line.startsWith("✓")) {
        return "success";
      }
      if (line.startsWith("!")) {
        return "error";
      }
      if (line.startsWith("$")) {
        return "system";
      }
      if (line.startsWith("…")) {
        return "warn";
      }
      return "";
    }

    function renderTerminal() {
      const consolePanel = document.getElementById("terminal-console");
      if (!consolePanel) {
        return;
      }
      const task = taskById(selectedTaskId) || currentStageTask();
      const lines = buildTerminalLines(task);
      const token = ++terminalTypingToken;
      consolePanel.innerHTML = "";

      function appendNextLine(index) {
        if (token !== terminalTypingToken || index >= lines.length) {
          return;
        }
        const line = document.createElement("div");
        const className = consoleLineClass(lines[index]);
        line.className = "console-line" + (className ? " " + className : "");
        line.textContent = lines[index];
        consolePanel.appendChild(line);
        consolePanel.scrollTop = consolePanel.scrollHeight;
        setTimeout(function () {
          appendNextLine(index + 1);
        }, 50);
      }

      appendNextLine(0);
    }

    function renderOwners() {
      document.getElementById("owners").innerHTML = data.ownerBreakdown.map(function (entry) {
        return '<div class="owner-box">' +
          '<div class="subtle">' + escapeHtml(entry.role) + "</div>" +
          '<div class="count">' + escapeHtml(entry.count) + "</div>" +
        "</div>";
      }).join("");
    }

    function renderList(items) {
      const normalized = normalizeList(items);
      if (normalized.length === 0) {
        return '<div class="subtle">' + escapeHtml(currentUi.task.none) + "</div>";
      }
      return '<div class="list">' + normalized.map(function (item) {
        return '<div class="list-item">' + escapeHtml(item) + "</div>";
      }).join("") + "</div>";
    }

    function renderVerificationStrategy(task) {
      const rows = [
        [currentUi.task.testLevels, task.test_levels],
        [currentUi.task.testTargets, task.test_targets],
        [currentUi.task.testDataOrigin, task.test_data_origin],
        [currentUi.task.oracle, task.oracle],
        [currentUi.task.negativeTests, task.negative_tests],
        [currentUi.task.flakinessRisk, task.flakiness_risk],
        [currentUi.task.stopOnFailure, task.stop_on_failure]
      ];
      return '<div class="list">' + rows.map(function (row) {
        const label = row[0];
        const value = row[1];
        const rendered = normalizeList(value).length > 0 ? normalizeList(value).join(", ") : (value || currentUi.task.none);
        return '<div class="list-item"><strong>' + escapeHtml(label) + ":</strong> " + escapeHtml(rendered) + "</div>";
      }).join("") + "</div>";
    }

    function renderGovernanceIssues(items) {
      const normalized = normalizeList(items);
      if (normalized.length === 0) {
        return '<div class="subtle">' + escapeHtml(currentUi.task.noGovernanceIssues) + "</div>";
      }
      return '<div class="list">' + normalized.map(function (item) {
        return '<div class="list-item" style="border-color:rgba(245,158,11,0.45);">' + escapeHtml(item) + "</div>";
      }).join("") + "</div>";
    }

    function renderArtifacts(items) {
      const normalized = normalizeList(items);
      if (normalized.length === 0) {
        return '<div class="subtle">' + escapeHtml(currentUi.task.noArtifactLocations) + "</div>";
      }
      return '<div class="list">' + normalized.map(function (item) {
        return '<button class="artifact-button" data-artifact-path="' + escapeHtml(item) + '">' + escapeHtml(item) + "</button>";
      }).join("") + "</div>";
    }

    function renderSelectedTask() {
      const task = taskById(selectedTaskId);
      if (!task) {
        document.getElementById("selected-task").innerHTML = '<div class="subtle">' + escapeHtml(currentUi.task.selectHint) + "</div>";
        return;
      }

      const blocks = [
        { title: currentUi.task.status, value: badge(statusLabel(task.status), task.status) + " " + badge(task.owner_role || "unassigned", task.status) },
        { title: currentUi.task.goal, value: escapeHtml(firstText(task.goal, currentUi.task.noGoalRecorded)) },
        { title: currentUi.task.dependencies, value: renderList(task.dependencies) },
        { title: currentUi.task.blockedBy, value: renderList(task.blocked_by) },
        { title: currentUi.task.approvals, value: renderList(task.required_approvals) },
        { title: currentUi.task.agentSequence, value: renderList(task.agent_sequence) },
        { title: currentUi.task.acceptanceChecks, value: renderList(task.acceptance_checks) },
        { title: currentUi.task.commandsPlanned, value: renderList(task.commands_planned) },
        { title: currentUi.task.commandsRun, value: renderList(task.commands_run) },
        { title: currentUi.task.verificationStrategy, value: renderVerificationStrategy(task) },
        { title: currentUi.task.governanceIssues, value: renderGovernanceIssues(task.governance_issues) },
        { title: currentUi.task.risks, value: renderList(task.risks) },
        { title: currentUi.task.artifacts, value: renderArtifacts(task.artifact_locations) }
      ];

      document.getElementById("selected-task").innerHTML =
        '<div class="list-item" style="margin-bottom:12px;">' +
          '<div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">' +
            "<div>" +
              '<div style="font-size:20px;font-weight:700;">' + escapeHtml(task.task_id + " · " + task.title) + "</div>" +
              '<div class="subtle" style="margin-top:6px;">' + escapeHtml(firstText(task.rationale, currentUi.task.noRationaleRecorded)) + "</div>" +
            "</div>" +
            '<div class="subtle">' + escapeHtml(currentUi.task.nextRole) + ": " + escapeHtml(task.next_role || currentUi.task.none) + "</div>" +
          "</div>" +
        "</div>" +
        '<div class="detail-grid">' +
          blocks.map(function (block) {
            return '<div class="detail-card"><h4>' + escapeHtml(block.title) + "</h4><div>" + block.value + "</div></div>";
          }).join("") +
        "</div>";
    }

    function renderExecutionState() {
      const state = data.executionState;
      if (!state) {
        document.getElementById("execution-state").innerHTML = '<div class="subtle">' + escapeHtml(currentUi.executionState.noState) + "</div>";
        return;
      }

      const blocks = [
        { title: currentUi.executionState.currentTask, value: escapeHtml(firstText(state.current_task, currentUi.executionState.none)) },
        { title: currentUi.executionState.resumeFrom, value: escapeHtml(firstText(state.resume_from, currentUi.executionState.none)) },
        { title: currentUi.executionState.nextStep, value: escapeHtml(firstText(state.next_step, currentUi.executionState.none)) },
        { title: currentUi.executionState.blockedBy, value: renderList(state.blocked_by) },
        { title: currentUi.executionState.executionMode, value: escapeHtml(firstText(state.execution_mode, currentUi.executionState.none)) },
        { title: currentUi.executionState.lastImplCommit, value: escapeHtml(firstText(state.last_impl_commit, currentUi.executionState.none)) },
        { title: currentUi.executionState.lastDocsCommit, value: escapeHtml(firstText(state.last_docs_commit, currentUi.executionState.none)) },
        { title: currentUi.executionState.updatedAt, value: escapeHtml(firstText(state.updated_at, currentUi.executionState.none)) },
        { title: currentUi.executionState.completedSteps, value: renderList(state.completed_steps) }
      ];

      document.getElementById("execution-state").innerHTML =
        '<div class="detail-grid">' +
          blocks.map(function (block) {
            return '<div class="detail-card"><h4>' + escapeHtml(block.title) + "</h4><div>" + block.value + "</div></div>";
          }).join("") +
        "</div>";
    }

    function renderTimeline() {
      const items = data.timeline.map(function (event) {
        const role = normalizeRole(event.role === "execution_state" ? (taskById(event.task_id) && taskById(event.task_id).owner_role) : event.role);
        const isLeft = ["planner", "reviewer", "tester"].includes(role);
        const title = [event.task_id, roleLabel(role), event.event].filter(Boolean).join(" · ");
        const bodyParts = [
          event.summary,
          event.next_role ? currentUi.timeline.nextPrefix + ": " + roleLabel(event.next_role) : "",
          event.path
        ].filter(Boolean);
        return '<div class="chat-msg ' + (isLeft ? "left" : "right") + '">' +
          '<div class="chat-header" style="color:' + roleColor(role) + ';">' +
            "<span>" + escapeHtml(title) + "</span>" +
            "<span>" + escapeHtml(event.ts || "") + "</span>" +
          "</div>" +
          '<div class="chat-body">' + escapeHtml(bodyParts.join(" | ")) + "</div>" +
        "</div>";
      }).join("");

      document.getElementById("timeline").innerHTML = items || ('<div class="empty-state">' + escapeHtml(currentUi.executionState.noState || "No execution evidence yet.") + "</div>");
    }

    function mapSpeechRole(role) {
      switch (String(role || "").toLowerCase()) {
        case "planner":
          return "planner";
        case "reviewer":
          return "reviewer";
        case "tester":
          return "tester";
        case "docs":
        case "docs_sync":
          return "docs";
        case "implementer":
        case "worker":
        default:
          return "worker";
      }
    }

    function speakStepBubble(role, text, language) {
      if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance === "undefined") {
        return false;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const languageMap = {
        en: "en-US",
        ru: "ru-RU",
        es: "es-ES",
        fr: "fr-FR",
        de: "de-DE",
        zh: "zh-CN",
        ja: "ja-JP"
      };
      utterance.lang = languageMap[language] || "en-US";
      const speechRole = mapSpeechRole(role);
      if (speechRole === "planner") {
        utterance.pitch = 1.2;
        utterance.rate = 1.0;
      } else if (speechRole === "worker") {
        utterance.pitch = 0.9;
        utterance.rate = 1.08;
      } else if (speechRole === "reviewer") {
        utterance.pitch = 1.0;
        utterance.rate = 0.95;
      } else if (speechRole === "tester") {
        utterance.pitch = 1.1;
        utterance.rate = 1.03;
      } else if (speechRole === "docs") {
        utterance.pitch = 1.28;
        utterance.rate = 0.98;
      }
      const voices = window.speechSynthesis.getVoices();
      const matching = voices.filter(function (voice) {
        return voice.lang && voice.lang.toLowerCase().startsWith(utterance.lang.substring(0, 2).toLowerCase());
      });
      if (matching.length > 0) {
        const voiceOrder = ["planner", "worker", "reviewer", "tester", "docs"];
        const voiceIndex = voiceOrder.indexOf(speechRole);
        utterance.voice = matching[Math.abs(voiceIndex) % matching.length];
      }
      window.speechSynthesis.speak(utterance);
      return true;
    }

    function buildNarrationText(task) {
      const goalText = firstText(task.goal, "");
      const parts = [
        task.task_id,
        task.title,
        statusLabel(task.status)
      ];
      if (goalText) {
        parts.push(goalText);
      }
      if (task.next_role) {
        parts.push((currentUi.task.nextRole || "Next role") + " " + task.next_role);
      }
      return parts.join(". ");
    }

    function narrateSelectedTask() {
      const task = taskById(selectedTaskId);
      if (!task) {
        return;
      }
      playUiSfx("narrate");
      speakStepBubble(resolveTaskRole(task), buildNarrationText(task), currentLanguage);
    }

    function toggleAudioDrawer(forceOpen) {
      if (typeof forceOpen === "boolean") {
        audioState.drawerOpen = forceOpen;
      } else {
        audioState.drawerOpen = !audioState.drawerOpen;
      }
      updateAudioUi();
    }

    function playCurrentTrack() {
      const track = currentPlaylistTrack();
      if (!track || !track.uri) {
        return Promise.resolve();
      }
      if (bgmPlayer.src !== track.uri) {
        bgmPlayer.src = track.uri;
      }
      bgmPlayer.volume = audioState.bgmVolume;
      return soundEngine.init().then(function () {
        return bgmPlayer.play().then(function () {
          updateAudioUi();
        }).catch(function () {
          updateAudioUi();
        });
      });
    }

    function toggleBgmPlayPause() {
      if (!currentPlaylistTrack()) {
        return;
      }
      if (bgmPlayer.paused) {
        playCurrentTrack();
      } else {
        bgmPlayer.pause();
        updateAudioUi();
      }
    }

    function playNextTrack() {
      if (!currentPlaylistTrack()) {
        return;
      }
      audioState.playlistIndex = (audioState.playlistIndex + 1) % audioState.playlist.length;
      bgmPlayer.currentTime = 0;
      bgmPlayer.src = currentPlaylistTrack().uri;
      playCurrentTrack();
    }

    function applyLanguage(nextLanguage, syncToExtension) {
      if (!SUPPORTED_LANGUAGES.includes(nextLanguage)) {
        return;
      }
      currentLanguage = nextLanguage;
      currentLocale = getLocale(currentLanguage);
      currentUi = currentLocale.webview || data.ui;
      applyStaticText();
      renderHero();
      renderSummary();
      renderKanban();
      renderGraph();
      renderOwners();
      renderSelectedTask();
      renderExecutionState();
      renderAgentStage(true);
      renderTerminal();
      renderTimeline();
      playUiSfx("language");
      if (syncToExtension) {
        vscode.postMessage({ type: "setLanguage", language: currentLanguage });
      }
    }

    function attachGlobalEvents() {
      document.getElementById("open-plan").addEventListener("click", function () {
        playUiSfx("button");
        vscode.postMessage({ type: "openPlan" });
      });
      document.getElementById("open-feature-prep").addEventListener("click", function () {
        playUiSfx("button");
        vscode.postMessage({ type: "openFeaturePrep" });
      });
      document.getElementById("refresh-dashboard").addEventListener("click", function () {
        playUiSfx("button");
        vscode.postMessage({ type: "refresh" });
      });
      document.getElementById("header-audio-toggle").addEventListener("click", function () {
        playUiSfx("drawer");
        toggleAudioDrawer();
      });
      document.getElementById("language-switcher").addEventListener("change", function (event) {
        applyLanguage(event.target.value, true);
      });
      document.getElementById("tts-autoplay").addEventListener("change", function (event) {
        ttsAutoplayEnabled = Boolean(event.target.checked);
        try {
          window.localStorage.setItem("taskPlanDashboard.ttsAutoplay", ttsAutoplayEnabled ? "true" : "false");
        } catch (_error) {
          // Ignore local persistence failures in the webview sandbox.
        }
        if (!ttsAutoplayEnabled && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        } else if (ttsAutoplayEnabled) {
          renderAgentStage(true);
        }
      });
      document.getElementById("stage-overlay-close").addEventListener("click", function () {
        closeStageBubble();
      });
      document.getElementById("narrate-selected-task").addEventListener("click", function () {
        narrateSelectedTask();
      });
      document.getElementById("graph-reset-view").addEventListener("click", function () {
        playUiSfx("button");
        resetGraphView();
      });
      document.getElementById("graph-fullscreen-toggle").addEventListener("click", function () {
        playUiSfx("button");
        toggleGraphFullscreen();
      });
      document.getElementById("btn-audio-drawer").addEventListener("click", function () {
        playUiSfx("drawer");
        toggleAudioDrawer();
      });
      document.getElementById("btn-close-audio-drawer").addEventListener("click", function () {
        toggleAudioDrawer(false);
      });
      document.getElementById("slider-bgm-vol").addEventListener("input", function (event) {
        audioState.bgmVolume = Number(event.target.value) / 100;
        bgmPlayer.volume = audioState.bgmVolume;
        updateAudioUi();
      });
      document.getElementById("slider-sfx-vol").addEventListener("input", function (event) {
        audioState.sfxVolume = Number(event.target.value) / 100;
        updateAudioUi();
      });
      document.getElementById("drawer-btn-play-pause").addEventListener("click", function () {
        playUiSfx("button");
        toggleBgmPlayPause();
      });
      document.getElementById("drawer-btn-next").addEventListener("click", function () {
        playUiSfx("button");
        playNextTrack();
      });
      document.getElementById("drawer-btn-load-bgm").addEventListener("click", function () {
        document.getElementById("bgm-playlist-input").click();
      });
      document.getElementById("drawer-btn-load-sfx").addEventListener("click", function () {
        document.getElementById("sfx-upload-input").click();
      });
      document.getElementById("bgm-playlist-input").addEventListener("change", function (event) {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) {
          return;
        }
        audioState.playlist = files.map(function (file) {
          return { name: file.name, uri: URL.createObjectURL(file) };
        });
        audioState.playlistIndex = 0;
        bgmPlayer.pause();
        bgmPlayer.currentTime = 0;
        bgmPlayer.src = audioState.playlist[0].uri;
        updateAudioUi();
        playCurrentTrack();
      });
      document.getElementById("sfx-upload-input").addEventListener("change", function (event) {
        const file = event.target.files && event.target.files[0];
        if (!file) {
          return;
        }
        audioState.customSfxUrl = URL.createObjectURL(file);
        audioState.customSfxName = file.name;
        updateAudioUi();
        playUiSfx("button");
      });
      bgmPlayer.addEventListener("play", updateAudioUi);
      bgmPlayer.addEventListener("pause", updateAudioUi);
      bgmPlayer.addEventListener("ended", updateAudioUi);
      document.addEventListener("click", function (event) {
        const taskCard = event.target.closest(".kanban-card, .task-card");
        if (taskCard) {
          setSelectedTask(taskCard.dataset.taskId);
          return;
        }
        const graphNode = event.target.closest(".graph-node");
        if (graphNode) {
          setSelectedTask(graphNode.dataset.taskId);
          return;
        }
        const artifactButton = event.target.closest("[data-artifact-path]");
        if (artifactButton) {
          vscode.postMessage({ type: "openArtifact", path: artifactButton.dataset.artifactPath });
        }
      });
    }

    applyStaticText();
    renderHero();
    renderSummary();
    renderKanban();
    renderGraph();
    renderOwners();
    renderSelectedTask();
    renderExecutionState();
    renderAgentStage(false);
    renderTerminal();
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
    this.serviceSubscription = this.service.onDidChange(() => this.refresh());
  }

  dispose() {
    this.serviceSubscription?.dispose?.();
    this._onDidChangeTreeData.dispose();
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
    }),
    vscode.window.onDidChangeActiveTextEditor(() => {
      service.scheduleRefresh();
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      service.scheduleRefresh();
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("taskPlanDashboard")) {
        service.scheduleRefresh();
      }
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
  const taskRegisterSection = extractSection(headerBlock, "Task Register");

  const feature = parseKeyValueSection(featureSection || "");
  const executionPolicy = parseKeyValueSection(executionPolicySection || "");
  const preImplementation = parseKeyValueSection(preImplementationSection || "");
  const taskRegisterRows = parseTaskRegister(taskRegisterSection || "");

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
    task.expected_artifacts = normalizeArray(task.expected_artifacts).filter(Boolean);
    task.code_artifacts = normalizeArray(task.code_artifacts).filter(Boolean);
    task.test_artifacts = normalizeArray(task.test_artifacts).filter(Boolean);
    task.review_artifacts = normalizeArray(task.review_artifacts).filter(Boolean);
    task.test_levels = normalizeArray(task.test_levels).filter(Boolean);
    task.test_targets = normalizeArray(task.test_targets).filter(Boolean);
    task.negative_tests = normalizeArray(task.negative_tests).filter(Boolean);
    task.fixtures = normalizeArray(task.fixtures).filter(Boolean);
    task.test_data_origin = normalizeArray(task.test_data_origin).filter(Boolean);
    task.oracle = normalizeArray(task.oracle).filter(Boolean);
    task.determinism_notes = normalizeArray(task.determinism_notes).filter(Boolean);
    task.flakiness_risk = normalizeArray(task.flakiness_risk).filter(Boolean);
    task.commands_planned = normalizeArray(task.commands_planned).filter(Boolean);
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
    taskRegisterRows,
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

function parseTaskRegister(section) {
  const rows = [];
  for (const rawLine of section.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.startsWith("| T-")) {
      continue;
    }
    const parts = line.slice(1, -1).split("|").map((part) => part.trim());
    if (parts.length < 7) {
      continue;
    }
    rows.push({
      task_id: parts[0],
      title: parts[1],
      status: parts[2],
      priority: parts[3],
      owner_role: parts[4],
      dependencies: normalizeArray(parseInlineValue(parts[5])).filter(Boolean),
      required_approvals: normalizeArray(parseInlineValue(parts[6])).filter(Boolean)
    });
  }
  return rows;
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

function ensureParentDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function appendEvents(eventsPath, events) {
  ensureParentDirectory(eventsPath);
  const lines = events.map((event) => JSON.stringify(event)).join("\n") + "\n";
  fs.appendFileSync(eventsPath, lines, "utf8");
}

function readJsonFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return null;
  }
}

function buildDashboardSnapshot(model) {
  const tasks = {};
  for (const task of model.tasks || []) {
    tasks[task.task_id] = {
      title: task.title,
      status: task.status,
      owner_role: task.owner_role,
      next_role: task.next_role || null,
      blocked_by: normalizeArray(task.blocked_by),
      required_approvals: normalizeArray(task.required_approvals)
    };
  }
  return {
    planPath: model.planPath,
    generated_at: new Date().toISOString(),
    executionState: model.executionState
      ? {
          current_task: model.executionState.current_task || "",
          next_step: model.executionState.next_step || "",
          blocked_by: normalizeArray(model.executionState.blocked_by),
          resume_from: model.executionState.resume_from || ""
          ,
          execution_mode: model.executionState.execution_mode || "",
          last_impl_commit: model.executionState.last_impl_commit || "",
          last_docs_commit: model.executionState.last_docs_commit || "",
          completed_steps: normalizeArray(model.executionState.completed_steps),
          updated_at: model.executionState.updated_at || ""
        }
      : null,
    tasks
  };
}

function deriveAutoEvents(previousSnapshot, nextSnapshot, model) {
  const now = new Date().toISOString();
  const generated = [];
  const prevExec = previousSnapshot?.executionState || null;
  const nextExec = nextSnapshot.executionState || null;

  if (!previousSnapshot && nextExec?.current_task) {
    generated.push({
      ts: now,
      task_id: nextExec.current_task,
      role: "execution_state",
      event: nextExec.blocked_by.length > 0 ? "blocked" : "active",
      summary: nextExec.next_step || `Execution started from ${nextExec.resume_from || nextExec.current_task}.`,
      path: DEFAULT_EXECUTION_STATE_NAME
    });
  } else if (prevExec || nextExec) {
    const prevTask = prevExec?.current_task || "";
    const nextTask = nextExec?.current_task || "";
    if (prevTask !== nextTask && nextTask) {
      generated.push({
        ts: now,
        task_id: nextTask,
        role: "execution_state",
        event: "focus_changed",
        summary: nextExec?.next_step || `Current execution focus moved to ${nextTask}.`,
        path: DEFAULT_EXECUTION_STATE_NAME
      });
    } else if (
      nextTask &&
      prevExec &&
      nextExec &&
      prevExec.next_step !== nextExec.next_step &&
      nextExec.next_step
    ) {
      generated.push({
        ts: now,
        task_id: nextTask,
        role: "execution_state",
        event: "progress_note",
        summary: nextExec.next_step,
        path: DEFAULT_EXECUTION_STATE_NAME
      });
    }

    const prevBlocked = JSON.stringify(normalizeArray(prevExec?.blocked_by));
    const nextBlocked = JSON.stringify(normalizeArray(nextExec?.blocked_by));
    if (prevBlocked !== nextBlocked && nextTask) {
      generated.push({
        ts: now,
        task_id: nextTask,
        role: "execution_state",
        event: normalizeArray(nextExec?.blocked_by).length > 0 ? "blocked" : "unblocked",
        summary: normalizeArray(nextExec?.blocked_by).length > 0
          ? `Execution blocked by: ${normalizeArray(nextExec?.blocked_by).join(", ")}`
          : "Execution blocker cleared.",
        path: DEFAULT_EXECUTION_STATE_NAME
      });
    }

    const prevCompletedSteps = normalizeArray(prevExec?.completed_steps);
    const nextCompletedSteps = normalizeArray(nextExec?.completed_steps);
    const newCompletedSteps = nextCompletedSteps.filter((step) => !prevCompletedSteps.includes(step));
    for (const step of newCompletedSteps) {
      const inferredTaskId = inferTaskIdFromCompletedStep(step) || nextTask || "SYSTEM";
      generated.push({
        ts: now,
        task_id: inferredTaskId,
        role: "execution_state",
        event: "progress_step",
        summary: step,
        path: DEFAULT_EXECUTION_STATE_NAME
      });
    }
  }

  const previousTasks = previousSnapshot?.tasks || {};
  const nextTasks = nextSnapshot.tasks || {};
  const taskIds = new Set([...Object.keys(previousTasks), ...Object.keys(nextTasks)]);

  for (const taskId of taskIds) {
    const prevTask = previousTasks[taskId] || null;
    const nextTask = nextTasks[taskId] || null;
    if (!nextTask) {
      continue;
    }

    if (!prevTask) {
      if (nextTask.status && nextTask.status !== "draft") {
        generated.push({
          ts: now,
          task_id: taskId,
          role: nextTask.owner_role || "dashboard_sync",
          event: statusToEvent(nextTask.status),
          summary: `${taskId} entered the dashboard with status ${nextTask.status}.`,
          path: DEFAULT_PLAN_NAME,
          next_role: nextTask.next_role || undefined
        });
      }
      continue;
    }

    if (prevTask.status !== nextTask.status) {
      generated.push({
        ts: now,
        task_id: taskId,
        role: nextTask.owner_role || "dashboard_sync",
        event: statusToEvent(nextTask.status),
        summary: `${taskId} status changed from ${prevTask.status} to ${nextTask.status}.`,
        path: DEFAULT_PLAN_NAME,
        next_role: nextTask.next_role || undefined
      });
    }

    if (prevTask.owner_role !== nextTask.owner_role) {
      generated.push({
        ts: now,
        task_id: taskId,
        role: nextTask.owner_role || "dashboard_sync",
        event: "owner_changed",
        summary: `${taskId} owner changed from ${prevTask.owner_role || "unassigned"} to ${nextTask.owner_role || "unassigned"}.`,
        path: DEFAULT_PLAN_NAME,
        next_role: nextTask.next_role || undefined
      });
    }

    if (prevTask.next_role !== nextTask.next_role && nextTask.next_role) {
      generated.push({
        ts: now,
        task_id: taskId,
        role: nextTask.owner_role || "dashboard_sync",
        event: "next_role_changed",
        summary: `${taskId} next role is now ${nextTask.next_role}.`,
        path: DEFAULT_PLAN_NAME,
        next_role: nextTask.next_role
      });
    }
  }

  return dedupeGeneratedEvents(generated);
}

function dedupeGeneratedEvents(events) {
  const seen = new Set();
  return events.filter((event) => {
    const key = [event.task_id, event.role, event.event, event.summary, event.path || ""].join("|");
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function statusToEvent(status) {
  switch (status) {
    case "ready":
      return "ready";
    case "in_progress":
      return "started";
    case "needs_review":
      return "needs_review";
    case "approved":
      return "approved";
    case "blocked":
      return "blocked";
    case "done":
      return "completed";
    case "dropped":
      return "dropped";
    case "draft":
    default:
      return "drafted";
  }
}

function parseExecutionState(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, "utf8");
  const getBulletField = (name) => {
    const match = content.match(new RegExp(`^- ${escapeRegex(name)}:\\s*(.+)$`, "m"));
    return match ? match[1].trim() : "";
  };
  const unwrap = (value) => value.replace(/^`|`$/g, "").trim();
  const completedStepsMatch = content.match(/^- completed_steps:\s*\n((?:\s+- .+\n?)*)/m);
  const completed_steps = completedStepsMatch
    ? completedStepsMatch[1]
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.startsWith("- "))
        .map((line) => unwrap(line.replace(/^- /, "")))
        .filter(Boolean)
    : [];

  return {
    current_task: unwrap(getBulletField("current_task")),
    current_prompt_path: unwrap(getBulletField("current_prompt_path")),
    execution_mode: unwrap(getBulletField("execution_mode")),
    next_step: unwrap(getBulletField("next_step")),
    blocked_by: normalizeArray(parseInlineValue(unwrap(getBulletField("blocked_by")))).filter(Boolean),
    updated_at: unwrap(getBulletField("updated_at")),
    resume_from: unwrap((content.match(/RESUME_FROM:\s*`([^`]+)`/) || [])[1] || ""),
    completed_steps,
    last_impl_commit: unwrap(getBulletField("last_impl_commit")),
    last_docs_commit: unwrap(getBulletField("last_docs_commit"))
  };
}

function inferTaskIdFromCompletedStep(step) {
  const match = String(step || "").match(/\bt(\d{3})\b/i);
  return match ? `T-${match[1]}` : null;
}

function buildTimeline(events, executionState) {
  const timeline = events.slice();
  if (executionState?.current_task) {
    const alreadyHasCurrentTaskEvent = timeline.some((event) => event.task_id === executionState.current_task);
    if (!alreadyHasCurrentTaskEvent) {
      timeline.push({
        ts: executionState.updated_at || "live",
        task_id: executionState.current_task,
        role: "execution_state",
        event: executionState.blocked_by.length > 0 ? "blocked" : "active",
        summary: executionState.next_step || "Execution state points to this task as the current task."
      });
    }
  }
  return timeline.sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
}

function enrichTasks(tasks, events, taskRegisterRows = [], executionState = null) {
  const registerByTask = new Map(taskRegisterRows.map((row) => [row.task_id, row]));
  const lastEventByTask = new Map();
  for (const event of events) {
    lastEventByTask.set(event.task_id, event);
  }

  return tasks.map((task) => {
    const registerRow = registerByTask.get(task.task_id);
    let effectiveStatus = task.status;
    let effectiveOwnerRole = task.owner_role;
    let effectiveDependencies = task.dependencies;
    let effectiveApprovals = task.required_approvals;

    if (registerRow) {
      if ((effectiveStatus === "draft" || !effectiveStatus) && registerRow.status) {
        effectiveStatus = registerRow.status;
      }
      if ((effectiveOwnerRole === "planner" || !effectiveOwnerRole) && registerRow.owner_role) {
        effectiveOwnerRole = registerRow.owner_role;
      }
      if ((!effectiveDependencies || effectiveDependencies.length === 0) && registerRow.dependencies.length > 0) {
        effectiveDependencies = registerRow.dependencies;
      }
      if ((!effectiveApprovals || effectiveApprovals.length === 0) && registerRow.required_approvals.length > 0) {
        effectiveApprovals = registerRow.required_approvals;
      }
    }

    const isCurrentTask = executionState?.current_task === task.task_id;
    if (isCurrentTask) {
      if (executionState.blocked_by.length > 0) {
        effectiveStatus = "blocked";
      } else if (effectiveStatus !== "needs_review" && effectiveStatus !== "approved") {
        effectiveStatus = "in_progress";
      }
    }

    const agentSequence = task.agent_sequence.length > 0 ? task.agent_sequence : ["planner", "implementer", "reviewer", "tester", "docs_sync"];
    const ownerIndex = agentSequence.indexOf(effectiveOwnerRole);
    let nextRole = ownerIndex >= 0 ? agentSequence[ownerIndex + 1] || null : agentSequence[0] || null;
    if (effectiveStatus === "done" || effectiveStatus === "dropped") {
      nextRole = null;
    } else if (effectiveStatus === "needs_review") {
      nextRole = "reviewer";
    } else if (effectiveStatus === "approved") {
      nextRole = "tester";
    }

    return {
      ...task,
      status: effectiveStatus,
      owner_role: effectiveOwnerRole,
      dependencies: effectiveDependencies,
      required_approvals: effectiveApprovals,
      register_row: registerRow || null,
      execution_state_overlay: isCurrentTask ? executionState : null,
      governance_issues: computeGovernanceIssues(task, registerRow, {
        status: effectiveStatus,
        owner_role: effectiveOwnerRole,
        dependencies: effectiveDependencies,
        required_approvals: effectiveApprovals
      }),
      latestEvent: lastEventByTask.get(task.task_id) || null,
      next_role: nextRole
    };
  });
}

function normalizeClosureStatuses(tasks) {
  const statusByTask = new Map(tasks.map((task) => [task.task_id, task.status]));
  return tasks.map((task) => {
    if (!shouldPromoteToDone(task, statusByTask)) {
      return task;
    }
    return {
      ...task,
      status: "done",
      owner_role: task.owner_role === "planner" ? "docs_sync" : task.owner_role,
      next_role: null,
      status_auto_resolved: true,
      governance_issues: normalizeArray(task.governance_issues).filter(
        (issue) =>
          !issue.includes("blocked task must specify blocked_by") &&
          !issue.includes("Task Register status") &&
          !issue.includes("Task Register owner")
      )
    };
  });
}

function shouldPromoteToDone(task, statusByTask) {
  const status = String(task.status || "");
  if (!["blocked", "approved"].includes(status)) {
    return false;
  }

  const blockers = normalizeArray(task.blocked_by);
  if (blockers.length > 0) {
    return false;
  }

  const dependencies = normalizeArray(task.dependencies).filter((dep) => dep.startsWith("T-"));
  if (dependencies.some((dep) => statusByTask.get(dep) !== "done")) {
    return false;
  }

  const testsRequired = String(task.tests_required || "").toLowerCase();
  const hasCommandsRun = normalizeArray(task.commands_run).length > 0;
  const hasTestArtifacts = normalizeArray(task.test_artifacts).length > 0;
  const hasReviewArtifacts = normalizeArray(task.review_artifacts).length > 0;
  const hasCodeArtifacts = normalizeArray(task.code_artifacts).length > 0;
  const hasAnyEvidence = hasCommandsRun || hasTestArtifacts || hasReviewArtifacts || hasCodeArtifacts;

  if (!hasAnyEvidence) {
    return false;
  }

  if (testsRequired === "yes" && (!hasCommandsRun || !hasTestArtifacts)) {
    return false;
  }

  if (testsRequired === "manual-check-needed" && !hasCommandsRun) {
    return false;
  }

  if (!hasReviewArtifacts) {
    return false;
  }

  if (normalizeArray(task.acceptance_criteria).length === 0 || normalizeArray(task.acceptance_checks).length === 0) {
    return false;
  }

  return true;
}

function computeGovernanceIssues(originalTask, registerRow, effectiveTask) {
  const issues = [];
  const status = effectiveTask.status || originalTask.status || "draft";
  const nonDraftStatuses = ["ready", "in_progress", "needs_review", "approved", "done"];
  const criticalVerificationFields = [
    ["tests_required", originalTask.tests_required],
    ["test_levels", originalTask.test_levels],
    ["test_targets", originalTask.test_targets],
    ["test_data_origin", originalTask.test_data_origin],
    ["oracle", originalTask.oracle],
    ["stop_on_failure", originalTask.stop_on_failure],
    ["commands_planned", originalTask.commands_planned]
  ];

  if (nonDraftStatuses.includes(status)) {
    for (const [field, value] of criticalVerificationFields) {
      if (isMissingOrPlaceholder(value)) {
        issues.push(`${field} is missing or placeholder while task is ${status}`);
      }
    }
    if (normalizeArray(originalTask.artifact_locations).some(isPlaceholderValue)) {
      issues.push("artifact_locations contains placeholder values");
    }
  }

  if (status === "done") {
    const testsRequired = String(originalTask.tests_required || "").toLowerCase();
    if ((testsRequired === "yes" || testsRequired === "manual-check-needed") && normalizeArray(originalTask.commands_run).length === 0) {
      issues.push("done task requires commands_run evidence");
    }
    if (testsRequired === "yes" && normalizeArray(originalTask.test_artifacts).length === 0) {
      issues.push("done task requires test_artifacts evidence");
    }
    if (normalizeArray(originalTask.review_artifacts).length === 0) {
      issues.push("done task should record review_artifacts");
    }
  }

  if (status === "blocked" && normalizeArray(originalTask.blocked_by).length === 0) {
    issues.push("blocked task must specify blocked_by");
  }

  if (registerRow) {
    if (originalTask.status && registerRow.status && originalTask.status !== registerRow.status) {
      issues.push(`Task Register status (${registerRow.status}) differs from Task Block status (${originalTask.status})`);
    }
    if (originalTask.owner_role && registerRow.owner_role && originalTask.owner_role !== registerRow.owner_role) {
      issues.push(`Task Register owner (${registerRow.owner_role}) differs from Task Block owner (${originalTask.owner_role})`);
    }
  }

  return issues;
}

function isMissingOrPlaceholder(value) {
  const values = normalizeArray(value);
  if (values.length === 0) {
    return true;
  }
  return values.some(isPlaceholderValue);
}

function isPlaceholderValue(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return !normalized || normalized === "tbd" || normalized === "unknown" || normalized === "open_question" || normalized === "-";
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

  const levelEntries = [...levels.entries()].sort((a, b) => a[0] - b[0]);
  const columnCount = Math.min(5, Math.max(3, Math.ceil(Math.sqrt(levelEntries.length * 1.4))));
  const columnGap = 292;
  const rowGap = 172;
  const laneGap = 128;
  const rowLaneCounts = [];
  levelEntries.forEach((entry, orderIndex) => {
    const row = Math.floor(orderIndex / columnCount);
    rowLaneCounts[row] = Math.max(rowLaneCounts[row] || 1, entry[1].length);
  });

  const rowOffsets = [];
  let nextRowY = 30;
  rowLaneCounts.forEach((laneCount, rowIndex) => {
    rowOffsets[rowIndex] = nextRowY;
    nextRowY += Math.max(1, laneCount) * laneGap + rowGap;
  });

  const nodes = [];
  let maxRows = 0;
  for (const [[level, levelTasks], orderIndex] of levelEntries.map((entry, index) => [entry, index])) {
    const row = Math.floor(orderIndex / columnCount);
    const column = orderIndex % columnCount;
    maxRows = Math.max(maxRows, levelTasks.length);
    levelTasks.forEach((task, index) => {
      nodes.push({
        task_id: task.task_id,
        title: task.title,
        status: task.status,
        owner_role: task.owner_role,
        level,
        x: 30 + column * columnGap,
        y: rowOffsets[row] + index * laneGap
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
