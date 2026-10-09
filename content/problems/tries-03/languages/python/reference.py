class Solution:
    def solve(self, dictionary, queries):
        children, counts = [{}], [0]
        for word in dictionary:
            node = 0
            for letter in word:
                if letter not in children[node]:
                    children[node][letter] = len(children)
                    children.append({})
                    counts.append(0)
                node = children[node][letter]
                counts[node] += 1
        scores = []
        for query in queries:
            node, score = 0, 0
            for letter in query:
                following = children[node].get(letter)
                if following is None:
                    break
                node = following
                score += counts[node]
            scores.append(score)
        return scores
