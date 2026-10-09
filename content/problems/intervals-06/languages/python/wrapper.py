import json,sys
{{USER_CODE}}
for line in sys.stdin:
    input=json.loads(line)
    obj=None
    out=[]
    for operation in input["operations"]:
        name=operation["op"]
        if name == "constructor":
            if obj is not None: raise ValueError("Repeated constructor")
            obj=CoverageSet(*operation["args"])
            out.append(None)
        elif name == "put":
            if obj is None: raise ValueError("Constructor required")
            obj.put(*operation["args"])
            out.append(None)
        elif name == "remove":
            if obj is None: raise ValueError("Constructor required")
            obj.remove(*operation["args"])
            out.append(None)
        elif name == "covered":
            if obj is None: raise ValueError("Constructor required")
            out.append(obj.covered(*operation["args"]))
        else: raise ValueError("Unapproved operation")
    print(json.dumps(out,separators=(",",":"),allow_nan=False))
