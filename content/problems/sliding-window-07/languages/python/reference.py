class Solution:
    def solve(self, text, pattern):
        if not pattern:
            return []
        want=[0]*26
        have=[0]*26
        for character in pattern:
            want[ord(character)-97]+=1
        out=[]
        for right,character in enumerate(text):
            have[ord(character)-97]+=1
            if right>=len(pattern):
                have[ord(text[right-len(pattern)])-97]-=1
            if right>=len(pattern)-1 and have==want:
                out.append(right-len(pattern)+1)
        return out
