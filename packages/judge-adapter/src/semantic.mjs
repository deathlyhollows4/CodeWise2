import {validateEdgeRows} from './edge-contracts.mjs';
// Reviewed declarative validators. Never imports generators or evaluates pack code.
import { validateInput } from "./schema-validator.mjs";
import {simplePolygon} from './geometry.mjs';
import {strictBst,compatibleTraversals,identityTreeInput} from './tree-contracts.mjs';
import {multilevelInput} from './multilevel-contract.mjs';
export function validateSemantics(rules, input) {
  if (!Array.isArray(rules)) return false;
  for (const r of rules) {
    const value = input[r.field];
    switch (r.kind) {
      case 'weighted-edges':
      case 'capacity-edges':
        if(!validateEdgeRows(r,input))return false;
        break;
      case 'sorted-rows':{
        if(!Array.isArray(value)||value.length>2000)return false;let cells=0;
        for(const row of value){if(!Array.isArray(row)||(cells+=row.length)>100000||row.some((v,i)=>!Number.isSafeInteger(v)||(i>0&&row[i-1]>v)))return false;}
        break;
      }
      case 'skyline-building-rows':
        if(!Array.isArray(value)||value.length>30000||value.some(row=>!Array.isArray(row)||row.length!==3||row.some(v=>!Number.isSafeInteger(v)||Math.abs(v)>1000000000)||row[0]>=row[1]||row[2]<=0))return false;
        break;
      case "weighted-interval-rows":
        if(!Array.isArray(value)||value.length>49999||value.some(row=>!Array.isArray(row)||row.length!==3||row.some(v=>!Number.isSafeInteger(v)||Math.abs(v)>1000000000)||row[0]>row[1]))return false;
        break;
      case "disjoint-closed-pairs":
        if(!Array.isArray(value)||value.some((p,i)=>!Array.isArray(p)||p.length!==2||!p.every(Number.isSafeInteger)||p[0]>p[1]||(i>0&&value[i-1][1]>=p[0])))return false;
        break;
      case 'rectangular-strings': {
        if(!Array.isArray(value)||![r.minColumns,r.maxColumns,r.maxRows].every(Number.isInteger)||r.minColumns<0||r.maxColumns<r.minColumns||r.maxRows<0||value.length>r.maxRows||value.some(row=>typeof row!=='string'))return false;
        if(value.length){const columns=value[0].length;if(columns<r.minColumns||columns>r.maxColumns||value.some(row=>row.length!==columns))return false;}
        break;
      }
      case 'multilevel-list':
        if(!multilevelInput(value,r.maxNodes))return false;
        break;
      case 'identity-tree':
        if(!identityTreeInput(value,r.maxNodes,r.targetCount))return false;
        break;
      case 'strict-bst':
        if(!strictBst(value))return false;
        break;
      case 'tree-traversal-pair':
        if(!compatibleTraversals(input[r.preorder],input[r.inorder],r.maxNodes))return false;
        break;
      case "ordered-rectangles":
        if(!Array.isArray(value)||value.some(row=>!Array.isArray(row)||row.length!==4||row[0]>row[2]||row[1]>row[3]))return false;
        break;
      case "simple-polygon":
        if(!simplePolygon(value))return false;
        break;
      case "nonzero-when":
        if(typeof r.whenField!=='string'||typeof r.equals!=='string'||!Number.isSafeInteger(value)||(input[r.whenField]===r.equals&&value===0))return false;
        break;
      case "combined-length": {
        if(!Array.isArray(r.fields)||r.fields.length<1||r.fields.length>16||r.fields.some(field=>typeof field!=='string'||!Array.isArray(input[field]))||!Number.isInteger(r.minimum)||!Number.isInteger(r.maximum))return false;
        const total=r.fields.reduce((sum,field)=>sum+input[field].length,0);if(total<r.minimum||total>r.maximum)return false;
        break;
      }
      case "field-product-bound": {
        const left=input[r.left],right=input[r.right],product=left*right;
        if(!Number.isSafeInteger(value)||!Number.isSafeInteger(left)||!Number.isSafeInteger(right)||left<0||right<0||!Number.isSafeInteger(product)||value>product)return false;
        break;
      }
      case "adjacent-distinct":
        if(!Array.isArray(value)||value.some((v,i)=>i>0&&v===value[i-1]))return false;
        break;
      case "matrix-sorted": {
        if(!Array.isArray(value)||value.some(row=>!Array.isArray(row)))return false;
        const columns=value[0]?.length??0;
        if(value.some(row=>row.length!==columns))return false;
        for(let row=0;row<value.length;row++)for(let col=0;col<columns;col++)if((col&&value[row][col]<value[row][col-1])||(row&&value[row][col]<value[row-1][col]))return false;
        break;
      }
      case "matrix-square":
        if(!Array.isArray(value)||value.some(row=>!Array.isArray(row)||row.length!==value.length))return false;
        break;
      case "sorted":
        if (
          !Array.isArray(value) ||
          !value.every((v, i) => i === 0 || v >= value[i - 1])
        )
          return false;
        break;
      case "rotated-sorted": {
        if (!Array.isArray(value)) return false;
        let descents = 0;
        for (let i = 0; i < value.length; i++)
          if (value[i] > value[(i + 1) % value.length]) descents++;
        if (descents > 1) return false;
        break;
      }
      case "unique":
        if (
          !Array.isArray(value) ||
          new Set(value.map((v) => JSON.stringify(v))).size !== value.length
        )
          return false;
        break;
      case "length-relative":
        if (
          !Array.isArray(input[r.array]) ||
          !Number.isInteger(value) ||
          value < (r.minimum ?? 0) ||
          value > input[r.array].length + (r.maxOffset ?? 0)
        )
          return false;
        break;
      case "range-by-length": {
        const bound=r.array===undefined?value:input[r.array];
        if (
          (r.array!==undefined&&typeof r.array!=='string')||!Array.isArray(bound)||
          !Array.isArray(value) ||
          !value.every(
            (v) =>
              Number.isInteger(v) &&
              v >= (r.minimum ?? 0) &&
                v <= bound.length + (r.maxOffset ?? 0),
          )
        )
          return false;
        break;
      }
      case "field-order":
        if (
          typeof input[r.lower] !== "number" ||
          typeof input[r.upper] !== "number" ||
          input[r.lower] > input[r.upper]
        )
          return false;
        break;
      case "lengths-equal":
        if (
          !(
            Array.isArray(input[r.left]) || typeof input[r.left] === "string"
          ) ||
          !(
            Array.isArray(input[r.right]) || typeof input[r.right] === "string"
          ) ||
          input[r.left].length !== input[r.right].length
        )
          return false;
        break;
      case "alphabet": {
        const allowed = {
          letters: /^[A-Za-z]*$/,
          lowercase: /^[a-z]*$/,
          'lowercase-wildcard': /^[a-z?]*$/,
          'parentheses-wildcard': /^[()?]*$/,
          digits: /^[0-9]*$/,
          brackets: /^[()[\]{}]*$/,
        }[r.alphabet];
        if (!allowed) return false;
        const words = r.each ? value : [value];
        if (
          !Array.isArray(words) ||
          !words.every((v) => typeof v === "string" && allowed.test(v))
        )
          return false;
        break;
      }
      case "sorted-pairs":
        if (
          !Array.isArray(value) ||
          !value.every(
            (v, i) =>
              Array.isArray(v) &&
              v.length === 2 &&
              (i === 0 || v[0] > value[i - 1][0]),
          )
        )
          return false;
        break;
      case "pair-ranges":
        if(r.ordered!==undefined&&typeof r.ordered!=="boolean")return false;
        if (
          !Array.isArray(value) ||
          !value.every(
            (v) =>
              Array.isArray(v) &&
              v.length === 2 &&
              v[0] >= r.firstMin &&
              v[0] <= r.firstMax &&
              v[1] >= r.secondMin &&
              v[1] <= r.secondMax &&
              (!r.ordered || v[0] <= v[1]),
          )
        )
          return false;
        break;
      case "postfix-bounded": {
        if (!Array.isArray(value)) return false;
        const stack = [];
        for (const token of value) {
          if (typeof token !== "string") return false;
          if ((r.operations ?? ["+", "-", "*"]).includes(token)) {
            if (stack.length < 2) return false;
            const b = stack.pop(),
              a = stack.pop();
            const result =
              token === "+" ? a + b : token === "-" ? a - b : a * b;
            if (!Number.isSafeInteger(result) || Math.abs(result) > r.maxAbs)
              return false;
            stack.push(result);
          } else {
            if (!/^-?(0|[1-9][0-9]*)$/.test(token)) return false;
            const n = Number(token);
            if (
              !Number.isSafeInteger(n) ||
              n < r.minLiteral ||
              n > r.maxLiteral
            )
              return false;
            stack.push(n);
          }
        }
        if (stack.length !== 1) return false;
        break;
      }
      case "node-table": {
        if (!value || typeof value !== "object" || !Array.isArray(value.values))
          return false;
        const n = value.values.length,
          links = r.links ?? [],
          acyclic = r.acyclicLinks ?? [],
          unique = r.uniqueLinks ?? [],
          sorted = r.sortedLinks ?? [];
        if (
          !Array.isArray(links) ||
          !links.every((field) => typeof field === "string") ||
          !Array.isArray(acyclic) ||
          !acyclic.every((field) => links.includes(field)) ||
          !Array.isArray(unique) || !unique.every((field)=>links.includes(field)) ||
          !Array.isArray(sorted) || !sorted.every((field)=>links.includes(field))
        )
          return false;
        if (
          r.requireReachable !== undefined &&
          typeof r.requireReachable !== "boolean"
        )
          return false;
        const valid = (i) =>
          i === null || (Number.isInteger(i) && i >= 0 && i < n);
        for (const field of links)
          if (
            !Array.isArray(value[field]) ||
            value[field].length !== n ||
            !value[field].every(valid)
          )
            return false;
        for(const field of unique)if(new Set(value[field]).size!==n||value[field].some(i=>i===null))return false;
        if(sorted.length&&value.values.some(v=>!Number.isSafeInteger(v)))return false;
        for(const field of sorted)for(let i=0;i<n;i++){const next=value[field][i];if(next!==null&&value.values[i]>value.values[next])return false;}
        if (
          r.neighbors &&
          (!Array.isArray(value[r.neighbors]) ||
            value[r.neighbors].length !== n ||
            !value[r.neighbors].every(
              (list) =>
                Array.isArray(list) &&
                list.every((i) => i !== null && valid(i)),
            ))
        )
          return false;
        if (
          r.heads &&
          (!Array.isArray(value[r.heads]) || !value[r.heads].every(valid))
        )
          return false;
        if (r.root && !valid(value[r.root])) return false;
        for (const field of acyclic) {
          const color = new Uint8Array(n);
          for (let start = 0; start < n; start++) {
            if (color[start]) continue;
            const path = [];
            let node = start;
            while (node !== null && !color[node]) {
              color[node] = 1;
              path.push(node);
              node = value[field][node];
            }
            if (node !== null && color[node] === 1) return false;
            for (const visited of path) color[visited] = 2;
          }
        }
        if (r.requireReachable) {
          if (!r.heads && !r.root) return false;
          const roots = [
              ...(r.heads ? value[r.heads] : []),
              ...(r.root ? [value[r.root]] : []),
            ],
            seen = new Set(),
            queue = [];
          for (const node of roots)
            if (node !== null && !seen.has(node)) {
              seen.add(node);
              queue.push(node);
            }
          for (let cursor = 0; cursor < queue.length; cursor++) {
            const node = queue[cursor],
              children = links.map((field) => value[field][node]);
            if (r.neighbors)
              for (const child of value[r.neighbors][node])
                children.push(child);
            for (const child of children)
              if (child !== null && !seen.has(child)) {
                seen.add(child);
                queue.push(child);
              }
          }
          if (seen.size !== n) return false;
        }
        break;
      }
      case "tree-level": {
        if (!Array.isArray(value)) return false;
        if(r.maxNodes!==undefined&&(!Number.isInteger(r.maxNodes)||r.maxNodes<0||value.filter(v=>v!==null).length>r.maxNodes))return false;
        let slots = 1;
        for (const v of value) {
          if (slots === 0) {
            if (v !== null) return false;
            continue;
          }
          slots--;
          if (v !== null) slots += 2;
        }
        break;
      }
      case "frequency-modulo": {
        if (
          !Array.isArray(value) ||
          !Number.isInteger(r.modulus) ||
          r.modulus < 2
        )
          return false;
        const counts = new Map();
        for (const v of value) counts.set(v, (counts.get(v) ?? 0) + 1);
        let exceptions = 0;
        for (const n of counts.values()) {
          const rem = n % r.modulus;
          if (rem === r.exceptionRemainder) exceptions++;
          else if (rem !== 0) return false;
        }
        if (exceptions !== r.exceptionCount) return false;
        break;
      }
      case "frequency-exact": {
        if (!Array.isArray(value)) return false;
        const counts = new Map();
        for (const v of value) counts.set(v, (counts.get(v) ?? 0) + 1);
        let exceptions = 0;
        for (const n of counts.values()) {
          if (n === r.exceptionFrequency) exceptions++;
          else if (n !== r.ordinaryCount) return false;
        }
        if (exceptions !== r.exceptionCount) return false;
        break;
      }
      case "operations": {
        if (
          !Array.isArray(value) ||
          value.length < 1 ||
          value.length > (r.maxOperations ?? 1000)
        )
          return false;
        let size = 0;
        for (let i = 0; i < value.length; i++) {
          const op = value[i];
          if (
            !op ||
            typeof op !== "object" ||
            Array.isArray(op) ||
            Object.keys(op).some((k) => !["op", "args"].includes(k)) ||
            typeof op.op !== "string" ||
            !Array.isArray(op.args)
          )
            return false;
          if (
            (i === 0 && op.op !== "constructor") ||
            (i > 0 && op.op === "constructor")
          )
            return false;
          const contract = r.methods?.[op.op];
          if (
            !contract ||
            op.args.length !== contract.argumentSchemas.length ||
            !op.args.every((v, j) =>
              validateInput(contract.argumentSchemas[j], v),
            ) ||
            size < (contract.minimumSize ?? 0)
          )
            return false;
          if(contract.orderedArguments!==undefined&&(!Array.isArray(contract.orderedArguments)||contract.orderedArguments.length>16||contract.orderedArguments.some(pair=>!Array.isArray(pair)||pair.length!==2||pair.some(index=>!Number.isInteger(index)||index<0||index>=op.args.length)||!Number.isSafeInteger(op.args[pair[0]])||!Number.isSafeInteger(op.args[pair[1]])||op.args[pair[0]]>op.args[pair[1]])))return false;
          size += contract.sizeDelta ?? 0;
          if (size < 0) return false;
        }
        break;
      }
      case "graph-edges": {
        const n = input[r.vertices];
        if (!Number.isInteger(n) || n < 0 || !Array.isArray(value))
          return false;
        const edges = new Set();
        for (const e of value) {
          if (
            !Array.isArray(e) ||
            e.length !== 2 ||
            !e.every((v) => Number.isInteger(v) && v >= 0 && v < n) ||
            (!r.allowSelfLoops && e[0] === e[1])
          )
            return false;
          const key = r.directed
            ? e.join(",")
            : [...e].sort((a, b) => a - b).join(",");
          if (!r.allowDuplicates && edges.has(key)) return false;
          edges.add(key);
        }
        break;
      }
      default:
        return false;
    }
  }
  return true;
}
