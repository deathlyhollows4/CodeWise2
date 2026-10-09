import test from "node:test";
import assert from "node:assert/strict";
import { qualifiedTeacherClosure } from "../../packages/learning-engine/src/teacher-closure.ts";
import { recommend, type Evidence } from "../../packages/learning-engine/src/index.ts";
const p=(id:string,topic:string,step:number,skills:string[],prerequisites:string[],remedialIds:string[]=[],checkpointIds:string[]=[])=>({id,status:"published",primaryTopic:topic,step,skillIds:skills,prerequisites,remedialIds,checkpointIds,nextIds:[]}) as any;
const e=(problem:any,id:string,assisted=false):Evidence=>({id,problemId:problem.id,step:problem.step,language:"python",skills:problem.skillIds,outcome:"accepted",review:false,assisted,createdAt:"2026-10-08T00:00:00Z"});
test("explicit two-hop teacher chain preserves original assisted checkpoint purpose",()=>{
  const base=p("arrays-hashing-01","arrays-hashing",1,["arrays.traversal"],[]),source=p("linked-list-05","linked-list",3,["list.reversal"],["arrays.traversal"],["linked-list-01"],["linked-list-06"]),target=p("linked-list-06","linked-list",3,["list.partition"],["list.link-splice"],["linked-list-01"]),teacher=p("linked-list-01","linked-list",1,["list.link-splice"],["sorted.order"],["two-pointers-04"]),foundation=p("two-pointers-04","two-pointers",2,["sorted.order"],["arrays.traversal"]);
  const catalogue=[base,source,target,teacher,foundation],history=[e(base,"base"),e(source,"helped",true)],original=JSON.stringify(history);
  let r=recommend(catalogue,history,"python","linked-list");assert.equal(r.problemId,foundation.id);assert.equal(r.pendingMode,"same_step_checkpoint");assert.equal(r.pendingStep,3);assert.equal(JSON.stringify(history),original);
  const pending={topic:"linked-list",step:3,sourceProblemId:source.id,resumeMode:"same_step_checkpoint" as const};
  history.push(e(foundation,"sorted"));r=recommend(catalogue,history,"python",undefined,[],pending);assert.equal(r.problemId,teacher.id);assert.equal(r.pendingMode,"same_step_checkpoint");assert.equal(r.requestedStep,3);
  history.push(e(teacher,"splice"));r=recommend(catalogue,history,"python",undefined,[],pending);assert.equal(r.problemId,target.id);assert.equal(r.mode,"same_step_checkpoint");assert.equal(r.requestedStep,3);assert.equal(r.focusTopic,"linked-list");
});
test("cycles, exhausted teachers, unlinked teachers and depth caps never invent eligibility or skill evidence",()=>{
  const a=p("a","x",1,["goal"],["second"],["b"]),b=p("b","x",1,["second"],["goal"],["a"]),unlinked=p("unlinked","x",1,["goal"],[]);
  const known=new Set<string>(),solved=new Set<string>(),eligible=()=>true;
  const cycle=qualifiedTeacherClosure([a,b,unlinked],["a"],["goal"],known,solved,[],eligible);assert.equal(cycle.teachers.length,0);assert.equal(cycle.cycles,1);assert.equal(known.size,0);
  assert.equal(qualifiedTeacherClosure([unlinked],["unlinked"],["goal"],known,new Set(["unlinked"]),[],eligible).teachers.length,0);
  assert.equal(qualifiedTeacherClosure([unlinked],["unlinked"],["goal"],known,solved,["unlinked"],eligible).teachers.length,0);
  const chain=Array.from({length:12},(_,i)=>p("chain-"+i,"x",1,[i?"need-"+i:"goal"],i===11?[]:["need-"+(i+1)],i===11?[]:["chain-"+(i+1)]));
  const capped=qualifiedTeacherClosure(chain,["chain-0"],["goal"],known,solved,[],eligible);assert.equal(capped.teachers.length,0);assert.equal(capped.capped,true);
});
