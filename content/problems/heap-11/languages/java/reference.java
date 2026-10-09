class Solution {
 public long solve(int[] capital,int[] profits,long initial,int k){
  int n=capital.length;Integer[] order=new Integer[n];for(int i=0;i<n;i++)order[i]=i;Arrays.sort(order,(a,b)->Integer.compare(capital[a],capital[b]));
  PriorityQueue<Integer> available=new PriorityQueue<>(Comparator.reverseOrder());long wealth=initial;int j=0;
  for(int step=0;step<k;step++){while(j<n&&capital[order[j]]<=wealth)available.offer(profits[order[j++]]);if(available.isEmpty())break;wealth+=available.poll();}
  return wealth;
 }
}