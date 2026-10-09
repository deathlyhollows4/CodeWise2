class Solution:
    def solve(self, values, k, target):
        answers=[]
        path=[]
        def visit(start,needed,total):
            if needed==0:
                if total==target:
                    answers.append(list(path))
                return
            for index in range(start,len(values)-needed+1):
                path.append(index)
                visit(index+1,needed-1,total+values[index])
                path.pop()
        visit(0,k,0)
        return answers
