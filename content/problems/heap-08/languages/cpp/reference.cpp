class Solution {
public:
 long long solve(vector<int> tasks,int cooldown){
  if(tasks.empty())return 0;unordered_map<int,int> counts;for(int t:tasks)counts[t]++;int maximum=0,ties=0;
  for(auto e:counts){int n=e.second;if(n>maximum){maximum=n;ties=1;}else if(n==maximum)ties++;}
  return max((long long)tasks.size(),1LL*(maximum-1)*(cooldown+1LL)+ties);
 }
};