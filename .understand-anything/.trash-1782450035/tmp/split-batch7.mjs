import fs from "fs";
const g = JSON.parse(fs.readFileSync(".understand-anything/intermediate/batch-7.json","utf8"));

// 83 nodes, 264 edges => parts = ceil(max(83/60, 264/120)) = ceil(max(1.38,2.2)) = 3
const parts = 3;

// the 29 batch files alphabetically
const files = [...new Set(g.nodes.filter(n=>n.type==="file").map(n=>n.filePath))].sort();
const N = files.length;
const chunkSize = Math.ceil(N/parts);
const fileChunks = [];
for (let i=0;i<parts;i++) fileChunks.push(files.slice(i*chunkSize,(i+1)*chunkSize).filter(Boolean));

// map node -> filePath (file/function/class all carry filePath)
function nodeFile(n){ return n.filePath; }

for (let k=0;k<parts;k++){
  const partFiles = new Set(fileChunks[k]);
  if (partFiles.size===0) continue;
  const partNodes = g.nodes.filter(n=>partFiles.has(nodeFile(n)));
  const partNodeIds = new Set(partNodes.map(n=>n.id));
  // edges whose source is in this part's nodes
  const partEdges = g.edges.filter(e=> partNodeIds.has(e.source));
  const out = {nodes:partNodes, edges:partEdges};
  fs.writeFileSync(`.understand-anything/intermediate/batch-7-part-${k+1}.json`, JSON.stringify(out,null,2));
  console.log(`part ${k+1}: files=${partFiles.size} nodes=${partNodes.length} edges=${partEdges.length}`);
}

// remove the combined file so only parts remain
fs.unlinkSync(".understand-anything/intermediate/batch-7.json");
console.log("removed combined batch-7.json");
