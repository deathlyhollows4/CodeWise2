class Solution {
public:
    vector<int> solve(vector<vector<int>> feeds) {
        using Event=tuple<int,int,int>;priority_queue<Event,vector<Event>,greater<Event>> queue;int maximum=INT_MIN;
        for(int id=0;id<(int)feeds.size();id++){if(feeds[id].empty())return {};queue.emplace(feeds[id][0],id,0);maximum=max(maximum,feeds[id][0]);}
        long long bestWidth=LLONG_MAX;int bestLeft=0,bestRight=0;
        while(true){auto [minimum,id,index]=queue.top();queue.pop();long long width=(long long)maximum-minimum;
            if(width<bestWidth||(width==bestWidth&&minimum<bestLeft)){bestWidth=width;bestLeft=minimum;bestRight=maximum;}
            if(index+1==(int)feeds[id].size())break;int value=feeds[id][index+1];maximum=max(maximum,value);queue.emplace(value,id,index+1);
        }return {bestLeft,bestRight};
    }
};
