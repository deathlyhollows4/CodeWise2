#include <bits/stdc++.h>
#include <nlohmann/json.hpp>
using namespace std; using json=nlohmann::json;

{{USER_CODE}}
int main(){ios::sync_with_stdio(false);cin.tie(nullptr);string line;while(getline(cin,line)){json input=json::parse(line);auto result=Solution().solve(input.at("values").get<vector<int>>(),input.at("limit").get<long long>());cout<<json(result).dump()<<"\n";}}
