#include <bits/stdc++.h>
#include <nlohmann/json.hpp>
using namespace std; using json=nlohmann::json;

{{USER_CODE}}
int main(){ios::sync_with_stdio(false);cin.tie(nullptr);string line;while(getline(cin,line)){json input=json::parse(line);auto result=Solution().solve(input.at("release").get<vector<long long>>(),input.at("duration").get<vector<long long>>(),input.at("deadline").get<vector<long long>>());cout<<json(result).dump()<<"\n";}}
