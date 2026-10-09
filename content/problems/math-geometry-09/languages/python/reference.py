class Solution:
    def solve(self, corners):
        a,b=corners
        return abs(a[0]-b[0])*abs(a[1]-b[1])
