import test from 'node:test';
import assert from 'node:assert/strict';
import {activityState,macroSignal} from '../lib/processes/areaValidation.ts';

test('every designated area must confirm the current details and affected handoffs',()=>{
  const item={id:'A1',macro:'M1'};
  const assignments=['A','B'].map(mandate=>({macro_id:'M1',active:true,area:mandate,mandate}));
  const events=[];
  const state=()=>activityState(item,{assignments,events}).signal;
  const add=(kind,mandate=null)=>events.push({id:events.length+1,item_id:'A1',kind,mandate});
  assert.equal(state(),'pending');
  add('revision');add('approved','A');assert.equal(state(),'pending');
  add('approved','B');assert.equal(state(),'approved');
  add('correction','A');add('reopen');assert.equal(state(),'correction');
  add('revision');assert.equal(state(),'pending');
  add('approved','A');add('approved','B');add('reopen');assert.equal(state(),'pending');
  add('approved','A');add('approved','B');assignments[1].mandate='replacement';assert.equal(state(),'pending');
  assert.equal(macroSignal(['approved','correction','pending']),'correction');
  assert.equal(macroSignal(['approved','pending']),'pending');
  assert.equal(macroSignal(['approved','approved']),'approved');
  assert.equal(macroSignal([]),'pending');
});

