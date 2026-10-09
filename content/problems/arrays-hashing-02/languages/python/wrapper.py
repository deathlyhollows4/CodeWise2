import sys
{{USER_CODE}}
def main():
    it=iter(map(int,sys.stdin.buffer.read().split()))
    count=next(it)
    for _ in range(count):
        n=next(it)
        values=[next(it) for _ in range(n)]
        print(Solution().solve(values))
if __name__ == "__main__":
    main()
