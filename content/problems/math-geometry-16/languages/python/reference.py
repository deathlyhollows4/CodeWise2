class Solution:
    def solve(self, point, line, offset):
        a,b={"vertical":(1,0),"horizontal":(0,1),"rising":(-1,1),"falling":(1,1)}[line]
        factor=2*(a*point[0]+b*point[1]-offset)//(a*a+b*b)
        return [point[0]-a*factor,point[1]-b*factor]
