class Solution:
    def solve(self, required, people):
        if not required: return 0
        dp=[100]*(1<<required.bit_length())
        dp[0]=0
        active=[0]
        for person in people:
            mask=person&required
            if not mask: continue
            for i in range(len(active)):
                state=active[i]
                next=state|mask
                cost=dp[state]+1
                if dp[next]==100: active.append(next)
                if cost<dp[next]: dp[next]=cost
        return -1 if dp[required]==100 else dp[required]
