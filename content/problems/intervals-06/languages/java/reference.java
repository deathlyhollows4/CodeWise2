class CoverageSet {
    private final HashMap<Integer,int[]> ranges=new HashMap<>();
    private final int[] counts=new int[1000];
    private int total=0;
    CoverageSet() {}
    private void adjust(int start,int end,int delta) {
        for(int x=start;x<end;x++){if(delta>0){if(counts[x]++==0)total++;}else if(--counts[x]==0)total--;}
    }
    void put(int handle,int start,int end) {
        remove(handle);ranges.put(handle,new int[]{start,end});adjust(start,end,1);
    }
    void remove(int handle) {
        int[] range=ranges.remove(handle);if(range!=null)adjust(range[0],range[1],-1);
    }
    int covered() {return total;}
}
