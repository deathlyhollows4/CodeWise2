class Solution:
    def solve(self, s):
        if not s:
            return 0
        previous, current = 1, int(s[0] != "0")
        for i in range(1, len(s)):
            following = current if s[i] != "0" else 0
            if 10 <= int(s[i-1:i+1]) <= 26:
                following = (following+previous)%1000000007
            previous, current = current, following
        return current
