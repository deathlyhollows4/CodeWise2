// Trusted build-time templates: fixed argument names/types, never browser code generation.
// JSON parser dependencies are installed inside the isolated distro, not submitted as extra files.
import {
  pythonStructures,
  cppStructures,
  javaStructures,
} from "./structures.mjs";
const types = {
  int: { cpp: "int", java: "int" },
  long: { cpp: "long long", java: "long" },
  boolean: { cpp: "bool", java: "boolean" },
  string: { cpp: "string", java: "String" },
  "int[]": { cpp: "vector<int>", java: "int[]" },
  "long[]": { cpp: "vector<long long>", java: "long[]" },
  "string[]": { cpp: "vector<string>", java: "String[]" },
  "int[][]": { cpp: "vector<vector<int>>", java: "int[][]" },
  "string[][]": { cpp: "vector<vector<string>>", java: "String[][]" },
  json: { cpp: "json", java: "JsonElement" },
};
const name = (x) => {
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(x))
    throw new Error("Invalid trusted harness identifier");
  return x;
};
Object.assign(types, {
  ListNode: { cpp: "ListNode*", java: "ListNode" },
  TreeNode: { cpp: "TreeNode*", java: "TreeNode" },
  GraphNode: { cpp: "GraphNode*", java: "GraphNode" },
  IdentityList: { cpp: "IdentityList", java: "IdentityList" },
  IdentityTree: { cpp: "IdentityTree", java: "IdentityTree" },
  MultiListNode: { cpp: "MultiListNode*", java: "MultiListNode" },
  MultiListNodeIdentitySequence: { cpp: "MultiListNode*", java: "MultiListNode" },
  ListNodeIdentity: { cpp: "ListNode*", java: "ListNode" },
  ListNodeIdentitySequence: { cpp: "ListNode*", java: "ListNode" },
  ListNodeIdentityParts: { cpp: "vector<ListNode*>", java: "ListNode[]" },
  TreeNodeIdentity: { cpp: "TreeNode*", java: "TreeNode" },
  CloneList: { cpp: "ListNode*", java: "ListNode" },
  CloneGraph: { cpp: "GraphNode*", java: "GraphNode" },
});
const builders = {
  ListNode: "list",
  TreeNode: "tree",
  GraphNode: "graph",
  IdentityList: "identity_list",
  IdentityTree: "identity_tree",
  MultiListNode: "multi_list",
};
const serializers = {
  ListNode: "list_values",
  TreeNode: "tree_values",
  ListNodeIdentity: "list_identity",
  ListNodeIdentitySequence: "list_identity_sequence",
  ListNodeIdentityParts: "list_identity_parts",
  MultiListNodeIdentitySequence: "multi_identity_sequence",
  TreeNodeIdentity: "tree_identity",
  CloneList: "clone_list",
  CloneGraph: "clone_graph",
};
const cleanups = {
  ListNode: "list_cleanup",
  TreeNode: "tree_cleanup",
  CloneList: "list_cleanup",
  CloneGraph: "graph_cleanup",
};
export function buildFunctionHarness({
  method = "solve",
  arguments: args,
  returnType = "json",
  readOnlyNodes = false,
}) {
  name(method);
  if (!types[returnType]) throw new Error("Unsupported return type");
  if (typeof readOnlyNodes !== "boolean")
    throw new Error("Invalid read-only node policy");
  if (readOnlyNodes && !args.some((a) => builders[a.type]))
    throw new Error("Read-only node policy requires structured input");
  if (["GraphNode", "IdentityList", "IdentityTree", "MultiListNode"].includes(returnType))
    throw new Error("Use an explicit structure/clone output serializer");
  for (const a of args) {
    name(a.name);
    if (
      !types[a.type] ||
      [
        "ListNodeIdentity",
        "ListNodeIdentitySequence",
        "ListNodeIdentityParts",
        "MultiListNodeIdentitySequence",
        "TreeNodeIdentity",
        "CloneList",
        "CloneGraph",
      ].includes(a.type)
    )
      throw new Error("Unsupported argument type");
  }
  const cppExpressions = args.map((a) =>
    builders[a.type]
      ? `cw.${builders[a.type]}(input.at("${a.name}"))`
      : a.type === "json"
        ? `input.at("${a.name}")`
        : `input.at("${a.name}").get<${types[a.type].cpp}>()`,
  );
  const javaExpressions = args.map((a) => {
    const x = `input.getAsJsonObject().get("${a.name}")`;
    return builders[a.type]
      ? `cw.${builders[a.type]}(${x})`
      : a.type === "json"
        ? x
        : a.type === "long"
          ? `${x}.getAsLong()`
          : a.type === "int"
            ? `${x}.getAsInt()`
            : a.type === "boolean"
              ? `${x}.getAsBoolean()`
              : a.type === "string"
                ? `${x}.getAsString()`
                : `gson.fromJson(${x}, ${types[a.type].java}.class)`;
  });
  const pyExpressions = args.map((a) =>
    builders[a.type]
      ? `cw.${builders[a.type]}(input["${a.name}"])`
      : `input["${a.name}"]`,
  );
  const cppArgs = cppExpressions.join(","),
    javaArgs = javaExpressions.join(","),
    pyArgs = pyExpressions.join(",");
  const structured =
    args.some((a) => builders[a.type]) || !!serializers[returnType];
  const expression = serializers[returnType]
    ? `cw.${serializers[returnType]}(result)`
    : "result";
  if (readOnlyNodes || ['ListNodeIdentitySequence','ListNodeIdentityParts','MultiListNodeIdentitySequence'].includes(returnType)) {
    const integrity=readOnlyNodes?'check_inputs':'check_input_values';
    const locals = args.map((_, i) => "cwArgument" + i),
      call = locals.join(",");
    return {
      cpp:
        "#include <bits/stdc++.h>\n#include <nlohmann/json.hpp>\nusing namespace std; using json=nlohmann::json;\n" +
        cppStructures +
        "\n{{USER_CODE}}\nint main(){ios::sync_with_stdio(false);cin.tie(nullptr);string line;while(getline(cin,line)){json input=json::parse(line);CwContext cw;" +
        cppExpressions.map((e, i) => `auto ${locals[i]}=${e};`).join("") +
        "cw.snapshot_inputs();auto result=Solution()." +
        method +
        "(" +
        call +
        ");cw."+integrity+"();cout<<json(" +
        expression +
        ').dump()<<"\\n";' +
        (cleanups[returnType] ? `cw.${cleanups[returnType]}(result);` : "") +
        "}}\n",
      java:
        "import java.io.*; import java.util.*; import com.google.gson.*;\n" +
        javaStructures +
        "\n{{USER_CODE}}\npublic class Main{public static void main(String[] args)throws Exception{Gson gson=new GsonBuilder().serializeNulls().create();BufferedReader reader=new BufferedReader(new InputStreamReader(System.in));String line;while((line=reader.readLine())!=null){JsonElement input=JsonParser.parseString(line);CwContext cw=new CwContext();" +
        javaExpressions
          .map((e, i) => `${types[args[i].type].java} ${locals[i]}=${e};`)
          .join("") +
        "cw.snapshot_inputs();" +
        types[returnType].java +
        " result=new Solution()." +
        method +
        "(" +
        call +
        ");cw."+integrity+"();System.out.println(gson.toJson(" +
        expression +
        "));}}}\n",
      python:
        "import json,sys\n" +
        pythonStructures +
        "\n{{USER_CODE}}\nfor line in sys.stdin:\n    input=json.loads(line)\n    cw=CwContext()\n" +
        pyExpressions.map((e, i) => `    ${locals[i]}=${e}\n`).join("") +
        "    cw.snapshot_inputs()\n    result=Solution()." +
        method +
        "(" +
        call +
        ")\n    cw."+integrity+"()\n    print(json.dumps(" +
        expression +
        ',separators=(",",":"),allow_nan=False))\n',
    };
  }
  return {
    cpp:
      "#include <bits/stdc++.h>\n#include <nlohmann/json.hpp>\nusing namespace std; using json=nlohmann::json;\n" +
      (structured ? cppStructures : "") +
      "\n{{USER_CODE}}\nint main(){ios::sync_with_stdio(false);cin.tie(nullptr);string line;while(getline(cin,line)){json input=json::parse(line);" +
      (structured ? "CwContext cw;" : "") +
      "auto result=Solution()." +
      method +
      "(" +
      cppArgs +
      ");cout<<json(" +
      expression +
      ').dump()<<"\\n";' +
      (cleanups[returnType] ? `cw.${cleanups[returnType]}(result);` : "") +
      "}}\n",
    java:
      "import java.io.*; import java.util.*; import com.google.gson.*;\n" +
      (structured ? javaStructures : "") +
      "\n{{USER_CODE}}\npublic class Main{public static void main(String[] args)throws Exception{Gson gson=new GsonBuilder().serializeNulls().create();BufferedReader reader=new BufferedReader(new InputStreamReader(System.in));String line;while((line=reader.readLine())!=null){JsonElement input=JsonParser.parseString(line);" +
      (structured ? "CwContext cw=new CwContext();" : "") +
      "System.out.println(gson.toJson(" +
      (serializers[returnType] ? `cw.${serializers[returnType]}(` : "") +
      "new Solution()." +
      method +
      "(" +
      javaArgs +
      ")" +
      (serializers[returnType] ? ")" : "") +
      "));}}}\n",
    python:
      "import json,sys\n" +
      (structured ? pythonStructures : "") +
      "\n{{USER_CODE}}\nfor line in sys.stdin:\n    input=json.loads(line)\n" +
      (structured ? "    cw=CwContext()\n" : "") +
      "    result=Solution()." +
      method +
      "(" +
      pyArgs +
      ")\n    print(json.dumps(" +
      expression +
      ',separators=(",",":"),allow_nan=False))\n',
  };
}
export const supportedFunctionTypes = Object.keys(types);
export function buildFunctionStarters({
  method = "solve",
  arguments: args,
  returnType = "json",
}) {
  name(method);
  for (const a of args) name(a.name);
  const cppType = types[returnType]?.cpp,
    javaType = types[returnType]?.java;
  if (!cppType || !javaType) throw new Error("Unknown starter return type");
  const cppDefault = cppType.endsWith("*")
    ? "nullptr"
    : returnType === "boolean"
      ? "false"
      : returnType === "string"
        ? '""'
        : cppType.startsWith("vector")
          ? "{}"
          : returnType === "json"
            ? "json(nullptr)"
            : "0";
  const javaDefault = [
    "ListNode",
    "TreeNode",
    "GraphNode",
    "IdentityList",
    "ListNodeIdentity",
    "ListNodeIdentitySequence",
    "ListNodeIdentityParts",
    "MultiListNodeIdentitySequence",
    "TreeNodeIdentity",
    "CloneList",
    "CloneGraph",
    "json",
  ].includes(returnType)
    ? "null"
    : returnType === "boolean"
      ? "false"
      : returnType === "string"
        ? '""'
        : returnType === "long"
          ? "0L"
          : javaType.endsWith("[][]")
            ? `new ${javaType.slice(0, -4)}[0][]`
            : javaType.endsWith("[]")
              ? `new ${javaType.slice(0, -2)}[0]`
              : "0";
  return {
    cpp: `class Solution {\npublic:\n    ${cppType} ${method}(${args.map((a) => types[a.type].cpp + " " + a.name).join(", ")}) {\n        // Write your solution here.\n        return ${cppDefault};\n    }\n};\n`,
    java: `class Solution {\n    public ${javaType} ${method}(${args.map((a) => types[a.type].java + " " + a.name).join(", ")}) {\n        // Write your solution here.\n        return ${javaDefault};\n    }\n}\n`,
    python: `class Solution:\n    def ${method}(self${args.length ? ", " : ""}${args.map((a) => a.name).join(", ")}):\n        # Write your solution here.\n        return None\n`,
  };
}
