class Solution:
    def solve(self, values):
        mixed=0
        for value in values:
            mixed^=value
        mask=mixed&-mixed
        a=b=0
        for value in values:
            if value&mask:
                a^=value
            else:
                b^=value
        return sorted([a,b])
