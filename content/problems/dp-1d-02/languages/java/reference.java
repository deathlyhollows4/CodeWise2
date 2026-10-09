class Solution {
    public long solve(int[] costsA, int[] costsB, int switchCost) {
        long a=0,b=0;
        for(int day=0;day<costsA.length;day++) {
            long nextA=Math.min(a,b+switchCost)+costsA[day];
            long nextB=Math.min(b,a+switchCost)+costsB[day];
            a=nextA; b=nextB;
        }
        return Math.min(a,b);
    }
}
