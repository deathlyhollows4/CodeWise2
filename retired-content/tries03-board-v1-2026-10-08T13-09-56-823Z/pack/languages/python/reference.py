class Solution:
    def solve(self, board, words):
        if not board:
            return []
        trie={}
        for word in words:
            node=trie
            for letter in word:
                node=node.setdefault(letter,{})
            node["#"]=word
        rows,columns=len(board),len(board[0])
        found=set()
        def visit(r,c,node,used):
            bit=1<<(r*columns+c)
            if used&bit:
                return
            child=node.get(board[r][c])
            if child is None:
                return
            if "#" in child:
                found.add(child["#"])
            used|=bit
            if r:
                visit(r-1,c,child,used)
            if c:
                visit(r,c-1,child,used)
            if c+1<columns:
                visit(r,c+1,child,used)
            if r+1<rows:
                visit(r+1,c,child,used)
        for r in range(rows):
            for c in range(columns):
                visit(r,c,trie,0)
        return sorted(found)
