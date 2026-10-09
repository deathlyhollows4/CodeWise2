class Solution {
public:
 vector<int> solve(vector<int> values,int k){
  unordered_map<int,int> counts;for(int v:values)counts[v]++;
  priority_queue<pair<int,int>,vector<pair<int,int>>,greater<pair<int,int>>> q;
  for(auto e:counts){q.push({e.second,-e.first});if((int)q.size()>k)q.pop();}
  vector<int> out;while(!q.empty()){out.push_back(-q.top().second);q.pop();}reverse(out.begin(),out.end());return out;
 }
};