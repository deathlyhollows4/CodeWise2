class Solution {
public:
    long long solve(vector<int> costs,int k,int candidates){
        using Item=pair<int,int>;priority_queue<Item,vector<Item>,greater<Item>> left,right;int a=0,b=(int)costs.size()-1;long long total=0;
        for(int i=0;i<candidates&&a<=b;i++,a++)left.push({costs[a],a});
        for(int i=0;i<candidates&&a<=b;i++,b--)right.push({costs[b],b});
        for(int hired=0;hired<k;hired++){bool fromLeft=right.empty()||(!left.empty()&&left.top()<=right.top());
            auto& queue=fromLeft?left:right;total+=queue.top().first;queue.pop();
            if(a<=b){if(fromLeft){left.push({costs[a],a});a++;}else{right.push({costs[b],b});b--;}}
        }return total;
    }
};
