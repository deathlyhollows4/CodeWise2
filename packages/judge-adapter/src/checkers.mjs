const canonical=x=>JSON.stringify(sortObject(x));
import {customCheck} from './custom-checkers.mjs';
function sortObject(x){if(Array.isArray(x))return x.map(sortObject);if(x&&typeof x==='object')return Object.fromEntries(Object.keys(x).sort().map(k=>[k,sortObject(x[k])]));return x;}
function finiteTree(x){if(typeof x==='number')return Number.isFinite(x);if(Array.isArray(x))return x.every(finiteTree);if(x&&typeof x==='object')return Object.values(x).every(finiteTree);return true;}
export function checkOutput(checker,expected,actual,context={}){
 if(!finiteTree(actual))return false;
 switch(checker.kind){
  case 'exact':case 'sequence':return canonical(expected)===canonical(actual);
  case 'set':return Array.isArray(expected)&&Array.isArray(actual)&&canonical([...new Set(expected.map(canonical))].sort())===canonical([...new Set(actual.map(canonical))].sort());
  case 'multiset':return Array.isArray(expected)&&Array.isArray(actual)&&canonical(expected.map(canonical).sort())===canonical(actual.map(canonical).sort());
  case 'numeric':return typeof actual==='number'&&typeof expected==='number'&&Math.abs(actual-expected)<=Math.max(checker.absoluteTolerance??0,(checker.relativeTolerance??0)*Math.abs(expected));
  case 'custom':return customCheck(checker.name,context.input,actual);
  default:throw new Error('Unsupported reviewed checker');
 }
}
