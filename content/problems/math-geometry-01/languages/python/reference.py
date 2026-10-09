class Solution:
    def solve(self, value):
        n=abs(value)
        answer=0
        while n:
            answer=answer*10+n%10
            n//=10
        if value<0: answer=-answer
        return answer if -(1<<31)<=answer<(1<<31) else 0
