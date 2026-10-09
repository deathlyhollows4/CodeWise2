class Solution {
    public long solve(int[] costs,int k,int candidates){
        Comparator<int[]> order=(x,y)->{int c=Integer.compare(x[0],y[0]);return c!=0?c:Integer.compare(x[1],y[1]);};
        PriorityQueue<int[]> left=new PriorityQueue<>(order),right=new PriorityQueue<>(order);int a=0,b=costs.length-1;long total=0;
        for(int i=0;i<candidates&&a<=b;i++,a++)left.offer(new int[]{costs[a],a});
        for(int i=0;i<candidates&&a<=b;i++,b--)right.offer(new int[]{costs[b],b});
        for(int hired=0;hired<k;hired++){boolean fromLeft=right.isEmpty()||!left.isEmpty()&&order.compare(left.peek(),right.peek())<=0;
            total+=(fromLeft?left:right).poll()[0];if(a<=b){if(fromLeft){left.offer(new int[]{costs[a],a});a++;}else{right.offer(new int[]{costs[b],b});b--;}}
        }return total;
    }
}
