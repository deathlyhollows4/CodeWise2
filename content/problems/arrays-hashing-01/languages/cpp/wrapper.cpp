#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int count;cin>>count;while(count--){int n;cin>>n;vector<int> values(n);for(auto &v:values)cin>>v;cout<<Solution().solve(values)<<"\n";}}
