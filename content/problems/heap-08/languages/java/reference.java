class Solution {
 public long solve(int[] tasks,int cooldown){
  if(tasks.length==0)return 0;Map<Integer,Integer> counts=new HashMap<>();for(int t:tasks)counts.merge(t,1,Integer::sum);
  int maximum=0,ties=0;for(int n:counts.values()){if(n>maximum){maximum=n;ties=1;}else if(n==maximum)ties++;}
  return Math.max((long)tasks.length,(long)(maximum-1)*(cooldown+1L)+ties);
 }
}