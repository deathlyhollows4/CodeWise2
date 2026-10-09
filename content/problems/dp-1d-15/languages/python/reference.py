class Solution:
    def solve(self, text, words):
        reachable = [False]*(len(text)+1)
        reachable[0] = True
        for i in range(len(text)):
            if reachable[i]:
                for word in words:
                    if text.startswith(word, i):
                        reachable[i+len(word)] = True
        return reachable[-1]
