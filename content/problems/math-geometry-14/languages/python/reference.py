class Solution:
    def solve(self, rectangles):
        xs=sorted({x for r in rectangles for x in (r[0],r[2])})
        total=0
        for left,right in zip(xs,xs[1:]):
            intervals=sorted((r[1],r[3]) for r in rectangles if r[0]<=left and r[2]>=right)
            height=0
            end=-10**30
            for a,b in intervals:
                if b<=end: continue
                height+=b-max(a,end)
                end=b
            total+=(right-left)*height
        return total
