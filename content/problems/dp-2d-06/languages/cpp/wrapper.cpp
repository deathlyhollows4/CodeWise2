#include <bits/stdc++.h>
#include <nlohmann/json.hpp>
using namespace std; using json=nlohmann::json;

{{USER_CODE}}
int main(){ios::sync_with_stdio(false);cin.tie(nullptr);string line;while(getline(cin,line)){json input=json::parse(line);auto result=Solution().solve(input.at("a").get<string>(),input.at("b").get<string>(),input.at("target").get<string>());cout<<json(result).dump()<<"\n";}}
