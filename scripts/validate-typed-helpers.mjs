import {writeFile} from 'node:fs/promises';
import {JudgeAdapter,judgePack,getPrivatePack} from '../packages/judge-adapter/src/index.mjs';
import {helperSources,expectedHelperOutput} from '../tests/security/readonly-runtime-fixtures.mjs';
const adapter=new JudgeAdapter(),runtime=await adapter.readiness();
if(!runtime.ready)throw new Error('Ordinary isolated runner readiness required');
const pack=await getPrivatePack('linked-list-03'),results=[];
const mutations={java:'class Solution {public ListNode solve(ListNode head,int k){if(head!=null)head.val++;return head;}}',cpp:'class Solution {public:ListNode* solve(ListNode* head,int k){if(head)head->val++;return head;}};',python:'class Solution:\n    def solve(self, head, k):\n        if head is not None: head.val+=1\n        return head\n'};
for(const language of ['java','cpp','python']){
 const helper=await adapter.execute({language,source:helperSources[language],stdin:'',limits:pack.manifest.limits});
 const negative=await judgePack({problemId:pack.manifest.id,language,code:mutations[language],mode:'run',adapter});
 results.push({language,helperPassed:helper.status==='executed'&&helper.stdout===expectedHelperOutput,helper,mutationRejected:negative.status==='runtime_error',negative});
}
const report={schemaVersion:1,command:'node scripts/validate-typed-helpers.mjs',generatedAt:new Date().toISOString(),runtime,results,passed:results.every(r=>r.helperPassed&&r.mutationRejected)};
await writeFile('docs/release-evidence/typed-helper-isolated-validation.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:report.passed,results:results.map(({language,helperPassed,mutationRejected})=>({language,helperPassed,mutationRejected}))}));
process.exitCode=report.passed?0:1;
