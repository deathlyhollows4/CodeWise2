// Trusted helper fixtures for the runner owner to compile/execute in isolation.
// No host compilation or learner/reference execution is performed by this file.
import {cppStructures,javaStructures,pythonStructures} from '../../content/authoring/structures.mjs';
export const expectedHelperOutput='restored\nlist-next\nlist-value\ntree-link\ngraph-order\n';
export const helperSources={
 cpp:'#include <bits/stdc++.h>\n#include <nlohmann/json.hpp>\nusing namespace std;using json=nlohmann::json;\n'+cppStructures+`
int main(){
 {CwContext cw;auto h=cw.list(json::parse("[7,7]"));cw.snapshot_inputs();auto old=h->next;h->next=nullptr;h->next=old;cw.check_inputs();cout<<"restored\\n";}
 {CwContext cw;auto h=cw.list(json::parse("[7,7]"));cw.snapshot_inputs();h->next=nullptr;try{cw.check_inputs();cout<<"MISSING-GUARD\\n";}catch(const exception&){cout<<"list-next\\n";}}
 {CwContext cw;auto h=cw.list(json::parse("[7,7]"));cw.snapshot_inputs();h->next->val=8;try{cw.check_inputs();cout<<"MISSING-GUARD\\n";}catch(const exception&){cout<<"list-value\\n";}}
 {CwContext cw;auto h=cw.tree(json::parse("[5,7,7]"));cw.snapshot_inputs();h->left=h->right;try{cw.check_inputs();cout<<"MISSING-GUARD\\n";}catch(const exception&){cout<<"tree-link\\n";}}
 {CwContext cw;auto h=cw.graph(json::parse(R"({"values":[1,7,7],"neighbors":[[1,2],[0],[0]],"root":0})"));cw.snapshot_inputs();reverse(h->neighbors.begin(),h->neighbors.end());try{cw.check_inputs();cout<<"MISSING-GUARD\\n";}catch(const exception&){cout<<"graph-order\\n";}}
}
`,
 java:'import java.util.*;import com.google.gson.*;\n'+javaStructures+`
public class Main{public static void main(String[]args){
 {CwContext cw=new CwContext();ListNode h=cw.list(JsonParser.parseString("[7,7]"));cw.snapshot_inputs();ListNode old=h.next;h.next=null;h.next=old;cw.check_inputs();System.out.println("restored");}
 {CwContext cw=new CwContext();ListNode h=cw.list(JsonParser.parseString("[7,7]"));cw.snapshot_inputs();h.next=null;try{cw.check_inputs();System.out.println("MISSING-GUARD");}catch(IllegalArgumentException e){System.out.println("list-next");}}
 {CwContext cw=new CwContext();ListNode h=cw.list(JsonParser.parseString("[7,7]"));cw.snapshot_inputs();h.next.val=8;try{cw.check_inputs();System.out.println("MISSING-GUARD");}catch(IllegalArgumentException e){System.out.println("list-value");}}
 {CwContext cw=new CwContext();TreeNode h=cw.tree(JsonParser.parseString("[5,7,7]"));cw.snapshot_inputs();h.left=h.right;try{cw.check_inputs();System.out.println("MISSING-GUARD");}catch(IllegalArgumentException e){System.out.println("tree-link");}}
 {CwContext cw=new CwContext();GraphNode h=cw.graph(JsonParser.parseString("{\\"values\\":[1,7,7],\\"neighbors\\":[[1,2],[0],[0]],\\"root\\":0}"));cw.snapshot_inputs();Collections.reverse(h.neighbors);try{cw.check_inputs();System.out.println("MISSING-GUARD");}catch(IllegalArgumentException e){System.out.println("graph-order");}}
}}
`,
 python:pythonStructures+`
cw=CwContext();head=cw.list([7,7]);cw.snapshot_inputs();old=head.next;head.next=None;head.next=old;cw.check_inputs();print('restored')
for change,label in [('next','list-next'),('val','list-value')]:
    cw=CwContext();head=cw.list([7,7]);cw.snapshot_inputs()
    if change=='next':head.next=None
    else:head.next.val=8
    try: cw.check_inputs();print('MISSING-GUARD')
    except ValueError:print(label)
cw=CwContext();head=cw.tree([5,7,7]);cw.snapshot_inputs();head.left=head.right
try: cw.check_inputs();print('MISSING-GUARD')
except ValueError:print('tree-link')
cw=CwContext();head=cw.graph({'values':[1,7,7],'neighbors':[[1,2],[0],[0]],'root':0});cw.snapshot_inputs();head.neighbors.reverse()
try: cw.check_inputs();print('MISSING-GUARD')
except ValueError:print('graph-order')
`
};
