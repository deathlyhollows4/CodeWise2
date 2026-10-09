import json,sys

{{USER_CODE}}
for line in sys.stdin:
    input=json.loads(line)
    result=Solution().solve(input["costsA"],input["costsB"],input["switchCost"])
    print(json.dumps(result,separators=(",",":"),allow_nan=False))
