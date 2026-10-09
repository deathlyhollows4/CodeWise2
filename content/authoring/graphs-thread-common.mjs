import {seeded} from './pack-builder.mjs';
export const provenance={origin:'original',author:'CodeWise2 Graphs author worker',reviewDate:'2026-10-08',reviewerType:'automated-author',rightsStatus:'original-no-imported-assets',assets:Object.fromEntries(['statement','examples','tests','references','explanation'].map(asset=>[asset,{origin:'original',sourceId:'codewise2-original',license:'project-owned'}])),independentReview:'pending'};
export const graphSchema={kind:'object',properties:{n:{kind:'integer',minimum:0,maximum:500},edges:{kind:'array',minLength:0,maxLength:5000,unordered:true,items:{kind:'array',minLength:2,maxLength:2,items:{kind:'integer',minimum:0,maximum:499}}}}};
export const graphRules=(directed=true,allowSelfLoops=true,allowDuplicates=false)=>[{kind:'graph-edges',field:'edges',vertices:'n',directed,allowSelfLoops,allowDuplicates}];
export const integer={kind:'integer',minimum:0,maximum:500};
export const verticesOutput={kind:'array',minLength:0,maxLength:500,items:{kind:'integer',minimum:0,maximum:499}};
export function randomGraphs(seed,directed=true,count=160){const raw=seeded(seed),r=()=>raw()>>>8,out=[];for(let k=0;k<count;k++){const n=1+r()%8,edges=[];for(let u=0;u<n;u++)for(let v=directed?0:u;v<n;v++)if(r()%5===0)edges.push([u,v]);out.push({input:{n,edges},category:directed?'seeded-directed-cycle-components':'seeded-undirected-color-components'});}return out;}
export const chain=n=>Array.from({length:Math.max(0,n-1)},(_,i)=>[i,i+1]);
export const ring=n=>Array.from({length:n},(_,i)=>[i,(i+1)%n]);
export function denseDag(){const edges=[];for(let u=0;u<500&&edges.length<5000;u++)for(let v=u+1;v<500&&edges.length<5000;v++)edges.push([u,v]);return edges;}
export const adjacency=(n,edges,directed=true)=>{const a=Array.from({length:n},()=>[]);for(const[u,v]of edges){a[u].push(v);if(!directed)a[v].push(u);}return a;};
// Conservative unlabeled profile: collapsing collisions only reduces retained diversity.
export function undirectedProfile({n,edges}){const a=adjacency(n,edges,false),seen=new Set(),groups=[];for(let s=0;s<n;s++)if(!seen.has(s)){const q=[s];seen.add(s);for(let i=0;i<q.length;i++)for(const v of a[q[i]])if(!seen.has(v)){seen.add(v);q.push(v);}groups.push([q.length,q.map(v=>a[v].length).sort((a,b)=>a-b),edges.filter(([u,v])=>u===v&&q.includes(u)).length]);}return JSON.stringify(groups.map(g=>JSON.stringify(g)).sort());}
export const common=module=>({primaryTopic:'graphs',generatorModule:module,authorDependencies:['content/authoring/graphs-thread-common.mjs'],version:'1.0.0',checker:{kind:'exact'},provenance});
