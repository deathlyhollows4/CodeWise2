class Solution {
    int[] tree;
    int query(int k) {int result=0; for(; k>0; k-=k&-k) result+=tree[k]; return result;}
    void add(int k,int count) {for(; k<tree.length; k+=k&-k) tree[k]+=count;}
    public int[] solve(int[][] intervals) {
        int n=intervals.length; TreeSet<Integer> keys=new TreeSet<>(); for(int[] p:intervals)keys.add(p[1]);
        HashMap<Integer,Integer> rank=new HashMap<>(); int next=1; for(int key:keys)rank.put(key,next++); tree=new int[next];
        Integer[] order=new Integer[n]; for(int i=0;i<n;i++)order[i]=i;
        Arrays.sort(order,(a,b)->{int c=Integer.compare(intervals[a][0],intervals[b][0]);return c!=0?c:Integer.compare(intervals[b][1],intervals[a][1]);});
        int[] result=new int[n]; int seen=0;
        for(int i=0;i<n;) {int j=i+1; int[] p=intervals[order[i]];
            while(j<n && intervals[order[j]][0]==p[0] && intervals[order[j]][1]==p[1])j++;
            int count=seen-query(rank.get(p[1])-1)+(j-i)-1;
            for(int x=i;x<j;x++)result[order[x]]=count;
            add(rank.get(p[1]),j-i);seen+=j-i;i=j;
        } return result;
    }
}
