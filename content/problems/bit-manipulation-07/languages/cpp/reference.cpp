class Solution {
public:
    long long solve(vector<int> values) {
        long long total=0;
        for(int bit=0;bit<20;bit++){long long ones=0;for(int value:values)if(value&(1<<bit))ones++;total+=ones*((long long)values.size()-ones)*(1LL<<bit);}
        return total;
    }
};
