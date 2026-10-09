import {writeFile} from 'node:fs/promises';
import {JudgeAdapter,getPrivatePack} from '../packages/judge-adapter/src/index.mjs';
import {buildFunctionHarness} from '../content/authoring/harness.mjs';
const adapter=new JudgeAdapter(),runtime=await adapter.readiness();if(!runtime.ready)throw new Error('Ordinary runner readiness required');
const wrapper=buildFunctionHarness({arguments:[{name:'head',type:'ListNode'}],returnType:'ListNodeIdentitySequence'}),pack=await getPrivatePack('linked-list-01');
const programs={
 java:{valid:'class Solution {public ListNode solve(ListNode head){ListNode result=null;while(head!=null){ListNode next=head.next;head.next=result;result=head;head=next;}return result;}}',foreign:'class Solution {public ListNode solve(ListNode head){return new ListNode(head.val);}}',value:'class Solution {public ListNode solve(ListNode head){head.val=0;return head;}}',cycle:'class Solution {public ListNode solve(ListNode head){head.next=head;return head;}}'},
 cpp:{valid:'class Solution {public:ListNode* solve(ListNode* head){ListNode* result=nullptr;while(head){auto next=head->next;head->next=result;result=head;head=next;}return result;}};',foreign:'class Solution {public:ListNode* solve(ListNode* head){return new ListNode(head->val);}};',value:'class Solution {public:ListNode* solve(ListNode* head){head->val=0;return head;}};',cycle:'class Solution {public:ListNode* solve(ListNode* head){head->next=head;return head;}};'},
 python:{valid:'class Solution:\n    def solve(self, head):\n        result=None\n        while head is not None:\n            next=head.next\n            head.next=result\n            result=head\n            head=next\n        return result\n',foreign:'class Solution:\n    def solve(self, head):\n        return ListNode(head.val)\n',value:'class Solution:\n    def solve(self, head):\n        head.val=0\n        return head\n',cycle:'class Solution:\n    def solve(self, head):\n        head.next=head\n        return head\n'}
};
const results=[];
for(const language of ['java','cpp','python'])for(const [scenario,code] of Object.entries(programs[language])){
 const result=await adapter.execute({language,source:wrapper[language].replace('{{USER_CODE}}',()=>code),stdin:'{"head":[7,7,3]}\n',limits:pack.manifest.limits});
 const passed=scenario==='valid'?result.status==='executed'&&result.stdout==='[2,1,0]\n':result.status==='runtime_error';
 results.push({language,scenario,passed,result});
}
const report={schemaVersion:1,command:'node scripts/validate-identity-sequence.mjs',generatedAt:new Date().toISOString(),runtime,passed:results.every(r=>r.passed),results};
await writeFile('docs/release-evidence/identity-sequence-isolated-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,results:results.map(({language,scenario,passed})=>({language,scenario,passed}))}));process.exitCode=report.passed?0:1;
