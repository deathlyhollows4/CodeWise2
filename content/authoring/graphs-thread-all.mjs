// Definitions only. Main integration owns registry/materialization and isolated runner jobs.
import {definitions as first} from './graphs-thread-first.mjs';
import {definitions as second} from './graphs-thread-second.mjs';
import {definitions as third} from './graphs-thread-third.mjs';
import {definitions as fourth} from './graphs-thread-fourth.mjs';
import {definitions as fifth} from './graphs-thread-fifth.mjs';
export const definitions=[...first,...second,...third,...fourth,...fifth];
