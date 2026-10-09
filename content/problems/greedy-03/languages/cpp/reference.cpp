class Solution {
public:
    long long solve(vector<int> ratings) {
        vector<int> amount(ratings.size(),1);
        for(int i=1;i<(int)ratings.size();i++)
            if(ratings[i]>ratings[i-1]) amount[i]=amount[i-1]+1;
        for(int i=(int)ratings.size()-2;i>=0;i--)
            if(ratings[i]>ratings[i+1]) amount[i]=max(amount[i],amount[i+1]+1);
        long long total=0;
        for(int value:amount) total+=value;
        return total;
    }
};
