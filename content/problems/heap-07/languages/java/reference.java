class Solution {
 public long[] solve(int[] values){
  PriorityQueue<Integer> lo=new PriorityQueue<>(Comparator.reverseOrder()),hi=new PriorityQueue<>();long[] out=new long[values.length];
  for(int i=0;i<values.length;i++){int v=values[i];if(lo.isEmpty()||v<=lo.peek())lo.offer(v);else hi.offer(v);
   if(lo.size()>hi.size()+1)hi.offer(lo.poll());if(hi.size()>lo.size())lo.offer(hi.poll());
   out[i]=lo.size()==hi.size()?(long)lo.peek()+hi.peek():2L*lo.peek();
  }return out;
 }
}