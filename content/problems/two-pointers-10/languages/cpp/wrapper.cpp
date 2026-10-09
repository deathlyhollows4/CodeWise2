#include <bits/stdc++.h>
#include <nlohmann/json.hpp>
using namespace std; using json=nlohmann::json;

{{USER_CODE}}
int main(){ios::sync_with_stdio(false);cin.tie(nullptr);string line;while(getline(cin,line)){json input=json::parse(line);auto result=Solution().solve(input.at("symbolsA").get<string>(),input.at("countsA").get<vector<int>>(),input.at("symbolsB").get<string>(),input.at("countsB").get<vector<int>>());cout<<json(result).dump()<<"\n";}}
