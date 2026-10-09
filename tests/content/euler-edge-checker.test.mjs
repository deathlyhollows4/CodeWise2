import test from 'node:test';import assert from 'node:assert/strict';
import {customCheck} from '../../packages/judge-adapter/src/custom-checkers.mjs';
const check=(input,actual)=>customCheck('directed-euler-edge-use',input,actual);
function bruteTrails(edges){if(!edges.length)return [[]];const out=[],used=new Set();function visit(path){if(path.length===edges.length){out.push([...path]);return;}for(let id=0;id<edges.length;id++)if(!used.has(id)&&(!path.length||edges[path.at(-1)][1]===edges[id][0])){used.add(id);path.push(id);visit(path);path.pop();used.delete(id);}}visit([]);return out;}
test('Euler witness accepts alternatives and checks original edge multiplicity, endpoint links and impossible sentinels',()=>{
 const g={n:2,edges:[[0,0],[0,1],[1,0],[0,0]]};for(const actual of [[0,1,2,3],[3,1,2,0],[1,2,0,3]])assert.equal(check(g,actual),true);
 for(const actual of [[0,1,2,2],[0,1,2],[0,1,2,4],[1,0,2,3],[-1],[-2],['0',1,2,3]])assert.equal(check(g,actual),false);
 assert.equal(check({n:4,edges:[[0,1],[1,0],[2,3],[3,2]]},[-1]),true);
 assert.equal(check({n:3,edges:[[0,1],[0,2]]},[-1]),true);
 assert.equal(check({n:3,edges:[[0,1],[1,2]]},[0,1]),true);
 assert.equal(check({n:0,edges:[]},[]),true);assert.equal(check({n:0,edges:[]},[-1]),false);
 for(const input of [{n:501,edges:[]},{n:1,edges:[[0,1]]},{n:1,edges:[[0]]},{n:1,edges:[[0,0.5]]},{n:1,edges:Array(5001).fill([0,0])}])assert.equal(check(input,[]),false);
});
test('Euler impossibility and alternate witnesses agree with exhaustive edge-order search on bounded directed multigraphs',()=>{let graphs=0,witnesses=0;for(let n=0;n<=3;n++){const possible=n*n;for(let m=0;m<=4;m++){if(!possible&&m)continue;const total=m===0?1:possible**m;for(let encoded=0;encoded<total;encoded++){let state=encoded;const edges=Array.from({length:m},()=>{const edge=state%possible;state=Math.floor(state/possible);return [Math.floor(edge/n),edge%n];});const input={n,edges},trails=bruteTrails(edges);assert.equal(check(input,[-1]),trails.length===0);for(const trail of trails){assert.equal(check(input,trail),true);witnesses++;}if(m>0)assert.equal(check(input,[]),false);graphs++;}}}assert.equal(graphs,7728);assert.ok(witnesses>1000);});

