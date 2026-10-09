class Solution:
    def solve(self, points):
        points=sorted(set(map(tuple,points)))
        if len(points)<2: return [list(p) for p in points]
        def cross(a,b,c): return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
        lower=[]
        for p in points:
            while len(lower)>1 and cross(lower[-2],lower[-1],p)<=0: lower.pop()
            lower.append(p)
        upper=[]
        for p in reversed(points):
            while len(upper)>1 and cross(upper[-2],upper[-1],p)<=0: upper.pop()
            upper.append(p)
        return [list(p) for p in lower[:-1]+upper[:-1]]
