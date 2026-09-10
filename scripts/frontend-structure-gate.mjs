import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import ts from "typescript";

const root = process.cwd();
const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (!arg.startsWith("--")) continue;
  const [key, inlineValue] = arg.slice(2).split("=", 2);
  const next = process.argv[i + 1];
  const value = inlineValue ?? (next && !next.startsWith("--") ? process.argv[++i] : "true");
  args.set(key, value);
}

const mode = args.get("mode") ?? "changed";
const configPath = args.get("config") ?? ".hrise/frontend-structure-gate.json";
const config = JSON.parse(readFileSync(join(root, configPath), "utf8"));
const baselinePath = config.baseline?.path ?? ".hrise/frontend-structure-gate-baseline.json";
const reportJSONPath = config.report?.json ?? ".hrise/frontend-structure-gate-report.json";
const reportMDPath = config.report?.markdown ?? ".hrise/frontend-structure-gate-report.md";
const supportedExtensions = new Set(config.scan?.extensions ?? [".ts", ".tsx", ".js", ".jsx", ".mjs", ".vue"]);

if (!["baseline", "changed", "full"].includes(mode)) {
  console.error(`unsupported mode: ${mode}`);
  process.exit(2);
}

const baseline = mode === "baseline" || !existsSync(join(root, baselinePath)) ? { issues: {} } : readJSON(baselinePath, { issues: {} });
const files = collectFiles(config.scan?.roots ?? ["src", "scripts", "tests"]);
const issues = [];
let funcsScanned = 0;

for (const file of files) scanFile(file, issues);
for (const issue of scanPackageCounts(files)) issues.push(issue);
issues.sort((a, b) => a.path.localeCompare(b.path) || a.kind.localeCompare(b.kind) || a.key.localeCompare(b.key));

if (mode === "baseline") {
  writeJSON(baselinePath, {
    generated_at: new Date().toISOString(),
    config: configPath,
    issues: Object.fromEntries(issues.map((issue) => [issue.key, baselineValue(issue)])),
  });
}

const baselineIssues = baseline.issues ?? {};
const baselineFallback = buildBaselineFallbackIndex(baselineIssues);
const annotated = issues.map((issue) => annotateIssue(issue, previousBaselineIssue(issue, baselineIssues, baselineFallback)));
const blocking = mode === "full" ? annotated.filter((issue) => issue.severity === "block") : annotated.filter((issue) => issue.blocking);
const report = { mode, root, files_scanned: files.length, funcs_scanned: funcsScanned, blocking: blocking.length, issues: annotated };

writeJSON(reportJSONPath, report);
writeFileSync(join(root, reportMDPath), renderMarkdown(report));

if (blocking.length > 0) {
  console.error(`frontend structure gate failed: ${blocking.length} blocking issue(s), report: ${reportMDPath}`);
  process.exit(1);
}

console.log(`frontend structure gate passed: ${annotated.length} issue(s), report: ${reportMDPath}`);

function collectFiles(roots) {
  const files = [];
  for (const scanRoot of roots) {
    const fullRoot = join(root, scanRoot);
    if (existsSync(fullRoot)) walk(fullRoot, files);
  }
  return files.map((file) => relative(root, file).replaceAll("\\", "/")).sort();
}

function walk(dir, files) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    const rel = relative(root, fullPath).replaceAll("\\", "/");
    if (isExcluded(rel)) continue;
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }
    if (supportedExtensions.has(extname(entry.name))) files.push(fullPath);
  }
}

function scanFile(file, out) {
  const sourceText = readFileSync(join(root, file), "utf8");
  const profile = profileFor(file);
  addThresholdIssue(out, {
    kind: "file",
    key: `file:${file}`,
    path: file,
    profile: profile.name,
    value: sourceText.split(/\r?\n/).length,
    warn: profile.file.warn_lines,
    block: profile.file.max_lines,
    reason: "file line count exceeds threshold",
    suggestion: profile.file.suggestion ?? "按组件、composable、adapter、types、fixtures 或 docs demo 拆分。",
  });

  for (const part of parseSourceParts(file, sourceText)) scanFunctions(file, part, profile, out);
}

function parseSourceParts(file, sourceText) {
  if (!file.endsWith(".vue")) return [{ text: sourceText, lineOffset: 0 }];
  const parts = [];
  const scriptRE = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRE.exec(sourceText))) {
    const before = sourceText.slice(0, match.index);
    parts.push({ text: match[1], lineOffset: before.split(/\r?\n/).length - 1 });
  }
  return parts;
}

function scanFunctions(file, part, profile, out) {
  const sourceFile = ts.createSourceFile(file, part.text, ts.ScriptTarget.Latest, true, scriptKind(file));
  const lineStarts = sourceFile.getLineStarts();
  const lineOf = (pos) => {
    let low = 0;
    let high = lineStarts.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (lineStarts[mid] <= pos) low = mid + 1;
      else high = mid - 1;
    }
    return high + 1 + part.lineOffset;
  };
  const visit = (node) => {
    if (isFunctionLike(node) && shouldCheckFunction(node, sourceFile, profile)) {
      funcsScanned += 1;
      const start = lineOf(node.getStart(sourceFile));
      const end = lineOf(node.getEnd());
      addThresholdIssue(out, {
        kind: "function",
        key: `function:${file}:${functionName(node, sourceFile)}:${start}`,
        path: file,
        symbol: functionName(node, sourceFile),
        profile: profile.name,
        value: end - start + 1,
        warn: profile.function.warn_lines,
        block: profile.function.max_lines,
        reason: "function line count exceeds threshold",
        suggestion: profile.function.suggestion ?? "把交互状态、DOM 处理、渲染 helper、schema 映射或测试 fixture 拆成具名模块。",
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
}

function scanPackageCounts(files) {
  const counts = new Map();
  for (const file of files) {
    const dir = packageCountPath(file);
    counts.set(dir, (counts.get(dir) ?? 0) + 1);
  }
  const result = [];
  for (const [path, value] of counts) {
    const profile = packageProfileFor(path);
    addThresholdIssue(result, {
      kind: "package",
      key: `package:${path}`,
      path,
      profile: profile.name,
      value,
      warn: profile.package.warn_files,
      block: profile.package.max_files,
      reason: "directory file count exceeds threshold",
      suggestion: profile.package.suggestion ?? "大目录只报告，不自动拆分；由人类决定是否按组件族、composable、adapter 或测试场景治理。",
      report_only: profile.package.report_only ?? true,
    });
  }
  return result;
}

function addThresholdIssue(out, issue) {
  if (issue.value <= issue.warn) return;
  out.push({ ...issue, threshold: issue.value > issue.block ? issue.block : issue.warn, severity: issue.value > issue.block ? "block" : "warn" });
}

function profileFor(file) {
  return resolveProfile(file, "profiles");
}

function packageProfileFor(path) {
  return resolveProfile(path, "package_profiles");
}

function resolveProfile(path, profileKey) {
  let profileName = config.defaults?.profile ?? "source";
  for (const override of config.overrides ?? []) {
    if ((override.paths ?? []).some((pattern) => matchGlob(pattern, path))) profileName = override.profile ?? profileName;
  }
  if (/\.(test|spec)\.(ts|tsx|js|jsx|vue)$/.test(path)) profileName = "test";
  const profile = (config[profileKey] ?? config.profiles)?.[profileName];
  if (!profile) throw new Error(`missing profile ${profileName} for ${path}`);
  return { name: profileName, ...profile };
}

function packageCountPath(file) {
  const override = (config.package_depth_overrides ?? []).find((item) => (item.paths ?? []).some((pattern) => matchGlob(pattern, file)));
  if (override?.depth) return file.split("/").slice(0, override.depth).join("/");
  if (file.startsWith("scripts/")) return "scripts";
  if (file.startsWith("tests/")) return file.split("/").slice(0, 2).join("/");
  return dirname(file).replaceAll("\\", "/");
}

function previousBaselineIssue(issue, baselineIssues, baselineFallback) {
  return baselineIssues[issue.key] ?? baselineFallback.get(stableIssueKey(issue));
}

function buildBaselineFallbackIndex(baselineIssues) {
  const index = new Map();
  for (const [key, value] of Object.entries(baselineIssues)) {
    const stableKey = stableIssueKey({ ...value, key });
    const existing = index.get(stableKey);
    if (!existing || value.value > existing.value || severityRank(value.severity) > severityRank(existing.severity)) index.set(stableKey, value);
  }
  return index;
}

function stableIssueKey(issue) {
  const [kind, path, symbol] = issue.key.split(":");
  return [kind, path, issue.profile, symbol ?? ""].join(":");
}

function annotateIssue(issue, previous) {
  const changed = !previous || issue.value > previous.value || severityRank(issue.severity) > severityRank(previous.severity);
  return { ...issue, changed, blocking: mode === "changed" && !issue.report_only && changed };
}

function baselineValue(issue) {
  return { kind: issue.kind, severity: issue.severity, value: issue.value, threshold: issue.threshold, profile: issue.profile };
}

function isExcluded(path) {
  return (config.scan?.exclude ?? []).some((pattern) => matchGlob(pattern, path));
}

function matchGlob(pattern, value) {
  const source = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replaceAll("**", "\u0000").replaceAll("*", "[^/]*").replaceAll("\u0000", ".*");
  return new RegExp(`^${source}$`).test(value);
}

function isFunctionLike(node) {
  return ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node);
}

function shouldCheckFunction(node, sourceFile, profile) {
  if (profile.ignore_top_level_test_callbacks && isTopLevelTestCallback(node, sourceFile)) return false;
  return true;
}

function isTopLevelTestCallback(node, sourceFile) {
  const parent = node.parent;
  if (!ts.isCallExpression(parent)) return false;
  const expr = parent.expression.getText(sourceFile);
  if (!["describe", "it", "test"].includes(expr) && !expr.endsWith(".each")) return false;
  let current = parent.parent;
  while (current) {
    if (isFunctionLike(current)) return false;
    if (ts.isSourceFile(current)) return true;
    current = current.parent;
  }
  return false;
}

function functionName(node, sourceFile) {
  if (node.name?.text) return node.name.text;
  const parent = node.parent;
  if (ts.isVariableDeclaration(parent) && parent.name) return parent.name.getText(sourceFile);
  if (ts.isPropertyAssignment(parent) && parent.name) return parent.name.getText(sourceFile);
  if (ts.isCallExpression(parent)) return `${parent.expression.getText(sourceFile)} callback`;
  return "<anonymous>";
}

function scriptKind(file) {
  return file.endsWith(".tsx") || file.endsWith(".jsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
}

function severityRank(severity) {
  return severity === "block" ? 2 : severity === "warn" ? 1 : 0;
}

function readJSON(path, fallback) {
  const fullPath = join(root, path);
  return existsSync(fullPath) ? JSON.parse(readFileSync(fullPath, "utf8")) : fallback;
}

function writeJSON(path, value) {
  const fullPath = join(root, path);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, `${JSON.stringify(value, null, 2)}\n`);
}

function renderMarkdown(report) {
  const lines = [
    "# Frontend Structure Gate Report",
    "",
    `- mode: ${report.mode}`,
    `- files_scanned: ${report.files_scanned}`,
    `- funcs_scanned: ${report.funcs_scanned}`,
    `- issues: ${report.issues.length}`,
    `- blocking: ${report.blocking}`,
    "",
    "| Severity | Kind | Value | Threshold | Profile | Path | Symbol | Changed | Suggestion |",
    "|---|---|---:|---:|---|---|---|---|---|",
  ];
  for (const issue of report.issues) {
    lines.push(`| ${issue.severity} | ${issue.kind} | ${issue.value} | ${issue.threshold} | ${issue.profile} | \`${issue.path}\` | ${issue.symbol ?? ""} | ${issue.changed ? "yes" : "no"} | ${issue.suggestion} |`);
  }
  lines.push("");
  return lines.join("\n");
}
