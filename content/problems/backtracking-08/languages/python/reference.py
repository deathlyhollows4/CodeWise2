class Solution:
    def solve(self, digits, target):
        if not digits:
            return []
        out=[]
        def visit(at,text,total,last):
            if at==len(digits):
                if total==target:
                    out.append(text)
                return
            for end in range(at+1,len(digits)+1):
                if end>at+1 and digits[at]=="0":
                    break
                word=digits[at:end]
                value=int(word)
                if at==0:
                    visit(end,word,value,value)
                else:
                    visit(end,text+"+"+word,total+value,value)
                    visit(end,text+"-"+word,total-value,-value)
                    visit(end,text+"*"+word,total-last+last*value,last*value)
        visit(0,"",0,0)
        return sorted(out)
