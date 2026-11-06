export class BrowserPlayer {
 constructor(){this.context=null;this.osc=null;this.gain=null;this.startTime=0;this.silent=false;}
 async prepare(silent=false){
  this.silent=silent;
  if(silent)return;
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio)throw Error('Web Audio 不可用，请选择“静音画面演示”。');
  this.context??=new Audio();await this.context.resume();
  if(this.context.state!=='running')throw Error('音频时钟未运行，请重新点击或选择静音演示。');
 }
 start(plan){
  this.stop();
  if(this.silent){this.startTime=performance.now()+80;return;}
  const c=this.context;this.osc=c.createOscillator();this.gain=c.createGain();this.osc.type='sine';this.osc.frequency.value=600;
  this.gain.gain.value=0;this.osc.connect(this.gain);this.gain.connect(c.destination);this.startTime=c.currentTime+.08;
  for(const e of plan.events){if(!e.on)continue;const a=this.startTime+e.start_ms/1000,b=a+e.duration_ms/1000;
   this.gain.gain.setValueAtTime(0,a);this.gain.gain.linearRampToValueAtTime(.045,a+.003);this.gain.gain.setValueAtTime(.045,b-.003);this.gain.gain.linearRampToValueAtTime(0,b);
  }
  this.osc.start(this.startTime);this.osc.stop(this.startTime+plan.duration_ms/1000+.02);
 }
 elapsed(){return this.silent?performance.now()-this.startTime:(this.context.currentTime-this.startTime)*1000;}
 healthy(){return this.silent||this.context?.state==='running';}
 stop(){
  if(this.gain&&this.context){this.gain.gain.cancelScheduledValues(this.context.currentTime);this.gain.gain.setValueAtTime(0,this.context.currentTime);this.gain.disconnect();}
  if(this.osc){try{this.osc.stop();this.osc.disconnect();}catch{}}
  this.osc=null;this.gain=null;
 }
}
