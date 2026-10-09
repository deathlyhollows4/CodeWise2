class Solution {
 public long solve(int[] values){
  PriorityQueue<Long> q=new PriorityQueue<>(Comparator.reverseOrder());long minimum=Long.MAX_VALUE,best=Long.MAX_VALUE;
  for(int v:values){long x=v%2==1?2L*v:v;q.offer(x);minimum=Math.min(minimum,x);}
  while(true){long maximum=q.poll();best=Math.min(best,maximum-minimum);if(maximum%2==1)break;long half=maximum/2;minimum=Math.min(minimum,half);q.offer(half);}
  return best;
 }
}