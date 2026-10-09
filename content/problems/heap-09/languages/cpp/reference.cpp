class Solution {
public:
 vector<int> solve(vector<string> commands,vector<int> ids,vector<int> priorities){
  priority_queue<tuple<int,int,int>> q;unordered_map<int,int> active;vector<int> out;
  for(int i=0;i<(int)commands.size();i++){int id=ids[i];if(commands[i]=="add"){if(!active.count(id)){active[id]=i;q.push({priorities[i],-i,id});}}else if(commands[i]=="cancel")active.erase(id);else{while(!q.empty()){auto [priority,negativeStamp,handle]=q.top();auto found=active.find(handle);if(found!=active.end()&&found->second==-negativeStamp)break;q.pop();}if(q.empty())out.push_back(-1);else{int handle=get<2>(q.top());q.pop();active.erase(handle);out.push_back(handle);}}}return out;
 }
};