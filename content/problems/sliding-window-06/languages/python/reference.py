class Solution:
    def solve(self, text, pattern):
        if not pattern:
            return ""
        need={}
        for character in pattern:
            need[character]=need.get(character,0)+1
        missing=len(pattern)
        left=start=0
        best=len(text)+1
        for right,character in enumerate(text):
            if need.get(character,0)>0:
                missing-=1
            need[character]=need.get(character,0)-1
            while missing==0:
                if right-left+1<best:
                    best=right-left+1;start=left
                old=text[left];left+=1
                need[old]=need.get(old,0)+1
                if need[old]>0:
                    missing+=1
        return "" if best>len(text) else text[start:start+best]
