// Original Project 03 shaders. No downloaded template or third-party shader code.
export const PARTICLE_VERTEX=`
precision highp float;
attribute vec4 aSeed;
uniform float uTime,uEnergy,uPulse,uAspect,uDpr;
varying vec3 vColor;
varying float vOpacity,vSoft;
void main(){
 float t=uTime*.24;
 float u=fract(aSeed.x+t*.018);
 float a=u*6.2831853;
 float lane=floor(aSeed.z*38.0)/37.0-.5;
 float width=lane*.94+(aSeed.y-.5)*.055;
 float twist=a*1.45+t*.37;
 vec3 p;
 p.x=(u-.5)*6.5*sqrt(uAspect/1.7778);
 p.y=.79*sin(a+.65+t*.20)+.25*sin(a*2.0-t*.28);
 p.z=.70*cos(a-.4+t*.22);
 p.y+=width*cos(twist)*.78;
 p.z+=width*sin(twist)*1.55;
 p.x+=width*.25*sin(a*2.0+t*.4);
 p+=.037*vec3(sin(a*17.0+aSeed.z*19.0+t),cos(a*13.0+aSeed.y*31.0-t),sin(a*9.0+aSeed.z*27.0));
 float dust=step(.962,aSeed.w);
 vec3 cloud=vec3((aSeed.x-.5)*7.3*sqrt(uAspect/1.7778),(aSeed.y-.5)*3.3,(aSeed.z-.5)*3.2);
 cloud.x+=.12*sin(t*.7+aSeed.y*10.0);cloud.y+=.08*cos(t+aSeed.z*9.0);
 p=mix(p,cloud,dust);
 float perspective=3.0/(3.8-p.z);
 vec2 screen=vec2(p.x*.67/uAspect,p.y*.67)*perspective;
 screen.y+=.055*sin(t*.15);
 gl_Position=vec4(screen,0.0,1.0);
 float defocus=abs(p.z-.12);
 float bokeh=pow(aSeed.w*1.0395,18.0);
 float size=1.0+defocus*defocus*3.2+bokeh*11.0;
 gl_PointSize=clamp(size*uDpr*perspective,1.0,42.0*uDpr);
 float traveling=.46+.54*pow(.5+.5*sin(a*2.0-uPulse*.57+t*.42),3.0);
 float white=pow(aSeed.y,1.65)*.79+.18*traveling;
 vColor=mix(vec3(.055,.28,.98),vec3(.88,.97,1.0),white);
 float quiet=1.0-.30*exp(-pow(screen.x/.25,2.0)-pow((screen.y+.04)/.48,2.0));
 vOpacity=(.045+uEnergy*.24)*traveling*quiet*(.35+aSeed.z*.65);
 vOpacity*=mix(1.0,.36,dust)/(1.0+defocus*.32+bokeh*.58);
 vSoft=clamp(defocus*.45+bokeh*.2,0.0,1.0);
}`;
export const PARTICLE_FRAGMENT=`
precision highp float;
varying vec3 vColor;
varying float vOpacity,vSoft;
void main(){
 vec2 q=(gl_PointCoord-.5)*2.0;float r=dot(q,q);
 if(r>1.0)discard;
 float halo=exp(-r*mix(6.5,3.8,vSoft))*(1.0-smoothstep(.55,1.0,r));
 float core=exp(-r*25.0)*(1.0-vSoft)*.65;
 gl_FragColor=vec4(vColor,clamp((halo+core)*vOpacity,0.0,1.0));
}`;
export const SCREEN_VERTEX=`
attribute vec2 aPosition;varying vec2 vUv;
void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.0,1.0);}`;
export const BLOOM_FRAGMENT=`
precision highp float;
uniform sampler2D uScene;uniform vec2 uTexel;varying vec2 vUv;
void main(){
 vec3 scene=texture2D(uScene,vUv).rgb;
 vec3 bloom=vec3(0.0);
 for(int i=0;i<8;i++){
  float a=float(i)*.785398163;vec2 d=vec2(cos(a),sin(a));
  bloom+=texture2D(uScene,vUv+d*uTexel*5.0).rgb*.067;
  bloom+=texture2D(uScene,vUv+d*uTexel*17.0).rgb*.035;
 }
 vec3 color=scene*1.6+bloom*.90;
 color=vec3(1.0)-exp(-color*1.65);
 color=pow(color,vec3(.88));
 float edge=1.0-smoothstep(.38,.79,length((vUv-.5)*vec2(1.0,1.2)));
 gl_FragColor=vec4(color*(.55+.45*edge),1.0);
}`;
