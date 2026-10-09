class Solution {
public:
    vector<vector<int>> solve(vector<vector<int>> buildings) {
        sort(buildings.begin(),buildings.end());set<int> coordinates;for(auto b:buildings){coordinates.insert(b[0]);coordinates.insert(b[1]);}
        priority_queue<pair<int,int>> active;vector<vector<int>> result;int index=0,previous=0;
        for(int x:coordinates){while(index<(int)buildings.size()&&buildings[index][0]<=x){active.push({buildings[index][2],buildings[index][1]});index++;}
            while(!active.empty()&&active.top().second<=x)active.pop();int height=active.empty()?0:active.top().first;
            if(height!=previous){result.push_back({x,height});previous=height;}
        }return result;
    }
};
