class Solution:
    def solve(self, digits, length, target):
        choices=sorted(set(digits))
        answers=[]
        path=[]
        def visit(remaining,total):
            if remaining==0:
                if total==target:
                    answers.append("".join(path))
                return
            if total>target:
                return
            for value in choices:
                path.append(str(value))
                visit(remaining-1,total+value)
                path.pop()
        visit(length,0)
        return answers
