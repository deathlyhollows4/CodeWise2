class Solution {
public:
    long long solve(vector<vector<int>> jobs) {
        sort(jobs.begin(),jobs.end(),[](const auto& a,const auto& b){return a[1]>b[1];});
        vector<bool> used(2001,false);
        long long total=0;
        for(const auto& job:jobs)
            for(int time=job[0];time>=1;time--)
                if(!used[time]) {used[time]=true; total+=job[1]; break;}
        return total;
    }
};
