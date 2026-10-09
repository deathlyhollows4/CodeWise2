class CoverageSet {
    unordered_map<int,pair<int,int>> ranges;
    vector<int> counts=vector<int>(1000,0);
    int total=0;
    void adjust(int start,int end,int delta){for(int x=start;x<end;x++){if(delta>0){if(counts[x]++==0)total++;}else if(--counts[x]==0)total--;}}
public:
    CoverageSet() {}
    void put(int handle,int start,int end){remove(handle);ranges[handle]={start,end};adjust(start,end,1);}
    void remove(int handle){auto it=ranges.find(handle);if(it!=ranges.end()){adjust(it->second.first,it->second.second,-1);ranges.erase(it);}}
    int covered(){return total;}
};
