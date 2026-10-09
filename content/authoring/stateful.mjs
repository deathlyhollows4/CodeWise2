// Static approved dispatch. Author-supplied method identifiers are validated before generation.
const safeName=s=>{if(typeof s!=='string'||!/^[A-Za-z][A-Za-z0-9_]*$/.test(s))throw new Error('Invalid static class/method identifier');return s;};
const cppTypes={int:'int',long:'long long',boolean:'bool',string:'string','int[]':'vector<int>','long[]':'vector<long long>','string[]':'vector<string>','int[][]':'vector<vector<int>>'};
const javaTypes={int:'int',long:'long',boolean:'boolean',string:'String','int[]':'int[]','long[]':'long[]','string[]':'String[]','int[][]':'int[][]'};
function cppArgs(args){return args.map((a,i)=>`operation.at("args").at(${i}).get<${cppTypes[a.type]}>()`).join(',');}
function javaArgs(args){return args.map((a,i)=>{const s=`operation.getAsJsonArray("args").get(${i})`;return a.type==='int'?`${s}.getAsInt()`:a.type==='long'?`${s}.getAsLong()`:a.type==='boolean'?`${s}.getAsBoolean()`:a.type==='string'?`${s}.getAsString()`:`gson.fromJson(${s},${javaTypes[a.type]}.class)`;}).join(',');}
export function buildStatefulHarness({className,constructorArguments=[],methods}){
 safeName(className);if(!methods||typeof methods!=='object'||!Object.keys(methods).length)throw new Error('Approved method map required');
 const checkArgs=args=>{if(!Array.isArray(args))throw new Error('Argument declarations required');for(const a of args)if(!cppTypes[a.type])throw new Error('Unsupported stateful argument type');};checkArgs(constructorArguments);
 for(const [name,method]of Object.entries(methods)){safeName(name);if(name==='constructor')throw new Error('Reserved constructor dispatch');checkArgs(method.arguments);if(method.returnType!=='void'&&!cppTypes[method.returnType])throw new Error('Unsupported stateful result type');}
 let cpp=`if(name=="constructor"){if(object)throw runtime_error("Repeated constructor");object=make_unique<${className}>(${cppArgs(constructorArguments)});out.push_back(nullptr);}`;
 let java=`if(name.equals("constructor")){if(object!=null)throw new IllegalArgumentException("Repeated constructor");object=new ${className}(${javaArgs(constructorArguments)});out.add(JsonNull.INSTANCE);}`;
 let python=`        if name == "constructor":\n            if obj is not None: raise ValueError("Repeated constructor")\n            obj=${className}(*operation["args"])\n            out.append(None)\n`;
 for(const [name,m]of Object.entries(methods)){
  const cppCall=`object->${name}(${cppArgs(m.arguments)})`,javaCall=`object.${name}(${javaArgs(m.arguments)})`;
  cpp+=`else if(name=="${name}"){if(!object)throw runtime_error("Constructor required");${m.returnType==='void'?cppCall+';out.push_back(nullptr);':'out.push_back(json('+cppCall+'));'}}`;
  java+=`else if(name.equals("${name}")){if(object==null)throw new IllegalArgumentException("Constructor required");${m.returnType==='void'?javaCall+';out.add(JsonNull.INSTANCE);':'out.add(gson.toJsonTree('+javaCall+'));'}}`;
  python+=`        elif name == "${name}":\n            if obj is None: raise ValueError("Constructor required")\n            ${m.returnType==='void'?`obj.${name}(*operation["args"])\n            out.append(None)`:`out.append(obj.${name}(*operation["args"]))`}\n`;
 }
 cpp+='else throw runtime_error("Unapproved operation");';java+='else throw new IllegalArgumentException("Unapproved operation");';python+='        else: raise ValueError("Unapproved operation")\n';
 return {
 cpp:'#include <bits/stdc++.h>\n#include <nlohmann/json.hpp>\nusing namespace std;using json=nlohmann::json;\n{{USER_CODE}}\nint main(){string line;while(getline(cin,line)){auto input=json::parse(line);unique_ptr<'+className+'> object;json out=json::array();for(auto operation:input.at("operations")){string name=operation.at("op").get<string>();'+cpp+'}cout<<out.dump()<<"\\n";}}\n',
 java:'import java.io.*;import java.util.*;import com.google.gson.*;\n{{USER_CODE}}\npublic class Main{public static void main(String[] args)throws Exception{Gson gson=new Gson();BufferedReader r=new BufferedReader(new InputStreamReader(System.in));String line;while((line=r.readLine())!=null){JsonObject input=JsonParser.parseString(line).getAsJsonObject();'+className+' object=null;JsonArray out=new JsonArray();for(JsonElement e:input.getAsJsonArray("operations")){JsonObject operation=e.getAsJsonObject();String name=operation.get("op").getAsString();'+java+'}System.out.println(gson.toJson(out));}}}\n',
 python:'import json,sys\n{{USER_CODE}}\nfor line in sys.stdin:\n    input=json.loads(line)\n    obj=None\n    out=[]\n    for operation in input["operations"]:\n        name=operation["op"]\n'+python+'    print(json.dumps(out,separators=(",",":"),allow_nan=False))\n'
 };
}
