class Solution {
 public int[] solve(String[] commands,int[] ids,int[] priorities){
  PriorityQueue<int[]> q=new PriorityQueue<>((a,b)->a[0]!=b[0]?Integer.compare(b[0],a[0]):Integer.compare(a[1],b[1]));Map<Integer,Integer> active=new HashMap<>();ArrayList<Integer> out=new ArrayList<>();
  for(int i=0;i<commands.length;i++){int id=ids[i];if(commands[i].equals("add")){if(!active.containsKey(id)){active.put(id,i);q.offer(new int[]{priorities[i],i,id});}}else if(commands[i].equals("cancel"))active.remove(id);else{while(!q.isEmpty()&&(!active.containsKey(q.peek()[2])||active.get(q.peek()[2])!=q.peek()[1]))q.poll();if(q.isEmpty())out.add(-1);else{int chosen=q.poll()[2];active.remove(chosen);out.add(chosen);}}}
  return out.stream().mapToInt(Integer::intValue).toArray();
 }
}