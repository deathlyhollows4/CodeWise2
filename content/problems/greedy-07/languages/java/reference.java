class Solution {
    public String solve(String text) {
        int[] last=new int[26];
        for(int i=0;i<text.length();i++) last[text.charAt(i)-'a']=i;
        boolean[] used=new boolean[26];
        StringBuilder stack=new StringBuilder();
        for(int i=0;i<text.length();i++) {
            char c=text.charAt(i);
            if(used[c-'a']) continue;
            while(stack.length()>0 && stack.charAt(stack.length()-1)>c && last[stack.charAt(stack.length()-1)-'a']>i) {
                used[stack.charAt(stack.length()-1)-'a']=false;
                stack.setLength(stack.length()-1);
            }
            stack.append(c); used[c-'a']=true;
        }
        return stack.toString();
    }
}
