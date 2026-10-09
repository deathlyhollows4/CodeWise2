class Solution:
    def solve(self, values):
        answer=mask=0
        for bit in range(30,-1,-1):
            mask |= 1<<bit
            prefixes={value&mask for value in values}
            candidate=answer | (1<<bit)
            if any((prefix^candidate) in prefixes for prefix in prefixes): answer=candidate
        return answer
