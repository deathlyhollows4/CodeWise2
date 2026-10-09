class Solution {
public:
 long long solve(vector<int> values){
  priority_queue<long long> q;long long minimum=LLONG_MAX,best=LLONG_MAX;
  for(int v:values){long long x=v%2?2LL*v:v;q.push(x);minimum=min(minimum,x);}
  while(true){long long maximum=q.top();q.pop();best=min(best,maximum-minimum);if(maximum%2)break;long long half=maximum/2;minimum=min(minimum,half);q.push(half);}
  return best;
 }
};