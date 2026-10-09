class Solution:
    def solve(self, jobs):
        used = [False]*2001
        total = 0
        for deadline, reward in sorted(jobs, key=lambda job: -job[1]):
            for time in range(deadline, 0, -1):
                if not used[time]:
                    used[time] = True
                    total += reward
                    break
        return total
