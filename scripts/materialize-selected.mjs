import {definitions} from '../content/authoring/registry.mjs';
import {materializePack} from '../content/authoring/pack-builder.mjs';
const argument=process.argv.find(a=>a.startsWith('--ids='));if(!argument)throw Error('Explicit selected IDs required');const ids=argument.slice(6).split(',');if(ids.some(id=>!/^[a-z0-9-]+$/.test(id))||new Set(ids).size!==ids.length)throw Error('Invalid selected IDs');
for(const id of ids){const def=definitions.find(d=>d.id===id);if(!def||!def.function&&!def.stateful)throw Error('Selected pack lacks the shared builder contract: '+id);console.log(await materializePack(def));}
