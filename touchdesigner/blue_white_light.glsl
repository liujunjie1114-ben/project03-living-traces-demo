// Original Project 03 GPU light field. Procedural layered light sprites; no plant signal.
uniform vec4 uState; // time seconds, event envelope, event pulse, aspect
out vec4 fragColor;
float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
vec3 lightColor(float r){return mix(vec3(.025,.18,.95),vec3(.86,.96,1.),pow(r,1.6));}
void main(){
 vec2 uv=vUV.st;vec2 p=(uv-.5)*vec2(uState.w,1.);
 float t=uState.x*.24;vec3 color=vec3(0.);
 for(int layer=0;layer<16;layer++){
  float z=float(layer)/15.;float focus=abs(z-.48);
  float x=p.x*(1.+(z-.5)*.24);
  float a=x*3.0+3.35;
  float center=.255*sin(a+.65+t*.20)+.082*sin(a*2.-t*.28);
  center+=(z-.5)*.16*cos(a*1.45+t*.37);
  vec2 q=vec2(x*180.+t*.27,(p.y-center)*290.);
  vec2 cell=floor(q);vec2 f=fract(q);
  float rnd=hash21(cell+float(layer)*17.13);
  vec2 pos=.15+.7*vec2(rnd,hash21(cell.yx+float(layer)*9.7));
  vec2 d=f-pos;float width=mix(.065,.36,focus*1.8);
  float core=exp(-dot(d,d)/(width*width));
  float halo=exp(-dot(d,d)/(.22+focus*.5))*.055;
  float band=exp(-pow((p.y-center)/(.017+focus*.07),2.));
  float traveling=.46+.54*pow(.5+.5*sin(a*2.-uState.z*.57+t*.42),3.);
  color+=lightColor(rnd)*(core+halo)*band*(.025+uState.y*.16)*traveling;
 }
 // Sparse large defocused light spots in a separate depth range.
 for(int layer=0;layer<3;layer++){
  float z=float(layer);vec2 q=p*(12.+z*9.)+vec2(t*.023*(z+1.),z*17.);
  vec2 cell=floor(q);vec2 f=fract(q);float rnd=hash21(cell+z*41.);
  vec2 pos=.1+.8*vec2(rnd,hash21(cell.yx+7.+z));vec2 d=f-pos;
  float spot=exp(-dot(d,d)/(.012+z*.009));
  color+=lightColor(rnd)*spot*step(.82,rnd)*(.025+uState.y*.018);
 }
 float quiet=1.-.23*exp(-pow(p.x/.35,2.)-pow(p.y/.33,2.));
 color=(1.-exp(-color*2.5))*quiet;
 float vignette=1.-smoothstep(.35,.85,length((uv-.5)*vec2(1.,1.2)));
 fragColor=TDOutputSwizzle(vec4(pow(color,vec3(.88))*(.55+.45*vignette),1.));
}
