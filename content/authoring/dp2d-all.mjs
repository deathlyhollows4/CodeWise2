// Integration entry point: definitions only, no materialization or publication side effects.
import {definitions as first} from './dp2d-first.mjs';
import {definitions as second} from './dp2d-second.mjs';
import {definitions as third} from './dp2d-third.mjs';
import {definitions as fourth} from './dp2d-fourth.mjs';
export const definitions=[...first,...second,...third,...fourth];
