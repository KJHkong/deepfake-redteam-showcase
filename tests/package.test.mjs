import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {root,validate} from '../scripts/check.mjs';
test('all 25 approved cases and sanitized PNGs form a static package',()=>{
 const result=validate();assert.equal(result.cases,25);assert.equal(result.images,56);assert.equal(result.private_data_findings,0);
});
test('all five Editing actions and all eight Modifiers remain available',()=>{
 const d=JSON.parse(fs.readFileSync(path.join(root,'src/data/showcase.json')));
 assert.equal(new Set(d.samples.filter(s=>s.section==='editing').map(s=>s.action)).size,5);
 assert.equal(new Set(d.samples.filter(s=>s.section==='modifier').map(s=>s.modifier.tool_name)).size,8);
});
test('public font has its own retained license without a project license',()=>{
 assert.ok(fs.existsSync(path.join(root,'third_party/NotoSans-OFL.txt')));assert.equal(fs.existsSync(path.join(root,'LICENSE')),false);
});
