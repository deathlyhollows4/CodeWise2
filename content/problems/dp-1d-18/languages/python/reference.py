class Solution:
    def solve(self, text):
        if not text:
            return 0
        pal = [False]*len(text)
        pieces = [len(text)+1]*(len(text)+1)
        pieces[0] = 0
        for end in range(len(text)):
            for left in range(end+1):
                pal[left] = text[left] == text[end] and (end-left < 2 or pal[left+1])
                if pal[left]:
                    pieces[end+1] = min(pieces[end+1], pieces[left]+1)
        return pieces[-1]-1
