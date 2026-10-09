class Solution {
    public int[] solve(int[] weights,int[] durations){
        PriorityQueue<Integer> free=new PriorityQueue<>((a,b)->{int c=Integer.compare(weights[a],weights[b]);return c!=0?c:Integer.compare(a,b);});
        PriorityQueue<long[]> busy=new PriorityQueue<>((a,b)->{int c=Long.compare(a[0],b[0]);return c!=0?c:Long.compare(a[1],b[1]);});
        for(int i=0;i<weights.length;i++)free.offer(i);int[] result=new int[durations.length];long time=0;
        for(int job=0;job<durations.length;job++){time=Math.max(time,job);while(!busy.isEmpty()&&busy.peek()[0]<=time)free.offer((int)busy.poll()[1]);
            if(free.isEmpty()){time=busy.peek()[0];while(!busy.isEmpty()&&busy.peek()[0]<=time)free.offer((int)busy.poll()[1]);}
            int id=free.poll();result[job]=id;busy.offer(new long[]{time+durations[job],id});
        }return result;
    }
}
