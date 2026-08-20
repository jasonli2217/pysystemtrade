import fs from "fs";
const ROOT = "/Users/jasonli/Dev/FORKed repo/pysystemtrade";
const {nodes, edges} = JSON.parse(fs.readFileSync(ROOT+"/.understand-anything/tmp/ua-graph-12-full.json","utf8"));

// the 27 batch files alphabetically
const files = [...new Set(nodes.filter(n=>n.type==="file").map(n=>n.filePath))].sort();
const N = files.length;
const parts = Math.ceil(Math.max(nodes.length/60, edges.length/120));
const chunkSize = Math.ceil(N/parts);

// map filePath -> part index
const fileToPart = {};
for (let i=0;i<N;i++) fileToPart[files[i]] = Math.floor(i/chunkSize);

// node belongs to part of its filePath
function nodePart(n){ return fileToPart[n.filePath]; }
function nodeIdToFile(id){
  // file:..., function:path:name, class:path:name
  if (id.startsWith("file:")) return id.slice(5);
  const rest = id.slice(id.indexOf(":")+1);
  const lastColon = rest.lastIndexOf(":");
  return lastColon===-1 ? rest : rest.slice(0,lastColon);
}

const partNodes = Array.from({length:parts},()=>[]);
const nodeIdToPart = {};
for (const n of nodes){ const p = nodePart(n); partNodes[p].push(n); nodeIdToPart[n.id]=p; }

const partEdges = Array.from({length:parts},()=>[]);
for (const e of edges){
  // assign edge to part of its source node
  let p = nodeIdToPart[e.source];
  if (p===undefined){ const f = nodeIdToFile(e.source); p = fileToPart[f]; }
  if (p===undefined) p = 0;
  partEdges[p].push(e);
}

let totalN=0, totalE=0;
for (let k=0;k<parts;k++){
  const frag = {nodes:partNodes[k], edges:partEdges[k]};
  const fn = ROOT+"/.understand-anything/intermediate/batch-12-part-"+(k+1)+".json";
  fs.writeFileSync(fn, JSON.stringify(frag, null, 1));
  totalN+=partNodes[k].length; totalE+=partEdges[k].length;
  console.log("part",k+1,"nodes",partNodes[k].length,"edges",partEdges[k].length);
}
console.log("TOTAL nodes",totalN,"edges",totalE,"parts",parts);
