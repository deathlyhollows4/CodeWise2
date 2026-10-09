class Solution:
    def solve(self, words, pattern):
        trie={}
        for word in words:
            node=trie
            for letter in word:
                node=node.setdefault(letter,{})
            node["#"]=True
        stack=[(trie,0)]
        while stack:
            node,at=stack.pop()
            if at==len(pattern):
                if "#" in node:
                    return True
                continue
            letter=pattern[at]
            if letter=="?":
                for key,child in node.items():
                    if key!="#":
                        stack.append((child,at+1))
            elif letter in node:
                stack.append((node[letter],at+1))
        return False
