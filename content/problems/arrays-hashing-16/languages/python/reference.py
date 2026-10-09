class Solution:
    def solve(self, values):
        first={0:-1}
        diff=best=0
        for i,value in enumerate(values):
            diff+=1 if value else -1
            if diff in first:
                best=max(best,i-first[diff])
            else:
                first[diff]=i
        return best
