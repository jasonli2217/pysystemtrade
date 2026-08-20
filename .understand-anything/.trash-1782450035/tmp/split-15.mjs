import fs from "fs";
const {nodes,edges}=JSON.parse(fs.readFileSync(".understand-anything/tmp/ua-15-full.json","utf8"));
const raw=JSON.parse(fs.readFileSync(".understand-anything/tmp/batch-15-raw.json","utf8"));
const files=raw.files.map(f=>f.path).sort();
const imp=raw.batchImportData;
const nm=raw.neighborMap;
// build set of valid neighbor symbols per path
const nbSym={};
for(const k in nm){ for(const e of nm[k]){ nbSym[e.path]=nbSym[e.path]||new Set(); e.symbols.forEach(s=>nbSym[e.path].add(s)); } }

const parts=3;
const chunk=Math.ceil(files.length/parts);
const groups=[];
for(let i=0;i<parts;i++) groups.push(new Set(files.slice(i*chunk,(i+1)*chunk)));
const fileOfNode=(n)=> n.filePath || n.id.split(":")[1];
const groupOfFile=(fp)=> groups.findIndex(g=>g.has(fp));

// validate calls/exports cross-batch targets against neighbor symbols where applicable
const localNodeIds=new Set(nodes.map(n=>n.id));
let dropped=0;
const keptEdges=edges.filter(e=>{
  if(e.source===e.target) return false;
  // imports always valid (resolved)
  if(e.type==="imports"||e.type==="tested_by") return true;
  // contains/exports: target must be local node
  if(e.type==="contains"||e.type==="exports") return localNodeIds.has(e.target);
  // calls: target may be local or cross-batch neighbor symbol
  if(e.type==="calls"){
    if(localNodeIds.has(e.target)) return true;
    const m=e.target.match(/^(function|class):([^:]+):(.+)$/);
    if(m){ const tp=m[2], sym=m[3]; if(nbSym[tp]&&nbSym[tp].has(sym)) return true; }
    dropped++; return false;
  }
  return true;
});
console.log("dropped calls edges:",dropped);

for(let i=0;i<parts;i++){
  const partNodes=nodes.filter(n=>groupOfFile(fileOfNode(n))===i);
  const partNodeIds=new Set(partNodes.map(n=>n.id));
  const partEdges=keptEdges.filter(e=>{
    const fp=e.source.split(":")[1];
    return groupOfFile(fp)===i;
  });
  const out={nodes:partNodes,edges:partEdges};
  fs.writeFileSync(`.understand-anything/intermediate/batch-15-part-${i+1}.json`,JSON.stringify(out,null,2));
  console.log(`part ${i+1}: nodes=${partNodes.length} edges=${partEdges.length}`);
}
