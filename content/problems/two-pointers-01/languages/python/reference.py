class Solution:
    def solve(self, text):
        out=list(text)
        left,right=0,len(out)-1
        while left<right:
            out[left],out[right]=out[right],out[left]
            left+=1
            right-=1
        return "".join(out)
