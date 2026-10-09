class Solution:
    def solve(self, a, b):
        a,b=abs(a),abs(b)
        while b: a,b=b,a%b
        return a
