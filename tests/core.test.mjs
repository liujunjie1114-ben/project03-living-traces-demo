import test from 'node:test';import assert from 'node:assert/strict';
import {buildPlan,normalizeText,createRecord} from '../docs/core.js';
test('HELLO keeps the canonical timing contract',()=>{const p=buildPlan('HELLO',120,'engineering-test');assert.equal(p.events.length,31);assert.equal(p.duration_ms,5880);assert.equal(p.requested_on_ms,3120);assert.equal(p.plant_exposure_plan,null);});
test('unsupported characters are never discarded',()=>{assert.equal(normalizeText(' hello  world '),'HELLO WORLD');for(const s of ['你好','HELLO.','A\nB'])assert.throws(()=>normalizeText(s));});
test('share record declares browser-only storage and no hardware',()=>{const r=createRecord('HELLO',buildPlan('HELLO',120,'record-test'));assert.equal(r.storage.kind,'BROWSER_LOCAL_ONLY');assert.equal(r.plant_observation.connected,false);assert.equal(r.physical_outputs.lights_executed,false);});
