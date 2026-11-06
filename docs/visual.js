import {PARTICLE_VERTEX,PARTICLE_FRAGMENT,SCREEN_VERTEX,BLOOM_FRAGMENT} from './particle-shaders.js';
export const VISUAL_VERSION='blue-white-particles-v2';
export function scoreEnergy(plan,ms,playing){
 if(!playing||!plan||ms<0)return {energy:0,pulse:0};
 let energy=0,pulse=0;
 for(const e of plan.events){if(!e.on||e.start_ms>ms)continue;const age=ms-e.start_ms;
  if(age<2400){energy+=Math.exp(-Math.max(0,age-e.duration_ms)/360)*(e.kind==='dash'?1.05:.78);pulse=e.event_number;}
 }
 return {energy:Math.min(1.35,energy),pulse};
}
export class RhythmField {
 constructor(canvas){
  this.canvas=canvas;this.frames=0;this.energy=0;this.clock=0;this.last=performance.now();this.error=null;this.lost=false;
  this.gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'high-performance',preserveDrawingBuffer:true});
  this.rendererName=this.gl?'WEBGL_GPU_PARTICLES':'UNAVAILABLE';
  if(!this.gl){this.error='WebGL 不可用。请使用启用图形加速的 Edge / Chrome。';canvas.setAttribute('aria-label',this.error);return;}
  try{this.init();this.resize=new ResizeObserver(()=>this.fit());this.resize.observe(canvas);this.fit();}
  catch(e){this.error=e.message;this.rendererName='SHADER_ERROR';console.error('Particle field:',e);}
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;this.error='GPU 上下文中断，请刷新页面。';});
 }
 program(vertex,fragment){
  const gl=this.gl,p=gl.createProgram();
  for(const [type,source]of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));gl.attachShader(p,s);gl.deleteShader(s);}
  gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;
 }
 init(){
  const gl=this.gl;this.particles=this.program(PARTICLE_VERTEX,PARTICLE_FRAGMENT);this.post=this.program(SCREEN_VERTEX,BLOOM_FRAGMENT);
  this.count=matchMedia('(max-width:760px)').matches?22000:64000;
  const seeds=new Float32Array(this.count*4);let state=0x50303;
  for(let i=0;i<seeds.length;i++){state=(Math.imul(state,1664525)+1013904223)>>>0;seeds[i]=state/4294967296;}
  this.seedBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.seedBuffer);gl.bufferData(gl.ARRAY_BUFFER,seeds,gl.STATIC_DRAW);
  this.quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  this.texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  this.fbo=gl.createFramebuffer();this.uniforms={};
  for(const name of ['uTime','uEnergy','uPulse','uAspect','uDpr'])this.uniforms[name]=gl.getUniformLocation(this.particles,name);
  this.seedAttribute=gl.getAttribLocation(this.particles,'aSeed');this.quadAttribute=gl.getAttribLocation(this.post,'aPosition');
  this.texelUniform=gl.getUniformLocation(this.post,'uTexel');this.sceneUniform=gl.getUniformLocation(this.post,'uScene');
 }
 fit(){
  if(this.error)return;const r=this.canvas.getBoundingClientRect();this.d=Math.min(devicePixelRatio||1,1.75);
  this.w=Math.max(1,Math.round(r.width*this.d));this.h=Math.max(1,Math.round(r.height*this.d));this.canvas.width=this.w;this.canvas.height=this.h;
  const gl=this.gl;gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,this.w,this.h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.bindFramebuffer(gl.FRAMEBUFFER,this.fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this.texture,0);
  if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE){this.error='GPU 帧缓冲不可用。';return;}gl.bindFramebuffer(gl.FRAMEBUFFER,null);
 }
 draw(plan,ms,playing){
  if(this.error||this.lost)return;
  this.frames++;const now=performance.now(),dt=Math.min(.08,(now-this.last)/1000);this.last=now;
  const score=scoreEnergy(plan,ms,playing);this.energy+=(score.energy-this.energy)*(1-Math.exp(-dt*(score.energy>this.energy?18:3.4)));
  this.clock=playing?Math.max(0,ms/1000):this.clock+dt*.35;
  const gl=this.gl;gl.viewport(0,0,this.w,this.h);gl.bindFramebuffer(gl.FRAMEBUFFER,this.fbo);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(this.particles);gl.bindBuffer(gl.ARRAY_BUFFER,this.seedBuffer);gl.enableVertexAttribArray(this.seedAttribute);gl.vertexAttribPointer(this.seedAttribute,4,gl.FLOAT,false,0,0);
  gl.uniform1f(this.uniforms.uTime,this.clock);gl.uniform1f(this.uniforms.uEnergy,.32+this.energy);gl.uniform1f(this.uniforms.uPulse,score.pulse);gl.uniform1f(this.uniforms.uAspect,this.w/this.h);gl.uniform1f(this.uniforms.uDpr,this.d);
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.drawArrays(gl.POINTS,0,this.count);gl.disable(gl.BLEND);gl.disableVertexAttribArray(this.seedAttribute);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.useProgram(this.post);gl.bindBuffer(gl.ARRAY_BUFFER,this.quad);gl.enableVertexAttribArray(this.quadAttribute);gl.vertexAttribPointer(this.quadAttribute,2,gl.FLOAT,false,0,0);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.uniform1i(this.sceneUniform,0);gl.uniform2f(this.texelUniform,1/this.w,1/this.h);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);gl.disableVertexAttribArray(this.quadAttribute);
 }
}
