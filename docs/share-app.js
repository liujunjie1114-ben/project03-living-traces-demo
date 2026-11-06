import {normalizeText,buildPlan,activityAt,createRecord,transition} from './core.js';
import {BrowserPlayer} from './player.js';
import {RhythmField} from './visual.js';
const $=id=>document.getElementById(id),player=new BrowserPlayer(),field=new RhythmField($('field'));
const channel=new BroadcastChannel('project03-github-projection'),STORE='project03-github-public-demo-v1';
const labels={confirmed:'已确认，尚未开始',starting:'正在启动',running:'正在呈现',completed:'软件演示完成',stopped:'已停止',interrupted:'演示中断',failed:'启动失败'};
let records=[],current=null,run=null,selected=null,releaseStation=null,lastBroadcast=0,storageOk=true;
let plan=buildPlan('HELLO',120,'unconfirmed-preview');
const say=text=>$('notice').textContent=text;
function lock(){for(const id of ['original','encoding','unit','executor','confirm'])$(id).disabled=!!run;$('start').disabled=!!run||current?.state!=='confirmed';$('stop').disabled=!run;$('export-plan').disabled=!current;}
function save(record){
 const copy=structuredClone(record);records=[copy,...records.filter(r=>r.event_id!==copy.event_id)].sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,30);
 try{localStorage.setItem(STORE,JSON.stringify(records));storageOk=true;$('storage-state').textContent='BROWSER LOCAL / 已保存在此浏览器';}
 catch{storageOk=false;$('storage-state').textContent='仅当前页面内存 / 请导出 JSON';}
 renderArchive();
}
function renderPlan(){
 $('morse').textContent=plan.morse;$('duration').textContent=(plan.duration_ms/1000).toFixed(2);$('plan-metrics').textContent=`${plan.events.length} 段 / 请求发声 ${(plan.requested_on_ms/1000).toFixed(2)} s`;
 $('timeline').replaceChildren(...plan.events.map(e=>{const n=document.createElement('span');n.className='segment'+(e.on?' on':'');n.style.width=e.duration_ms/plan.duration_ms*100+'%';n.title=`#${e.event_number} ${e.state} ${e.duration_ms} ms`;return n;}));
 const head=document.createElement('span');head.id='playhead';head.className='playhead';$('timeline').append(head);$('event-id').textContent=current?'EVENT / '+current.event_id:'EVENT / 尚未确认';
}
function invalidate(){if(run)return;current=null;$('input-error').textContent='';$('run-state').textContent='WAITING / 需要确认';
 try{const text=normalizeText($('encoding').value);$('normalized').textContent=text;plan=buildPlan(text,Number($('unit').value),'unconfirmed-preview');renderPlan();}
 catch(e){$('normalized').textContent='请修正编码文本';$('input-error').textContent=e.message;}lock();
}
for(const id of ['original','encoding','unit'])$(id).addEventListener('input',invalidate);
$('input-form').onsubmit=event=>{event.preventDefault();if(run)return;
 try{plan=buildPlan($('encoding').value,Number($('unit').value));current=createRecord($('original').value,plan);current.source='ENGINEERING_DEMO';current.storage={kind:'BROWSER_LOCAL_ONLY',uploaded:false};
  $('normalized').textContent=plan.encoding_text;$('input-error').textContent='';$('elapsed').textContent='0.00';$('run-state').textContent='CONFIRMED / 已确认';renderPlan();save(current);say('已确认编码文本。点击开始，听见摩斯节奏并观看蓝白光场。');
 }catch(e){current=null;$('input-error').textContent=e.message;}lock();
};
async function start(){
 if(run||current?.state!=='confirmed')return;if(field.error){say(field.error);return;}
 const r={record:current,ready:false};run=r;transition(current,'starting');save(current);lock();$('run-state').textContent='STARTING / 正在启动';
 try{
  if(navigator.locks){const acquired=await new Promise(resolve=>navigator.locks.request('project03-github-audio',{ifAvailable:true},async lock=>{if(!lock){resolve(false);return;}await new Promise(release=>{releaseStation=release;resolve(true);});}));if(!acquired)throw Error('另一演示页正在播放，请先停止它。');}
  if(run!==r){releaseStation?.();releaseStation=null;return;}
  const silent=$('executor').value==='silent';await player.prepare(silent);if(run!==r)return;
  const executor=silent?'browser_silent':'browser_webaudio';player.start(plan);r.ready=true;
  current.audio.executor=executor;current.audio.audibility=silent?'MUTED_BY_SELECTION':'NOT_PHYSICALLY_VERIFIED';current.execution.clock=silent?'PERFORMANCE_MONOTONIC':'WEB_AUDIO_CONTEXT';
  transition(current,'running',{executor,elapsed_ms:0});save(current);$('audio-state').textContent=silent?'静音 · 仅光场':'浏览器声音 · 600 Hz';$('run-state').textContent='RUNNING / 正在呈现';say(silent?'静音演示。光场按同一事件表呈现。':'正在播放摩斯节奏。若听不到声音，请检查设备和浏览器静音。');
 }catch(e){if(run===r){finish('failed',e.message);$('input-error').textContent=e.message;}}
}
$('start').onclick=start;
function finish(outcome,reason=''){
 if(!run)return;const r=run,elapsed=r.ready?Math.max(0,Math.min(plan.duration_ms,player.elapsed())):0;run=null;player.stop();releaseStation?.();releaseStation=null;
 transition(r.record,outcome,{elapsed_ms:outcome==='completed'?plan.duration_ms:elapsed,reason});save(r.record);$('elapsed').textContent=(r.record.execution.elapsed_ms/1000).toFixed(2);$('run-state').textContent=outcome.toUpperCase()+' / '+labels[outcome];$('tone-state').textContent='SIGNAL / ENDED';lock();
 say((storageOk?'记录已保存在此浏览器。':'浏览器保存不可用，请导出 JSON。')+' 可以在下方回看或导出；记录不会自动上传。');
}
$('stop').onclick=()=>finish('stopped','USER_STOP');
document.addEventListener('visibilitychange',()=>{if(document.hidden&&run)finish('interrupted','PAGE_HIDDEN');});
window.addEventListener('pagehide',()=>{if(run)finish('interrupted','PAGE_EXIT');});
function download(name,data){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),4000);}
$('export-plan').onclick=()=>current&&download(current.event_id+'-plan.json',current.plan);
$('export-all').onclick=()=>download('project03-browser-events.json',{schema:'project03-phase1-bundle-v1',source:'BROWSER_LOCAL_ONLY',exported_at:new Date().toISOString(),events:records});
function node(tag,text,cls){const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;}
function renderArchive(){
 $('export-all').disabled=!records.length;
 if(!records.length){$('archive-list').replaceChildren(node('p','还没有事件。先确认一段编码文本。','empty'));return;}
 $('archive-list').replaceChildren(...records.map(r=>{const row=node('div','','archive-row'),id=node('span',r.event_id.slice(0,8),'event-no');id.append(node('small','SOFTWARE DEMO'));
  const text=node('strong',r.confirmed_encoding_text),time=node('span',new Date(r.created_at).toLocaleString('zh-CN'),'archive-time'),state=node('span',labels[r.state]||r.state,'archive-outcome');state.append(node('small','仅此浏览器保存'));
  const button=node('button','查看 / 导出 ↗','text-button');button.onclick=()=>{selected=r;$('record-json').textContent=JSON.stringify(r,null,2);$('record-summary').textContent=`${r.event_id} / ${labels[r.state]} / 软件演示 · 植物未连接`;$('replay-record').disabled=!!run;$('record-dialog').showModal();};row.append(id,text,time,state,button);return row;
 }));
}
$('close-dialog').onclick=()=>$('record-dialog').close();$('export-record').onclick=()=>selected&&download(selected.event_id+'.json',selected);
$('replay-record').onclick=()=>{if(run||!selected)return;$('original').value=selected.original_text;$('encoding').value=selected.confirmed_encoding_text;$('unit').value=String(selected.plan.parameters.unit_ms);$('record-dialog').close();invalidate();scrollTo({top:0,behavior:'smooth'});say('文本已载入。请重新确认，创建新的事件。');};
$('open-projection').onclick=()=>window.open('projection.html','project03-share-projection','width=1200,height=750');
try{const stored=JSON.parse(localStorage.getItem(STORE)||'[]');if(!Array.isArray(stored))throw Error('Invalid browser archive');records=stored.filter(r=>r?.schema==='project03-phase1-archive-v1'&&r.software_only===true&&r.storage?.kind==='BROWSER_LOCAL_ONLY'&&typeof r.event_id==='string'&&typeof r.confirmed_encoding_text==='string').slice(0,30);}
catch{storageOk=false;say('浏览器记录不可读取；原存储保留，本次可继续演示并导出。');}
renderArchive();renderPlan();lock();
function frame(now){
 let ms=0,playing=false;if(run?.ready){ms=player.elapsed();playing=ms>=0;
  if(field.error)finish('interrupted','VISUAL_UNAVAILABLE');else if(!player.healthy())finish('interrupted','AUDIO_CLOCK_SUSPENDED');else if(ms>=plan.duration_ms)finish('completed');
  else{const a=activityAt(plan,ms);$('elapsed').textContent=(Math.max(0,ms)/1000).toFixed(2);$('tone-state').textContent=`SIGNAL / ${a.on?'ON':'GAP'} / ${Math.max(0,a.index+1)}`;$('playhead').style.left=Math.max(0,ms/plan.duration_ms*100)+'%';$('timeline').querySelectorAll('.segment').forEach((n,i)=>n.classList.toggle('active',i===a.index&&a.on));}
 }
 field.draw(plan,ms,playing&&!!run);if(now-lastBroadcast>45){channel.postMessage({plan,elapsed_ms:ms,running:playing&&!!run});lastBroadcast=now;}requestAnimationFrame(frame);
}
window.shareDemoDebug={snapshot:()=>({state:current?.state||'idle',event_id:current?.event_id,elapsed_ms:run?.ready?player.elapsed():current?.execution.elapsed_ms||0,renderer:field.rendererName,render_error:field.error,audio_scheduled:!!player.osc,records:structuredClone(records)})};
requestAnimationFrame(frame);
