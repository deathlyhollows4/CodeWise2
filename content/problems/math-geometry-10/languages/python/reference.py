class Solution:
    def solve(self, points):
        if len(points)<3: return True
        a=points[0]
        b=next((p for p in points if p!=a),None)
        if b is None: return True
        return all((b[0]-a[0])*(p[1]-a[1])==(b[1]-a[1])*(p[0]-a[0]) for p in points)
