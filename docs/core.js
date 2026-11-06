// Morse alphabet, ratios and no-trailing-gap behavior reused from living-traces/core.js.
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const codes=['.-','-...','-.-.','-..','.','..-.','--.','....','..','.---','-.-','.-..','--','-.','---','.--.','--.-','.-.','...','-','..-','...-','.--','-..-','-.--','--..','-----','.----','..---','...--','....-','.....','-....','--...','---..','----.'];
export const RULE='ITU_M1677_AZ09_SPACE_SUBSET_V1';
export const VERSION='project03-phase1-events-v1';
export const TERMINAL=['completed','stopped','interrupted','failed'];
export function normalizeText(value) {
 if(typeof value!=='string'||value.length>80||!value.trim())throw Error('编码文本需要 1–80 个字符。');
 if(!/^[A-Za-z0-9 ]+$/.test(value))throw Error('编码仅支持 A–Z、0–9 和半角空格。请手动修改，中文、标点和换行不会被自动删除。');
 return value.trim().toUpperCase().replace(/ +/g,' ');
}
export function buildPlan(text,unit=120,eventId=globalThis.crypto.randomUUID()) {
 const normalized=normalizeText(text);unit=Number(unit);
 if(!Number.isInteger(unit)||unit<80||unit>300||unit%20)throw Error('点的时间单位应为 80–300 ms，步长 20 ms。');
 if(typeof eventId!=='string'||!/^[A-Za-z0-9-]{1,80}$/.test(eventId))throw Error('事件编号无效。');
 const events=[];let time=0;
 const add=(on,n,kind)=>{events.push({event_number:events.length+1,start_ms:time,duration_ms:n*unit,on,state:on?'ON':'OFF',kind});time+=n*unit;};
 const words=normalized.split(' ');
 const morse=words.map(w=>[...w].map(c=>codes[alphabet.indexOf(c)]).join(' / ')).join(' // ');
 words.forEach((w,wi)=>[...w].forEach((c,ci)=>{
  const code=codes[alphabet.indexOf(c)];
  [...code].forEach((s,si)=>{add(true,s==='.'?1:3,s==='.'?'dot':'dash');if(si<code.length-1)add(false,1,'symbol_gap');});
  if(ci<w.length-1)add(false,3,'letter_gap');else if(wi<words.length-1)add(false,7,'word_gap');
 }));
 if(time>90000)throw Error('首版每次呈现最多 90 秒，请缩短文本或时间单位。');
 return {schema:VERSION,event_id:eventId,encoding_text:normalized,character_rule:RULE,morse,parameters:{version:'morse-timing-v1',unit_ms:unit,dot_units:1,dash_units:3,symbol_gap_units:1,letter_gap_units:3,word_gap_units:7,trailing_gap:false},events,duration_ms:time,requested_on_ms:events.reduce((s,e)=>s+(e.on?e.duration_ms:0),0),timing_target:'MORSE_AUDIO_AND_RHYTHM_VISUAL',plant_exposure_plan:null};
}
export function activityAt(plan,ms) {
 if(!Number.isFinite(ms)||ms<0||ms>=plan.duration_ms)return {on:false,index:-1};
 const index=plan.events.findIndex(e=>ms>=e.start_ms&&ms<e.start_ms+e.duration_ms);
 return {on:index>=0&&plan.events[index].on,index};
}
export function createRecord(original,plan,now=new Date().toISOString()) {
 if(typeof original!=='string'||original.length>500)throw Error('原句最多保留 500 个字符。');
 return {schema:'project03-phase1-archive-v1',event_id:plan.event_id,created_at:now,updated_at:now,source:'ENGINEERING_DEMO',software_only:true,original_text:original,confirmed_encoding_text:plan.encoding_text,character_rule:RULE,plan:structuredClone(plan),state:'confirmed',lifecycle:[{state:'confirmed',at:now}],audio:{carrier_hz:600,waveform:'sine',gain:0.045,ramp_ms:3,executor:'not_started',audibility:'NOT_PHYSICALLY_VERIFIED'},projection:{mapping_version:'blue-white-particles-v2',preview_mapping_version:'blue-white-particles-v2',driver:'RHYTHM_DRIVEN_NOT_AUDIO_ANALYSIS',surface:'SOFTWARE_WINDOW'},execution:{executor:'not_started',elapsed_ms:0,td_reports:[]},plant_observation:{connected:false,readings:null},physical_outputs:{lights_executed:false,plant_exposure_executed:false},storage:{kind:'BROWSER_LOCAL_ONLY'}};
}
export function transition(record,state,details={},now=new Date().toISOString()) {
 const allowed={confirmed:['starting'],starting:['running','failed','interrupted','stopped'],running:TERMINAL};
 if(!allowed[record.state]?.includes(state))throw Error(`不允许的状态变化：${record.state} → ${state}`);
 record.state=state;record.updated_at=now;
 record.lifecycle.push({state,at:now,...(details.reason?{reason:details.reason}:{})});
 if(details.executor){record.execution.executor=details.executor;record.audio.executor=details.executor;}
 if(details.elapsed_ms!==undefined)record.execution.elapsed_ms=Math.max(0,Math.min(record.plan.duration_ms,details.elapsed_ms));
 if(details.reason)record.execution.reason=details.reason;
 return record;
}
