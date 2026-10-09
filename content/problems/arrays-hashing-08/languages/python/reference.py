class Solution:
    def solve(self, words):
        groups={}
        for word in words:
            groups.setdefault("".join(sorted(word)),[]).append(word)
        return sorted((sorted(g) for g in groups.values()),key=lambda g:g[0])
