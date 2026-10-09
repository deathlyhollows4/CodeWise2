class Solution:
    def solve(self, n):
        answer=0
        while n:
            n//=5
            answer+=n
        return answer
