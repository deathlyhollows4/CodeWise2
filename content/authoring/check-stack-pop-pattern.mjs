import {popSequenceDefinition} from './stack-pop-sequence.mjs';
import {independentPopPermutation} from './stack-pop-pattern.mjs';
import {writeFileSync} from 'node:fs';
let checked=0;const failures=[];
for(let n=0;n<=7;n++){
 const pushes=Array.from({length:n},(_,i)=>i),permutation=[],used=Array(n).fill(false);
 function walk(){if(permutation.length===n){const input={pushes,pops:[...permutation]};checked++;if(popSequenceDefinition.independent(input)!==independentPopPermutation(input))failures.push(input);return;}for(let value=0;value<n;value++)if(!used[value]){used[value]=true;permutation.push(value);walk();permutation.pop();used[value]=false;}}
 walk();
}
const report={timestamp:new Date().toISOString(),scope:'Trusted exhaustive small permutation pattern vs original push/pop search; no native execution',checked,failures:failures.length};writeFileSync('docs/release-evidence/owned-stack-pop-pattern-proof.json',JSON.stringify(report,null,2));console.log(report);if(failures.length)throw Error('Pattern certificate mismatch');
