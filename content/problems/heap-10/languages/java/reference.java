class Solution {
    public int[][] solve(int[][] buildings) {
        Arrays.sort(buildings,(a,b)->Integer.compare(a[0],b[0]));TreeSet<Integer> coordinates=new TreeSet<>();for(int[] b:buildings){coordinates.add(b[0]);coordinates.add(b[1]);}
        PriorityQueue<int[]> active=new PriorityQueue<>((a,b)->Integer.compare(b[0],a[0]));ArrayList<int[]> result=new ArrayList<>();int index=0,previous=0;
        for(int x:coordinates){while(index<buildings.length&&buildings[index][0]<=x){active.offer(new int[]{buildings[index][2],buildings[index][1]});index++;}
            while(!active.isEmpty()&&active.peek()[1]<=x)active.poll();int height=active.isEmpty()?0:active.peek()[0];
            if(height!=previous){result.add(new int[]{x,height});previous=height;}
        }return result.toArray(new int[0][]);
    }
}
