class Solution:
    def solve(self, homepage, commands, pages, steps):
        class Entry:
            def __init__(self,page):
                self.page=page
                self.prev=self.next=None
        current=Entry(homepage)
        out=[]
        for command,page,count in zip(commands,pages,steps):
            if command=="visit":
                node=Entry(page)
                node.prev=current
                current.next=node
                current=node
            else:
                side="prev" if command=="back" else "next"
                while count>0 and getattr(current,side) is not None:
                    current=getattr(current,side)
                    count-=1
            out.append(current.page)
        return out
