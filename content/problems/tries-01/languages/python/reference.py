class Solution:
    def solve(self, roots, words):
        trie={}
        for word in roots:
            node=trie
            for letter in word:
                node=node.setdefault(letter,{})
            node["#"]=True
        result=[]
        for word in words:
            node=trie
            replacement=word
            for index,letter in enumerate(word):
                node=node.get(letter)
                if node is None:
                    break
                if "#" in node:
                    replacement=word[:index+1]
                    break
            result.append(replacement)
        return result
