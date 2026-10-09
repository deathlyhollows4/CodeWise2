class Solution {
    public int[] solve(int[][] feeds) {
        PriorityQueue<int[]> queue=new PriorityQueue<>((a,b)->Integer.compare(a[0],b[0]));
        int maximum=Integer.MIN_VALUE;
        for(int id=0;id<feeds.length;id++){if(feeds[id].length==0)return new int[0];queue.offer(new int[]{feeds[id][0],id,0});maximum=Math.max(maximum,feeds[id][0]);}
        int bestLeft=0,bestRight=0;long bestWidth=Long.MAX_VALUE;
        while(true){int[] event=queue.poll();long width=(long)maximum-event[0];
            if(width<bestWidth || width==bestWidth && event[0]<bestLeft){bestWidth=width;bestLeft=event[0];bestRight=maximum;}
            int next=event[2]+1;if(next==feeds[event[1]].length)break;int value=feeds[event[1]][next];
            maximum=Math.max(maximum,value);queue.offer(new int[]{value,event[1],next});
        }return new int[]{bestLeft,bestRight};
    }
}
