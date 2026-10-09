class Solution {
public:
    vector<int> solve(vector<vector<int>> intervals) {
        int n=intervals.size();vector<int> keys,order(n);for(auto p:intervals)keys.push_back(p[1]);
        sort(keys.begin(),keys.end());keys.erase(unique(keys.begin(),keys.end()),keys.end());
        vector<int> tree(keys.size()+1),result(n);iota(order.begin(),order.end(),0);
        auto rank=[&](int value){return (int)(lower_bound(keys.begin(),keys.end(),value)-keys.begin())+1;};
        auto query=[&](int k){int total=0;for(;k>0;k-=k&-k)total+=tree[k];return total;};
        sort(order.begin(),order.end(),[&](int a,int b){return intervals[a][0]!=intervals[b][0]?intervals[a][0]<intervals[b][0]:intervals[a][1]>intervals[b][1];});
        int seen=0;for(int i=0;i<n;){int j=i+1;auto p=intervals[order[i]];while(j<n&&intervals[order[j]]==p)j++;
            int count=seen-query(rank(p[1])-1)+j-i-1;for(int x=i;x<j;x++)result[order[x]]=count;
            for(int k=rank(p[1]);k<(int)tree.size();k+=k&-k)tree[k]+=j-i;seen+=j-i;i=j;
        }return result;
    }
};
