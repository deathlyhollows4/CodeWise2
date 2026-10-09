class Solution:
    def solve(self, data):
        a,b=data.heads
        x=y=0
        p=a
        while p is not None:
            x+=1
            p=p.next
        p=b
        while p is not None:
            y+=1
            p=p.next
        while x>y:
            a=a.next
            x-=1
        while y>x:
            b=b.next
            y-=1
        while a is not b:
            a=a.next
            b=b.next
        return a
