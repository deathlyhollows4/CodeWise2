class Solution {
 public int[] solve(int[] values,int k){
  Map<Integer,Integer> counts=new HashMap<>();for(int v:values)counts.merge(v,1,Integer::sum);
  Comparator<int[]> worst=(a,b)->a[1]!=b[1]?Integer.compare(a[1],b[1]):Integer.compare(b[0],a[0]);
  PriorityQueue<int[]> q=new PriorityQueue<>(worst);
  for(Map.Entry<Integer,Integer> e:counts.entrySet()){q.offer(new int[]{e.getKey(),e.getValue()});if(q.size()>k)q.poll();}
  int[] out=new int[q.size()];for(int i=out.length-1;i>=0;i--)out[i]=q.poll()[0];return out;
 }
}