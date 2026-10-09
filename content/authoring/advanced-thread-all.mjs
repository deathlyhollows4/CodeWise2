// All6 definitions only. Main integration owns registry, materialization and native runs.
import {definitions as first} from './advanced-thread-first.mjs';
import {definitions as second} from './advanced-thread-second.mjs';
import {definitions as third} from './advanced-thread-third.mjs';
export const definitions=[...first,...second,...third];
