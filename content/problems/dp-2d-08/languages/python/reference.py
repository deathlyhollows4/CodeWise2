class Solution:
    def solve(self, text, pattern):
        d = [False]*(len(text)+1)
        d[0] = True
        for token in pattern:
            if token == "*":
                for j in range(1, len(text)+1):
                    d[j] = d[j] or d[j-1]
            else:
                for j in range(len(text), 0, -1):
                    d[j] = d[j-1] and (token == "?" or token == text[j-1])
                d[0] = False
        return d[-1]
