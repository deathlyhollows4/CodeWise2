class Solution:
    def solve(self, first, second):
        a,b=first
        c,d=second
        def cross(a,b,c): return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
        def on(p,a,b): return min(a[0],b[0])<=p[0]<=max(a[0],b[0]) and min(a[1],b[1])<=p[1]<=max(a[1],b[1])
        p,q,r,s=cross(a,b,c),cross(a,b,d),cross(c,d,a),cross(c,d,b)
        if p==0 and on(c,a,b) or q==0 and on(d,a,b) or r==0 and on(a,c,d) or s==0 and on(b,c,d): return True
        return (p<0<q or q<0<p) and (r<0<s or s<0<r)
