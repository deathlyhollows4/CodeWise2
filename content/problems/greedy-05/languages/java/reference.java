class Solution {
    public String solve(int[] digits, int k) {
        int[] stack=new int[digits.length];
        int size=0;
        for(int digit:digits) {
            while(k>0 && size>0 && stack[size-1]>digit) {size--; k--;}
            stack[size++]=digit;
        }
        size-=k;
        int first=0;
        while(first<size && stack[first]==0) first++;
        if(first==size) return "0";
        StringBuilder answer=new StringBuilder();
        for(int i=first;i<size;i++) answer.append(stack[i]);
        return answer.toString();
    }
}
