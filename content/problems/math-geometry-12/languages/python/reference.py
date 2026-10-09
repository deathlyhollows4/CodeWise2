class Solution:
    def solve(self, polygon, point):
        x,y=point
        inside=False
        for i,a in enumerate(polygon):
            b=polygon[(i+1)%len(polygon)]
            cross=(b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0])
            if cross==0 and min(a[0],b[0])<=x<=max(a[0],b[0]) and min(a[1],b[1])<=y<=max(a[1],b[1]): return True
            if (a[1]>y)!=(b[1]>y):
                left=(b[0]-a[0])*(y-a[1])
                right=(x-a[0])*(b[1]-a[1])
                if left>right if b[1]>a[1] else left<right: inside=not inside
        return inside
