#!/usr/bin/env node
"use strict";
const fs = require("fs");

function main() {
  const inPath = process.argv[2];
  const outPath = process.argv[3];
  if (!inPath || !outPath) {
    console.error("Usage: node ua-arch-analyze.js <input.json> <output.json>");
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(inPath, "utf8"));
  const fileNodes = data.fileNodes || [];
  const importEdges = data.importEdges || [];
  const allEdges = data.allEdges || [];

  const byId = new Map(fileNodes.map((n) => [n.id, n]));
  const paths = fileNodes.map((n) => n.filePath || "");

  // --- common prefix (directory-segment based) ---
  function dirSegments(p) {
    const parts = p.split("/");
    return parts.slice(0, parts.length - 1); // drop filename
  }
  let commonPrefixSegs = null;
  for (const p of paths) {
    const segs = dirSegments(p);
    if (commonPrefixSegs === null) {
      commonPrefixSegs = segs.slice();
    } else {
      let i = 0;
      while (i < commonPrefixSegs.length && i < segs.length && commonPrefixSegs[i] === segs[i]) i++;
      commonPrefixSegs = commonPrefixSegs.slice(0, i);
    }
  }
  commonPrefixSegs = commonPrefixSegs || [];

  // --- A. Directory grouping ---
  function groupOf(p) {
    const parts = p.split("/");
    const fileSegs = parts.slice(0, parts.length - 1);
    const rest = fileSegs.slice(commonPrefixSegs.length);
    if (rest.length === 0) return "(root)";
    return rest[0];
  }
  const directoryGroups = {};
  for (const n of fileNodes) {
    const g = groupOf(n.filePath || "");
    (directoryGroups[g] = directoryGroups[g] || []).push(n.id);
  }

  // --- B. Node type grouping ---
  const nodeTypeGroups = {};
  for (const n of fileNodes) {
    (nodeTypeGroups[n.type] = nodeTypeGroups[n.type] || []).push(n.id);
  }

  // --- C. adjacency / fan-in / fan-out ---
  const fanOut = {}, fanIn = {};
  for (const e of importEdges) {
    fanOut[e.source] = (fanOut[e.source] || 0) + 1;
    fanIn[e.target] = (fanIn[e.target] || 0) + 1;
  }

  // group lookup for an id
  const idToGroup = new Map();
  for (const [g, ids] of Object.entries(directoryGroups)) {
    for (const id of ids) idToGroup.set(id, g);
  }

  // --- D. cross-category edges ---
  const crossMap = {};
  for (const e of allEdges) {
    const s = byId.get(e.source), t = byId.get(e.target);
    if (!s || !t) continue;
    if (s.type === "file" && t.type === "file") continue; // pure code-code handled elsewhere
    const key = s.type + "|" + t.type + "|" + e.type;
    crossMap[key] = (crossMap[key] || 0) + 1;
  }
  const crossCategoryEdges = Object.entries(crossMap).map(([k, c]) => {
    const [fromType, toType, edgeType] = k.split("|");
    return { fromType, toType, edgeType, count: c };
  }).sort((a, b) => b.count - a.count);

  // --- E. inter-group import frequency ---
  const interMap = {};
  for (const e of importEdges) {
    const a = idToGroup.get(e.source), b = idToGroup.get(e.target);
    if (a == null || b == null) continue;
    if (a === b) continue;
    const key = a + "|" + b;
    interMap[key] = (interMap[key] || 0) + 1;
  }
  const interGroupImports = Object.entries(interMap).map(([k, c]) => {
    const [from, to] = k.split("|");
    return { from, to, count: c };
  }).sort((a, b) => b.count - a.count);

  // --- F. intra-group density ---
  const intraGroupDensity = {};
  for (const g of Object.keys(directoryGroups)) {
    intraGroupDensity[g] = { internalEdges: 0, totalEdges: 0, density: 0 };
  }
  for (const e of importEdges) {
    const a = idToGroup.get(e.source), b = idToGroup.get(e.target);
    if (a != null) {
      intraGroupDensity[a].totalEdges++;
      if (a === b) intraGroupDensity[a].internalEdges++;
    }
    if (b != null && b !== a) {
      intraGroupDensity[b].totalEdges++;
    }
  }
  for (const g of Object.keys(intraGroupDensity)) {
    const d = intraGroupDensity[g];
    d.density = d.totalEdges ? +(d.internalEdges / d.totalEdges).toFixed(3) : 0;
  }

  // --- G. directory pattern matching ---
  const dirPatterns = [
    [["routes","api","controllers","endpoints","handlers"], "api"],
    [["services","core","lib","domain","logic"], "service"],
    [["models","db","data","persistence","repository","entities"], "data"],
    [["components","views","pages","ui","layouts","screens"], "ui"],
    [["middleware","plugins","interceptors","guards"], "middleware"],
    [["utils","helpers","common","shared","tools"], "utility"],
    [["config","constants","env","settings"], "config"],
    [["__tests__","test","tests","spec","specs"], "test"],
    [["types","interfaces","schemas","contracts","dtos"], "types"],
    [["hooks"], "hooks"],
    [["store","state","reducers","actions","slices"], "state"],
    [["assets","static","public"], "assets"],
    [["migrations"], "data"],
    [["management","commands"], "config"],
    [["templatetags"], "utility"],
    [["signals"], "service"],
    [["serializers"], "api"],
    [["cmd"], "entry"],
    [["internal"], "service"],
    [["pkg"], "utility"],
    [["docs","documentation","wiki"], "documentation"],
    [["deploy","deployment","infra","infrastructure"], "infrastructure"],
    [[".github",".gitlab",".circleci"], "ci-cd"],
    [["k8s","kubernetes","helm","charts"], "infrastructure"],
    [["terraform","tf"], "infrastructure"],
    [["docker"], "infrastructure"],
    [["sql","database"], "data"],
  ];
  function matchDir(name) {
    const low = name.toLowerCase();
    for (const [keys, label] of dirPatterns) {
      if (keys.includes(low)) return label;
    }
    return null;
  }
  const patternMatches = {};
  for (const g of Object.keys(directoryGroups)) {
    const m = matchDir(g);
    if (m) patternMatches[g] = m;
  }

  // --- H. deployment topology ---
  function baseName(p) { return p.split("/").pop(); }
  const infraFiles = [];
  let hasDockerfile = false, hasCompose = false, hasK8s = false, hasTerraform = false, hasCI = false;
  for (const n of fileNodes) {
    const p = n.filePath || "", b = baseName(p).toLowerCase();
    if (b === "dockerfile" || b.startsWith("dockerfile.")) { hasDockerfile = true; infraFiles.push(p); }
    else if (b.startsWith("docker-compose")) { hasCompose = true; infraFiles.push(p); }
    else if (b.endsWith(".tf") || b.endsWith(".tfvars")) { hasTerraform = true; infraFiles.push(p); }
    else if (p.includes(".github/workflows/") || b === ".gitlab-ci.yml" || b === "jenkinsfile") { hasCI = true; infraFiles.push(p); }
    else if (b === "makefile") { infraFiles.push(p); }
    if (p.includes("k8s/") || p.includes("kubernetes/") || p.includes("helm/")) { hasK8s = true; if (!infraFiles.includes(p)) infraFiles.push(p); }
  }
  const deploymentTopology = { hasDockerfile, hasCompose, hasK8s, hasTerraform, hasCI, infraFiles };

  // --- I. data pipeline ---
  const dataPipeline = { schemaFiles: [], migrationFiles: [], dataModelFiles: [], apiHandlerFiles: [] };
  for (const n of fileNodes) {
    const p = n.filePath || "", b = baseName(p).toLowerCase();
    const tags = (n.tags || []).map((t) => t.toLowerCase());
    if (b.endsWith(".sql") || b.endsWith(".graphql") || b.endsWith(".gql") || b.endsWith(".proto") || b.endsWith(".prisma")) dataPipeline.schemaFiles.push(p);
    if (p.includes("migrations/")) dataPipeline.migrationFiles.push(p);
    if (/(^|\/)(models|sysobjects|entities)\//.test(p) || tags.includes("model") || tags.includes("domain-model")) dataPipeline.dataModelFiles.push(p);
    if (tags.includes("api-handler") || tags.includes("endpoint") || tags.includes("route") || /(^|\/)(routes|api|controllers)\//.test(p)) dataPipeline.apiHandlerFiles.push(p);
  }

  // --- J. documentation coverage ---
  const groupsWithDocs = new Set();
  const docGroups = new Set();
  for (const n of fileNodes) {
    const p = n.filePath || "", b = baseName(p).toLowerCase();
    if (b.endsWith(".md") || b.endsWith(".rst") || n.type === "document") {
      groupsWithDocs.add(idToGroup.get(n.id));
    }
  }
  const totalGroups = Object.keys(directoryGroups).length;
  const undocumentedGroups = Object.keys(directoryGroups).filter((g) => !groupsWithDocs.has(g));
  const docCoverage = {
    groupsWithDocs: groupsWithDocs.size,
    totalGroups,
    coverageRatio: totalGroups ? +(groupsWithDocs.size / totalGroups).toFixed(2) : 0,
    undocumentedGroups,
  };

  // --- K. dependency direction ---
  const pairAgg = {};
  for (const { from, to, count } of interGroupImports) {
    const key = [from, to].sort().join("|");
    pairAgg[key] = pairAgg[key] || {};
    pairAgg[key][from + "->" + to] = count;
  }
  const dependencyDirection = [];
  const seen = new Set();
  for (const { from, to } of interGroupImports) {
    const key = [from, to].sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    const fwd = interMap[from + "|" + to] || 0;
    const bwd = interMap[to + "|" + from] || 0;
    if (fwd >= bwd) dependencyDirection.push({ dependent: from, dependsOn: to });
    else dependencyDirection.push({ dependent: to, dependsOn: from });
  }

  // --- stats ---
  const filesPerGroup = {};
  for (const [g, ids] of Object.entries(directoryGroups)) filesPerGroup[g] = ids.length;
  const nodeTypeCounts = {};
  for (const [t, ids] of Object.entries(nodeTypeGroups)) nodeTypeCounts[t] = ids.length;

  // top fan-in / fan-out
  function topN(obj, n) {
    return Object.fromEntries(Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n));
  }

  const result = {
    scriptCompleted: true,
    commonPrefix: commonPrefixSegs.join("/"),
    directoryGroups,
    nodeTypeGroups,
    crossCategoryEdges,
    interGroupImports,
    intraGroupDensity,
    patternMatches,
    deploymentTopology,
    dataPipeline,
    docCoverage,
    dependencyDirection,
    fileStats: {
      totalFileNodes: fileNodes.length,
      filesPerGroup,
      nodeTypeCounts,
    },
    fileFanIn: topN(fanIn, 40),
    fileFanOut: topN(fanOut, 40),
  };

  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  process.exit(0);
}

try { main(); } catch (e) { console.error(e && e.stack ? e.stack : String(e)); process.exit(1); }
