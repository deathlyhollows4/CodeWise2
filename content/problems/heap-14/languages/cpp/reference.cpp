class Solution {
public:
    vector<int> solve(vector<int> weights,vector<int> durations){
        priority_queue<pair<int,int>,vector<pair<int,int>>,greater<pair<int,int>>> free;
        priority_queue<pair<long long,int>,vector<pair<long long,int>>,greater<pair<long long,int>>> busy;
        for(int i=0;i<(int)weights.size();i++)free.push({weights[i],i});vector<int> result;long long time=0;
        for(int job=0;job<(int)durations.size();job++){time=max(time,(long long)job);while(!busy.empty()&&busy.top().first<=time){int id=busy.top().second;busy.pop();free.push({weights[id],id});}
            if(free.empty()){time=busy.top().first;while(!busy.empty()&&busy.top().first<=time){int id=busy.top().second;busy.pop();free.push({weights[id],id});}}
            int id=free.top().second;free.pop();result.push_back(id);busy.push({time+durations[job],id});
        }return result;
    }
};
