import {definitions as first} from './trees-first.mjs';
import {definitions as compare} from './trees-compare-target-cover.mjs';
import {definitions as summary} from './trees-subtree-summary.mjs';
import {definitions as last} from './trees-independent-reroot.mjs';
import {logicalCases} from './pack-builder.mjs';
import {writeFileSync} from 'node:fs';

const selected=new Set(['trees-01','trees-03','trees-10','trees-12','trees-13','trees-14','trees-30']);
const report={timestamp:new Date().toISOString(),scope:'Trusted value-insensitive tree shape audit; null/non-null child positions only, no reference execution',problems:[],failures:[]};
for(const d of [...first,...compare,...summary,...last].filter(d=>selected.has(d.id))){
 const hidden=logicalCases(d),shapes=new Set();
 for(const c of hidden){const shape=c.input.root.map(v=>v===null?null:1);while(shape.at(-1)===null)shape.pop();shapes.add(JSON.stringify(shape));}
 const row={id:d.id,hiddenInputs:hidden.length,distinctShapes:shapes.size,minimum:200,passed:shapes.size>=200};
 report.problems.push(row);if(!row.passed)report.failures.push(d.id+': fewer than200 distinct value-erased shapes');
}
writeFileSync('docs/release-evidence/content-value-insensitive-tree-shapes.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(report.failures.length)process.exitCode=1;
