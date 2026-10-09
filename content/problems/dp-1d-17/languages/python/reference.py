class Solution:
    def solve(self, text):
        pal = [False]*len(text)
        count = 0
        for end in range(len(text)):
            for left in range(end+1):
                pal[left] = text[left] == text[end] and (end-left < 2 or pal[left+1])
                if pal[left]:
                    count += 1
        return count
