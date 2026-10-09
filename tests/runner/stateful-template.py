import json,sys
# No learner code included; AST check only
for line in sys.stdin:
    input=json.loads(line)
    obj=None
    out=[]
    for operation in input["operations"]:
        name=operation["op"]
        if name == "constructor":
            if obj is not None: raise ValueError("Repeated constructor")
            obj=MinStack(*operation["args"])
            out.append(None)
        elif name == "push":
            if obj is None: raise ValueError("Constructor required")
            obj.push(*operation["args"])
            out.append(None)
        elif name == "getMin":
            if obj is None: raise ValueError("Constructor required")
            out.append(obj.getMin(*operation["args"]))
        else: raise ValueError("Unapproved operation")
    print(json.dumps(out,separators=(",",":"),allow_nan=False))
