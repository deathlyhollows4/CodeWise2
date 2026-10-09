class Solution {
public:
 vector<long long> solve(vector<int> values){
  priority_queue<int> lo;priority_queue<int,vector<int>,greater<int>> hi;vector<long long> out;
  for(int v:values){if(lo.empty()||v<=lo.top())lo.push(v);else hi.push(v);
   if(lo.size()>hi.size()+1){hi.push(lo.top());lo.pop();}if(hi.size()>lo.size()){lo.push(hi.top());hi.pop();}
   out.push_back(lo.size()==hi.size()?1LL*lo.top()+hi.top():2LL*lo.top());
  }return out;
 }
};