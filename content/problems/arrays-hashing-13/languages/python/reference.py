class Solution:
    def solve(self, values):
        candidate=count=0
        for value in values:
            if count==0:
                candidate=value
            count+=1 if value==candidate else -1
        return [candidate] if values.count(candidate)*2>len(values) else []
