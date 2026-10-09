class Solution {
public:
    int solve(int target, int startFuel, vector<vector<int>> stations) {
        priority_queue<int> available;
        long long reach=startFuel;
        int index=0,count=0;
        while(reach<target) {
            while(index<(int)stations.size() && stations[index][0]<=reach) available.push(stations[index++][1]);
            if(available.empty()) return -1;
            reach+=available.top(); available.pop(); count++;
        }
        return count;
    }
};
