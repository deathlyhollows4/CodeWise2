class Solution:
    def solve(self, tasks, cooldown):
        if not tasks: return 0
        counts={}
        for task in tasks: counts[task]=counts.get(task,0)+1
        maximum=max(counts.values())
        ties=sum(count==maximum for count in counts.values())
        return max(len(tasks),(maximum-1)*(cooldown+1)+ties)
