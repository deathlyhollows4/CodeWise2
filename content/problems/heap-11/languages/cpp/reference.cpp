class Solution {
public:
 long long solve(vector<int> capital,vector<int> profits,long long initial,int k){
  vector<pair<int,int>> projects;for(int i=0;i<(int)capital.size();i++)projects.push_back({capital[i],profits[i]});sort(projects.begin(),projects.end());
  priority_queue<int> available;long long wealth=initial;int j=0;
  for(int step=0;step<k;step++){while(j<(int)projects.size()&&projects[j].first<=wealth)available.push(projects[j++].second);if(available.empty())break;wealth+=available.top();available.pop();}
  return wealth;
 }
};