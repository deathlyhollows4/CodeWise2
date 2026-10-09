export function validateInput(schema,input){
 if(schema.kind==='integer-array')return !!input && typeof input==='object'&&!Array.isArray(input)&&Object.keys(input).length===1&&Array.isArray(input[schema.field])&&input[schema.field].length>=schema.minLength&&input[schema.field].length<=schema.maxLength&&input[schema.field].every(x=>Number.isSafeInteger(x)&&x>=schema.minValue&&x<=schema.maxValue);
 let nodes=0;
 function visit(s,x,depth){
  if(++nodes>200000||depth>32)return false;
  switch(s.kind){
   case 'safe-integer':case 'integer':return Number.isSafeInteger(x)&&x>=(s.minimum??Number.MIN_SAFE_INTEGER)&&x<=(s.maximum??Number.MAX_SAFE_INTEGER);
   case 'number':return typeof x==='number'&&Number.isFinite(x)&&x>=(s.minimum??-Infinity)&&x<=(s.maximum??Infinity);
   case 'int64-string':return typeof x==='string'&&/^-?(0|[1-9][0-9]{0,18})$/.test(x)&&BigInt(x)>=-9223372036854775808n&&BigInt(x)<=9223372036854775807n;
   case 'string':return typeof x==='string'&&x.length>=(s.minLength??0)&&x.length<=(s.maxLength??100000)&&(!s.ascii||/^[\x00-\x7f]*$/.test(x));
   case 'boolean':return typeof x==='boolean';case 'null':return x===null;
   case 'enum':return Array.isArray(s.values)&&s.values.some(v=>v===x);
   case 'json':return x===null||typeof x==='boolean'||typeof x==='string'&&x.length<=100000||typeof x==='number'&&Number.isFinite(x)&&Number.isSafeInteger(x)||Array.isArray(x)&&x.length<=100000&&x.every(v=>visit(s,v,depth+1))||!!x&&typeof x==='object'&&!Array.isArray(x)&&Object.values(x).every(v=>visit(s,v,depth+1));
   case 'nullable':return x===null||visit(s.value,x,depth+1);
   case 'array':return Array.isArray(x)&&x.length>=(s.minLength??0)&&x.length<=(s.maxLength??100000)&&x.every(v=>visit(s.items,v,depth+1))&&(!s.rectangular||x.every(v=>Array.isArray(v)&&v.length===(x[0]?.length??0)));
   case 'object':return !!x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).every(k=>Object.hasOwn(s.properties,k))&&Object.keys(s.properties).every(k=>Object.hasOwn(x,k)&&visit(s.properties[k],x[k],depth+1));
   default:throw new Error('Unsupported input contract');
  }
 }
 try{return visit(schema,input,0);}catch{return false;}
}
