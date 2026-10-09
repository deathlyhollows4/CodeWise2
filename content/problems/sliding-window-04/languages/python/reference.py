class Solution:
    def solve(self, text):
        last={}
        left=best=0
        for right,character in enumerate(text):
            left=max(left,last.get(character,-1)+1)
            last[character]=right
            best=max(best,right-left+1)
        return best
