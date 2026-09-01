import{A as e,C as t,D as n,E as r,F as i,I as a,L as o,M as s,N as c,O as l,P as u,S as d,T as f,_ as p,a as m,b as h,c as g,d as _,f as v,g as y,h as b,i as x,j as S,k as C,l as w,m as T,n as E,o as D,p as O,r as k,s as A,t as j,u as M,v as N,w as P,x as F,y as I}from"./index-zXCtvUDl.js";var ee={oak:{name:`oak`,kind:`broadleaf`,weight:1,height:[14,25],trunkRatio:.052,levels:5,trunkSegments:14,trunkTwist:.28,gnarl:.36,curveUp:.3,gravity:.16,branchStart:.28,branchZone:[.3,.95],childCount:[3,4],childAngle:[.72,1.28],childLength:[.58,.8],pipeExponent:2.25,forkChance:.35,rootFlare:1.55,rootCount:[5,8],surfaceRoots:4,leafLevel:3,clusterSize:[.2,.34],clustersPerTip:[5,9],leafletCount:5,leafAspect:1.15,leafDroop:.35,barkColor:[[.052,.043,.034],[.098,.082,.062]],barkRidge:1,barkScale:1,leafColor:[[.036,.082,.024],[.072,.135,.038]],leafAutumn:[[.15,.09,.028],[.19,.13,.04]],transmission:.55,crownWidth:1.35},beech:{name:`beech`,kind:`broadleaf`,weight:.85,height:[20,32],trunkRatio:.036,levels:5,trunkSegments:16,trunkTwist:.14,gnarl:.2,curveUp:.46,gravity:.1,branchStart:.42,branchZone:[.44,.98],childCount:[3,4],childAngle:[.55,1.05],childLength:[.62,.82],pipeExponent:2.35,forkChance:.18,rootFlare:1.2,rootCount:[4,6],surfaceRoots:2,leafLevel:3,clusterSize:[.16,.28],clustersPerTip:[5,10],leafletCount:4,leafAspect:1.35,leafDroop:.28,barkColor:[[.072,.07,.062],[.125,.12,.108]],barkRidge:.35,barkScale:.7,leafColor:[[.042,.095,.028],[.085,.15,.044]],leafAutumn:[[.165,.105,.032],[.205,.14,.048]],transmission:.68,crownWidth:1.05},birch:{name:`birch`,kind:`broadleaf`,weight:.7,height:[12,20],trunkRatio:.026,levels:5,trunkSegments:13,trunkTwist:.2,gnarl:.3,curveUp:.34,gravity:.52,branchStart:.34,branchZone:[.36,.99],childCount:[3,4],childAngle:[.62,1.15],childLength:[.6,.84],pipeExponent:2.15,forkChance:.3,rootFlare:.85,rootCount:[3,5],surfaceRoots:1,leafLevel:3,clusterSize:[.13,.23],clustersPerTip:[5,10],leafletCount:5,leafAspect:1.05,leafDroop:.55,barkColor:[[.24,.235,.22],[.4,.395,.375]],barkRidge:.1,barkScale:.5,barkPaper:1,leafColor:[[.05,.105,.03],[.098,.165,.05]],leafAutumn:[[.2,.16,.04],[.235,.195,.055]],transmission:.78,crownWidth:.9},pine:{name:`pine`,kind:`conifer`,weight:.8,height:[22,34],trunkRatio:.03,levels:3,trunkSegments:16,trunkTwist:.1,gnarl:.16,curveUp:.62,gravity:.22,branchStart:.36,branchZone:[.38,1],whorls:12,childCount:[3,5],childAngle:[1.05,1.42],childLength:[.4,.62],pipeExponent:2.5,forkChance:.02,rootFlare:1.05,rootCount:[4,6],surfaceRoots:2,leafLevel:2,clusterSize:[.19,.32],clustersPerTip:[10,17],needle:!0,leafletCount:13,leafAspect:3.4,leafDroop:.18,barkColor:[[.062,.04,.028],[.135,.082,.048]],barkRidge:1.35,barkScale:1.35,barkPlates:1,leafColor:[[.028,.058,.03],[.052,.092,.046]],leafAutumn:[[.055,.075,.04],[.075,.095,.05]],transmission:.3,crownWidth:.85},fir:{name:`fir`,kind:`conifer`,weight:.6,height:[16,28],trunkRatio:.026,levels:3,trunkSegments:16,trunkTwist:.08,gnarl:.12,curveUp:.75,gravity:.34,branchStart:.1,branchZone:[.1,1],whorls:11,conical:1,childCount:[3,4],childAngle:[1.25,1.6],childLength:[.3,.55],pipeExponent:2.6,forkChance:0,rootFlare:.85,rootCount:[3,5],surfaceRoots:1,leafLevel:2,clusterSize:[.16,.27],clustersPerTip:[12,20],needle:!0,leafletCount:15,leafAspect:3,leafDroop:.22,barkColor:[[.048,.04,.034],[.098,.082,.066]],barkRidge:.55,barkScale:.85,leafColor:[[.024,.05,.032],[.044,.082,.048]],leafAutumn:[[.048,.068,.04],[.068,.088,.048]],transmission:.26,crownWidth:.75},hazel:{name:`hazel`,kind:`shrub`,weight:.9,height:[3.5,7.5],trunkRatio:.03,levels:5,trunkSegments:7,trunkTwist:.4,gnarl:.62,curveUp:.42,gravity:.3,branchStart:.04,branchZone:[.05,1],stems:[3,6],childCount:[3,4],childAngle:[.7,1.3],childLength:[.58,.86],pipeExponent:2.1,forkChance:.45,rootFlare:.55,rootCount:[2,4],surfaceRoots:0,leafLevel:3,clusterSize:[.2,.34],clustersPerTip:[4,8],leafletCount:4,leafAspect:1,leafDroop:.4,barkColor:[[.06,.05,.038],[.11,.092,.07]],barkRidge:.45,barkScale:.6,leafColor:[[.048,.1,.03],[.092,.16,.048]],leafAutumn:[[.175,.12,.035],[.215,.155,.048]],transmission:.8,crownWidth:1.5},sapling:{name:`sapling`,kind:`broadleaf`,weight:1.2,height:[1.1,3.4],trunkRatio:.024,levels:3,trunkSegments:6,trunkTwist:.35,gnarl:.5,curveUp:.55,gravity:.24,branchStart:.2,branchZone:[.22,1],childCount:[2,3],childAngle:[.65,1.2],childLength:[.62,.9],pipeExponent:2,forkChance:.25,rootFlare:.35,rootCount:[2,3],surfaceRoots:0,leafLevel:1,clusterSize:[.17,.29],clustersPerTip:[3,6],leafletCount:4,leafAspect:1.1,leafDroop:.32,barkColor:[[.058,.052,.038],[.105,.095,.068]],barkRidge:.25,barkScale:.45,leafColor:[[.055,.115,.034],[.105,.18,.055]],leafAutumn:[[.17,.115,.035],[.21,.15,.048]],transmission:.85,crownWidth:1.2},snag:{name:`snag`,kind:`dead`,weight:.3,height:[6,18],trunkRatio:.055,levels:4,trunkSegments:10,trunkTwist:.3,gnarl:.48,curveUp:.16,gravity:.35,branchStart:.3,branchZone:[.32,.9],childCount:[1,3],childAngle:[.85,1.45],childLength:[.35,.62],pipeExponent:2.4,forkChance:.2,rootFlare:1.85,rootCount:[5,9],surfaceRoots:5,broken:1,leafLevel:99,clusterSize:[0,0],clustersPerTip:[0,0],leafletCount:0,leafAspect:1,leafDroop:0,barkColor:[[.07,.058,.046],[.13,.112,.092]],barkRidge:1.6,barkScale:1.2,barkStrip:1,leafColor:[[0,0,0],[0,0,0]],leafAutumn:[[0,0,0],[0,0,0]],transmission:0,crownWidth:.8}},te=[[`beech`,e=>.35+e.canopy*1.5+e.moisture*.5-e.rock*1.2-e.slope*.8],[`oak`,e=>.55+e.canopy*.9+(1-e.moisture)*.4-e.rock*.7-e.slope*.5],[`birch`,e=>.25+(1-e.canopy)*1.2+e.moisture*.6-e.rock*.4],[`pine`,e=>.2+e.rock*1.5+e.slope*1+(1-e.moisture)*.7],[`fir`,e=>.15+e.canopy*.8+e.moisture*.7+e.slope*.5-e.rock*.2],[`hazel`,e=>.3+(1-e.canopy)*.9+e.moisture*.7-e.rock*.5],[`sapling`,e=>.2+(1-e.canopy)*1.8+e.litter*.4-e.rock*.6],[`snag`,e=>.08+e.canopy*.35+e.moisture*.2]];function ne(e,t){let n=0,r=[];for(let[t,i]of te){let a=Math.max(.001,i(e));r.push([t,a]),n+=a}let i=t*n;for(let[e,t]of r)if(i-=t,i<=0)return e;return r[0][0]}var L=()=>new a,re=class{constructor(){this.pos=[],this.nrm=[],this.uv=[],this.extra=[],this.sway=[],this.idx=[]}vertex(e,t,n,r,i){return this.pos.push(e.x,e.y,e.z),this.nrm.push(t.x,t.y,t.z),this.uv.push(n[0],n[1]),this.extra.push(r[0],r[1],r[2],r[3]),this.sway.push(i[0],i[1]),this.pos.length/3-1}tri(e,t,n){this.idx.push(e,t,n)}quad(e,t,n,r){this.idx.push(e,t,n,e,n,r)}get triangles(){return this.idx.length/3}toGeometry(){if(this.pos.length===0)return null;let e=new h;e.setAttribute(`position`,new I(new Float32Array(this.pos),3)),e.setAttribute(`normal`,new I(new Float32Array(this.nrm),3)),e.setAttribute(`uv`,new I(new Float32Array(this.uv),2)),e.setAttribute(`aExtra`,new I(new Float32Array(this.extra),4)),e.setAttribute(`aSway`,new I(new Float32Array(this.sway),2));let t=this.pos.length/3;return e.setIndex(t>65534?new I(new Uint32Array(this.idx),1):new I(new Uint16Array(this.idx),1)),e.computeBoundingSphere(),e}};function R(e,t){let n=Math.abs(e.y)>.95?L().set(1,0,0):L().set(0,1,0);t.t.crossVectors(n,e).normalize(),t.b.crossVectors(e,t.t).normalize()}function z(e,t,n){return Math.sin(e*1.7+t*2.3+n*.9)*.5+Math.sin(e*3.9-t*1.1+n*2.7)*.3+Math.sin(e*7.3+t*5.1-n*4.3)*.2}var ie=class{constructor(e,t,n={}){this.sp=e,this.rng=new j(t),this.branches=[],this.clusters=[],this.height=0,this.maxRadius=0,this.crownRadius=0,this.age=n.age??this.rng.range(.55,1),this.health=n.health??this.rng.range(.55,1)}grow(){let e=this.sp,t=this.rng,n=x(e.height[0],e.height[1],t.f()**.85)*x(.55,1,this.age);this.height=n;let r=n*e.trunkRatio*x(.85,1.2,t.f())*x(1.25,1,this.age);this.maxRadius=r;let i=e.stems?t.int(e.stems[1]-e.stems[0]+1)+e.stems[0]:1;for(let a=0;a<i;a++){let o=a/i*Math.PI*2+t.range(-.4,.4),s=i>1?t.range(.1,.3):0,c=L().set(Math.sin(o)*s,1,Math.cos(o)*s).normalize(),l=i>1?L().set(Math.sin(o)*r*1.6,0,Math.cos(o)*r*1.6):L();this._growBranch({origin:l,dir:c,length:n*(i>1?t.range(.7,1):1),radius:r*(i>1?t.range(.55,.85):1),level:0,segments:e.trunkSegments,flex0:0,phase:t.f(),heightBase:0})}return this._growRoots(r),e.leafLevel<90&&this._growClusters(),this}_taper(e,t){let n=t===0?1.35:1;return(1-e*.94)**n*.96+.04}_rootFlare(e){let t=Math.max(.35,this.height*.045);return e>t*2.8?0:this.sp.rootFlare*Math.exp(-e/t)*.55}_growBranch(e){let t=this.sp,n=this.rng,r=Math.max(2,e.segments),i=e.dir.clone().normalize(),a=e.origin.clone(),o=e.level===0,s=t.broken&&o?n.range(.55,.88):1,c=e.length*s/r,l=n.f()*100,u=E(.08+e.level*.3,0,1),d=[],f=[],p=0;for(let s=0;s<=r;s++){let m=s/r,h=e.radius*this._taper(m,e.level)*(o?1:x(1,.6,m));if(s>0){let r=z(a.x*.6+l,a.y*.35,a.z*.6),s=z(a.z*.6-l,a.x*.35+3.1,a.y*.6),u=z(a.y*.6+l*2,a.z*.35-1.7,a.x*.6),d=t.gnarl*(o?.5:1)*(.6+.7*n.f());i.x+=r*d*.16,i.y+=s*d*.06,i.z+=u*d*.16,i.y+=t.curveUp*.1*(1-m*.4);let f=E(1-h/(e.radius+1e-4),0,1);i.y-=t.gravity*.11*f*(o?.15:1)*m,i.normalize(),a.addScaledVector(i,c)}let g=E((e.heightBase+m*e.length)/Math.max(this.height,.1),0,1.6);d.push({pos:a.clone(),dir:i.clone(),t:m,radius:h,flare:o?this._rootFlare(a.y):0,v:p,heightAbove:g,flex:x(e.flex0,u,m)}),p+=c*2.2,m>=t.branchZone[0]&&m<=t.branchZone[1]&&f.push(d[d.length-1]),this.crownRadius=Math.max(this.crownRadius,Math.hypot(a.x,a.z)+h)}let m={level:e.level,phase:e.phase,radius:e.radius,length:e.length,rings:d,noiseSeed:l,flexEnd:u,isTip:!1};this.branches.push(m);let h=t.levels-1;if(e.level>=h||e.radius<.005){m.isTip=!0,e.level>=t.leafLevel&&(m.leafTip={pos:a.clone(),dir:i.clone(),level:e.level,length:e.length,phase:e.phase,flex:u,heightAbove:E((e.heightBase+e.length)/Math.max(this.height,.1),0,1.6)});return}e.level>=t.leafLevel&&(m.leafTip={pos:a.clone(),dir:i.clone(),level:e.level,length:e.length,phase:e.phase,flex:u,heightAbove:E((e.heightBase+e.length)/Math.max(this.height,.1),0,1.6)});let g=[],_=t.whorls&&o?t.whorls:0,v=t.childCount[1]-t.childCount[0]+1,y=n.int(v)+t.childCount[0];if(_>0)for(let e=0;e<_;e++){let t=e/Math.max(_-1,1),r=f[Math.round(t*(f.length-1))];if(!r)continue;let i=Math.max(2,Math.round(y*x(1.15,.5,t))),a=n.f()*Math.PI*2;for(let e=0;e<i;e++)g.push({bp:r,angle:a+e/i*Math.PI*2+n.range(-.25,.25)})}else{let t=e.level>=h-1?1.35:1,r=Math.max(2,Math.round(y*(o?2.1:1)*t*x(.85,1.15,this.health))),i=n.f()*Math.PI*2;for(let e=0;e<r;e++){let e=f[n.int(Math.max(1,f.length))];e&&(i+=2.39996+n.range(-.5,.5),g.push({bp:e,angle:i}))}}let b=t.pipeExponent;for(let r of g){let i=r.bp;if(i.radius<.004)continue;let a=x(t.childLength[0],t.childLength[1],n.f()),s=e.length*a*x(1,.55,i.t);if(t.conical&&o&&(s*=x(1.3,.2,i.t)),s<.09)continue;let c=x(.3,.52,n.f()),l=i.radius*c**(1/b);if(l<.0032)continue;let d=x(t.childAngle[0],t.childAngle[1],n.f())*x(1.15,.8,i.t),f={t:L(),b:L()};R(i.dir,f);let p=L().copy(i.dir).multiplyScalar(Math.cos(d)).addScaledVector(f.t,Math.cos(r.angle)*Math.sin(d)).addScaledVector(f.b,Math.sin(r.angle)*Math.sin(d)).normalize();this._growBranch({origin:i.pos.clone().addScaledVector(p,i.radius*.55),dir:p,length:s,radius:l,level:e.level+1,segments:Math.max(3,Math.round(e.segments*.6)),flex0:x(e.flex0,u,i.t),phase:(e.phase+n.range(.12,.88))%1,heightBase:e.heightBase+i.t*e.length})}if(o&&n.f()<(t.forkChance??0)){let t=f[Math.floor(f.length*n.range(.35,.8))];if(t&&t.radius>.02){let r={t:L(),b:L()};R(t.dir,r);let i=n.range(.25,.55),a=n.f()*Math.PI*2,o=L().copy(t.dir).multiplyScalar(Math.cos(i)).addScaledVector(r.t,Math.cos(a)*Math.sin(i)).addScaledVector(r.b,Math.sin(a)*Math.sin(i)).normalize();this._growBranch({origin:t.pos.clone(),dir:o,length:e.length*n.range(.42,.68),radius:t.radius*n.range(.62,.82),level:0,segments:Math.round(e.segments*.7),flex0:x(e.flex0,u,t.t)*.6,phase:(e.phase+.37)%1,heightBase:e.heightBase+t.t*e.length})}}}_growRoots(e){let t=this.sp;if(!t.surfaceRoots)return;let n=this.rng;for(let r=0;r<t.surfaceRoots;r++){let i=r/t.surfaceRoots*Math.PI*2+n.range(-.5,.5),a=L().set(Math.cos(i),n.range(-.45,-.12),Math.sin(i)).normalize();this._growBranch({origin:L().set(Math.cos(i)*e*.6,e*n.range(.25,.9),Math.sin(i)*e*.6),dir:a,length:e*n.range(5.5,13),radius:e*n.range(.24,.42),level:1,segments:6,flex0:0,phase:n.f(),heightBase:0})}}_growClusters(){let e=this.sp,t=this.rng;for(let n of this.branches){let r=n.leafTip;if(!r)continue;let i=Math.max(1,Math.round(x(e.clustersPerTip[0],e.clustersPerTip[1],t.f())*x(.7,1.15,this.health))),a={t:L(),b:L()};R(r.dir,a);for(let n=0;n<i;n++){let n=t.f()**.6,i=L().copy(r.pos).addScaledVector(r.dir,-r.length*n*.88),o=r.length*.3+.04;i.addScaledVector(a.t,t.sym()*o),i.addScaledVector(a.b,t.sym()*o),i.y+=t.sym()*o*.6;let s=x(e.clusterSize[0],e.clusterSize[1],t.f())*x(.8,1.12,this.health),c=L().copy(i).sub(r.pos);c.lengthSq()<1e-8&&c.copy(r.dir),c.normalize();let l=L().copy(c).lerp(L().set(0,1,0),.32+t.range(-.25,.25));l.x+=t.sym()*.5,l.z+=t.sym()*.5,l.y-=e.leafDroop*t.f()*.7,l.lengthSq()<1e-8&&l.set(0,1,0),l.normalize();let u={t:L(),b:L()};R(l,u);let d=t.f()*Math.PI*2,f=Math.cos(d),p=Math.sin(d);this.clusters.push({centre:i,n:l,ax:L().addScaledVector(u.t,f).addScaledVector(u.b,p),ay:L().addScaledVector(u.t,-p).addScaledVector(u.b,f),nt:u.t.clone(),nbv:u.b.clone(),cr:f,sr:p,w:s*(e.needle?.55:1),h:s*(e.needle?1.9:e.leafAspect),size:s,seed:t.f(),cardRnd:t.f(),flex:E(r.flex+.28,0,1),phase:(r.phase+t.f())%1,heightNorm:r.heightAbove,crossed:t.f()<.45})}}}},ae=[{radial:1,segStride:1,prune:0,keep:1,cross:!0},{radial:.62,segStride:2,prune:.009,keep:.62,cross:!1},{radial:.42,segStride:3,prune:.018,keep:.34,cross:!1}];function oe(e,t){let n=ae[e],r=Math.max(0,t|0);return r<=0?n:{radial:n.radial+(e===0?0:.1*r),segStride:e===1&&r>=2?1:n.segStride,prune:n.prune*(1-.18*Math.min(r,2)),keep:Math.min(1,n.keep+.1*r),cross:n.cross||e===1&&r>=2}}function se(e,t,n){return e===0?Math.max(4,Math.round(E(t*42,7,14)*n)):e===1?Math.max(3,Math.round(7*n)):e===2?Math.max(3,Math.round(5*n)):3}function ce(e,t,n=0){let r=oe(t,n),i=new re,a=e.sp,o={t:L(),b:L()};for(let t of e.branches){if(t.radius<r.prune)continue;let e=se(t.level,t.radius,r.radial),n=t.rings.length>4?r.segStride:1,s=[];for(let e=0;e<t.rings.length;e+=n)s.push(t.rings[e]);s[s.length-1]!==t.rings[t.rings.length-1]&&s.push(t.rings[t.rings.length-1]);let c=null,l=null,u=null;for(let n of s){R(n.dir,o);let r=a.trunkTwist*n.t*(t.level===0?1:.4),s=[];for(let c=0;c<=e;c++){let l=c%e/e*Math.PI*2+r,u=Math.cos(l),d=Math.sin(l),f=n.radius;if(f*=1+.055*a.barkRidge*Math.sin(l*5+t.noiseSeed*3+n.pos.y*.7),f*=1+.03*Math.sin(l*11-t.noiseSeed+n.pos.y*1.9),f*=1+.075*z(u*2+t.noiseSeed,n.pos.y*.8,d*2)*(t.level===0?1:.5),n.flare>0){let e=Math.max(0,Math.sin(l*6+t.noiseSeed*5)*.5+.5)**1.6;f*=1+n.flare*(.35+1.15*e)}let p=L().copy(n.pos).addScaledVector(o.t,u*f).addScaledVector(o.b,d*f),m=L().addScaledVector(o.t,u).addScaledVector(o.b,d).normalize();s.push(i.vertex(p,m,[c/e*(n.radius*6.5),n.v],[f,t.level,n.heightAbove,t.phase],[n.flex,t.phase]))}if(l||(l=s,u=n),c)for(let t=0;t<e;t++)i.quad(c[t],s[t],s[t+1],c[t+1]);c=s}if(l&&u&&t.level===0){let n=L().copy(u.dir).negate(),r=i.vertex(u.pos,n,[0,u.v],[u.radius,t.level,u.heightAbove,t.phase],[u.flex,t.phase]);for(let t=0;t<e;t++)i.tri(l[t+1],l[t],r)}if(c&&t.isTip){let n=s[s.length-1],r=i.vertex(n.pos,n.dir,[0,n.v],[0,t.level,n.heightAbove,t.phase],[n.flex,t.phase]);for(let t=0;t<e;t++)i.tri(c[t],c[t+1],r)}}return i}function le(e,t,n=0){let r=oe(t,n),i=new re;if(!e.clusters.length)return i;let a=r.keep,o=1/Math.sqrt(Math.max(a,.02)),s=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]];for(let t=0;t<e.clusters.length;t++){let n=e.clusters[t];if(a<1&&n.cardRnd>a)continue;let c=n.w*o,l=n.h*o,u=e.sp.leafDroop,d=[];for(let[e,t]of s){let r=L().copy(n.centre).addScaledVector(n.ax,e*c).addScaledVector(n.ay,t*l);r.y-=u*Math.max(0,t+.5)*l*.3,d.push(i.vertex(r,n.n,[e+.5,t+.5],[n.seed,n.size*o,n.heightNorm,n.cardRnd],[n.flex,n.phase]))}if(i.quad(d[0],d[1],d[2],d[3]),r.cross&&n.crossed){let e=[];for(let[t,r]of s){let a=L().copy(n.centre).addScaledVector(n.nt,t*c*.85*-n.sr).addScaledVector(n.nbv,t*c*.85*n.cr).addScaledVector(n.n,r*l*.55);a.y-=u*Math.max(0,r+.5)*l*.22,e.push(i.vertex(a,n.ax,[t+.5,r+.5],[n.seed+.37,n.size*o*.85,n.heightNorm,n.cardRnd],[n.flex,n.phase]))}i.quad(e[0],e[1],e[2],e[3])}}return i}function ue(e,t,n={}){let r=new ie(e,t,n).grow(),i=n.detail??0,a=[];for(let e=0;e<ae.length;e++){let t=ce(r,e,i),n=le(r,e,i);a.push({branchGeometry:t.toGeometry(),leafGeometry:n.toGeometry(),triangles:t.triangles+n.triangles,leafCount:n.triangles/2})}return{height:r.height,radius:r.maxRadius,crownRadius:Math.max(r.crownRadius,r.maxRadius*3),branchCount:r.branches.length,clusterCount:r.clusters.length,lods:a}}var de=`
in vec4 iPosScale;   // xyz base position, w scale
in vec4 iRot;        // cos/sin yaw, lean x, lean z
in vec4 iVar;        // wind phase, season/health tint, variant random, lod fade
`,fe=`
uniform float uTreeHeight;
uniform float uWindAmp;
uniform vec4 uWeather;

mat3 instBasis(){
  // yaw plus a lean. Small leans stay a shear so healthy trees just nod;
  // once |iRot.zw| grows (storm failure) it becomes a real rotation about
  // the ground axis and the stem goes down instead of stretching.
  mat3 yaw = mat3(iRot.x, 0.0, iRot.y, 0.0, 1.0, 0.0, -iRot.y, 0.0, iRot.x);
  float amt = length(vec2(iRot.z, iRot.w));
  if(amt < 0.28){
    mat3 lean = mat3(1.0, 0.0, 0.0, iRot.z, 1.0, iRot.w, 0.0, 0.0, 1.0);
    return lean * yaw;
  }
  vec2 td = vec2(iRot.z, iRot.w) / max(amt, 1e-5);
  vec3 axis = normalize(vec3(-td.y, 0.0, td.x));
  float c = cos(amt), s = sin(amt), ic = 1.0 - c;
  mat3 R = mat3(
    c + axis.x*axis.x*ic,        axis.x*axis.y*ic - axis.z*s, axis.x*axis.z*ic + axis.y*s,
    axis.y*axis.x*ic + axis.z*s, c + axis.y*axis.y*ic,        axis.y*axis.z*ic - axis.x*s,
    axis.z*axis.x*ic - axis.y*s, axis.z*axis.y*ic + axis.x*s, c + axis.z*axis.z*ic
  );
  return R * yaw;
}

vec3 instanceBase(){
  float gy = mix(iPosScale.y, groundHeight(iPosScale.xz), mapInside(iPosScale.xz));
  return vec3(iPosScale.x, gy, iPosScale.z);
}

/**
 * Places a local-space vertex in the world and applies the multi-scale wind.
 * heightNorm is the vertex height above the tree base over total tree height;
 * flex is 0 on the trunk and approaches 1 at twig tips.
 */
vec3 treeVertex(vec3 local, float heightNorm, float flex, float phase, float t, out vec3 worldNoWind){
  mat3 B = instBasis();
  vec3 p = B * (local * iPosScale.w);
  vec3 base = instanceBase();
  vec3 world = base + p;
  worldNoWind = world;
  float hAbove = max(heightNorm, 0.0) * uTreeHeight * iPosScale.w;
  // structural bending: stiff near the trunk, loose at the tips
  vec3 d = windSwayAt(world, hAbove, 1.0 - flex * 0.92, phase, uWindAmp * (0.35 + 0.85 * flex), t);
  // limb-scale second order motion, so branches lag the trunk
  float s = windStrengthAt(world.xz, t);
  vec2 wd = normalize(uWind.xy + 1e-5);
  float lag = sin(t * (2.3 + 1.7 * phase) + phase * 17.0 + dot(world.xz, wd) * 0.31);
  d.xz += wd * lag * s * 0.006 * flex * flex * uTreeHeight * iPosScale.w;
  d.y += cos(t * (1.9 + 1.3 * phase) + phase * 11.0) * s * 0.0022 * flex * uTreeHeight * iPosScale.w;
  // a front passing through: extra whip on the tips, extra lean on the stem
  float storm = uWeather.y;
  d *= 1.0 + storm * (0.55 + 0.85 * flex) + uWind.w * 0.18;
  // a stem that has gone over should not keep whipping like a standing tree
  float fallen = smoothstep(0.34, 1.12, length(vec2(iRot.z, iRot.w)));
  d *= 1.0 - fallen * 0.92;
  return world + d;
}
`,pe=`
uniform vec3 uBarkA;
uniform vec3 uBarkB;
uniform vec4 uBarkParams;   // x ridge, y scale, z paper(birch), w plates(pine)
uniform float uBarkStrip;

/**
 * Bark height field in (around, along) coordinates, in metres. Fissures run
 * along the grain and are much longer than wide, which is the single strongest
 * cue that a cylinder is a trunk; plates and lenticels differentiate species.
 */
float barkHeight(vec2 uv, float radius, out float fissure, out float plate){
  float sc = uBarkParams.y;
  vec2 p = vec2(uv.x * 3.1, uv.y * 0.72) / max(sc, 0.05);
  // stretched ridged noise: the along-grain axis is compressed 6x
  float r1 = ridged(vec2(p.x * 1.0, p.y * 0.17), 4, 2.13, 0.52);
  float r2 = ridged(vec2(p.x * 2.7, p.y * 0.42) + 7.0, 3, 2.2, 0.5);
  float f = r1 * 0.68 + r2 * 0.32;
  fissure = smoothstep(0.28, 0.86, f);
  float h = f * uBarkParams.x;

  // cross checks: bark cracks are interrupted along the grain
  float cross = fbm(vec2(p.x * 0.8, p.y * 1.35) + 21.0, 3, 2.1, 0.5) * 0.5 + 0.5;
  h *= mix(0.55, 1.15, cross);

  // scaly plates
  plate = 0.0;
  if(uBarkParams.w > 0.01){
    vec3 w = worley2(vec2(p.x * 0.85, p.y * 0.30) + 3.7, 1.0);
    plate = smoothstep(0.05, 0.42, w.x);
    h += (1.0 - plate) * 0.55 * uBarkParams.w;
    h += fract(w.z * 31.7) * 0.18 * uBarkParams.w;
  }

  // fine grain everywhere
  h += (fbm(vec2(p.x * 9.0, p.y * 1.6) + 41.0, 3, 2.1, 0.5)) * 0.16;
  // metre-scale furrows: the fine ridged field dies as speckle at 528 px
  float furrow = 0.5 + 0.5 * sin(uv.x * 17.6
    + fbm(vec2(uv.x * 1.4, uv.y * 0.07) + 9.0, 2, 2.1, 0.5) * 2.2);
  furrow = pow(abs(furrow * 2.0 - 1.0), 0.58);
  h += furrow * 0.64 * uBarkParams.x;
  fissure = max(fissure, smoothstep(0.32, 0.86, furrow));
  // thinner bark on thin branches
  h *= mix(0.35, 1.0, clamp(radius * 6.0, 0.0, 1.0));
  return h;
}

struct Bark { vec3 albedo; vec3 normal; float rough; float occ; };

Bark barkSurface(vec3 wp, vec3 N, vec3 T, vec3 B, vec2 uv, float radius,
                 float level, float heightNorm, float rnd, float lodPx, vec4 eco, float wetness,
                 float fallen){
  Bark o;
  float fissure, plate;
  float e = max(0.0035, lodPx * 0.5);
  float h0 = barkHeight(uv, radius, fissure, plate);
  float fx, px;
  float hx = barkHeight(uv + vec2(e, 0.0), radius, fx, px);
  float hy = barkHeight(uv + vec2(0.0, e), radius, fx, px);
  vec2 grad = vec2(hx - h0, hy - h0) / e;

  float detFade = clamp(1.0 - lodPx * 1.55, 0.22, 1.0);
  vec3 nrm = normalize(N - (T * grad.x + B * grad.y) * 0.085 * detFade);

  float tone = fbm(uv * vec2(1.3, 0.11) + rnd * 17.0, 3, 2.1, 0.5) * 0.5 + 0.5;
  vec3 alb = mix(uBarkA, uBarkB, tone * 0.75 + 0.25 * fissure);
  // fissures are in shadow and darker wood
  alb *= mix(0.34, 1.10, smoothstep(0.0, 0.55, h0 / max(uBarkParams.x, 0.2)));
  o.occ = mix(0.50, 1.0, smoothstep(0.05, 0.6, h0 / max(uBarkParams.x, 0.2)));
  // slow value drift so a trunk is not one plastic brown
  float drift = fbm(uv * vec2(0.55, 0.045) + rnd * 5.0, 2, 2.1, 0.5) * 0.5 + 0.5;
  alb *= 0.84 + 0.28 * drift;

  // --- birch: white bark with dark lenticel bands and pink-grey patches
  if(uBarkParams.z > 0.01){
    float band = smoothstep(0.72, 0.98, fbm(vec2(uv.x * 0.55, uv.y * 9.5) + 5.0, 3, 2.1, 0.5) * 0.5 + 0.5);
    float lent = smoothstep(0.80, 1.0, fbm(vec2(uv.x * 5.5, uv.y * 26.0) + 12.0, 2, 2.1, 0.5) * 0.5 + 0.5);
    vec3 white = mix(vec3(0.285, 0.278, 0.262), vec3(0.415, 0.408, 0.392), tone);
    white = mix(white, vec3(0.165, 0.132, 0.118), smoothstep(0.5, 1.0, band) * 0.55);
    alb = mix(alb, white, uBarkParams.z * (1.0 - smoothstep(0.0, 0.10, heightNorm) * 0.0));
    alb = mix(alb, vec3(0.045, 0.040, 0.038), lent * 0.8 * uBarkParams.z);
    // peeling curls
    float peel = smoothstep(0.86, 1.0, fbm(vec2(uv.x * 2.2, uv.y * 3.1) + 31.0, 3, 2.1, 0.5) * 0.5 + 0.5);
    nrm = normalize(nrm + T * peel * 0.35 * detFade);
    o.occ *= mix(1.0, 0.7, peel);
  }

  // --- dead wood with the bark stripped off
  if(uBarkStrip > 0.01){
    float strip = smoothstep(0.42, 0.72, fbm(uv * vec2(0.9, 0.18) + 61.0, 4, 2.1, 0.5) * 0.5 + 0.5);
    vec3 wood = mix(vec3(0.135, 0.108, 0.080), vec3(0.205, 0.175, 0.132), tone);
    float grain = fbm(vec2(uv.x * 1.1, uv.y * 34.0) + 3.0, 2, 2.1, 0.5) * 0.5 + 0.5;
    wood *= 0.72 + 0.45 * grain;
    alb = mix(alb, wood, strip * uBarkStrip);
  }

  float rough = mix(0.92, 0.78, fissure);

  // --- moss and lichen: damp, shaded, low on the trunk, on the lee side
  float upFacing = clamp(nrm.y * 0.5 + 0.5, 0.0, 1.0);
  float northFacing = clamp(-nrm.z * 0.5 + 0.5, 0.0, 1.0);
  float lowness = 1.0 - smoothstep(0.0, 0.30, heightNorm);
  float mossAmt = smoothstep(0.30, 0.85, eco.r) * lowness * (0.35 + 0.65 * northFacing);
  mossAmt *= smoothstep(0.28, 0.72, fbm(wp.xz * 0.28 + wp.y * 0.10 + rnd * 11.0, 3, 2.1, 0.5) * 0.5 + 0.5);
  mossAmt *= 1.0 - fissure * 0.18;
  mossAmt = clamp(mossAmt * 1.75, 0.0, 1.0);
  if(mossAmt > 0.01){
    float mv = fbm(wp.xz * 6.5 + wp.y * 3.0, 3, 2.1, 0.5) * 0.5 + 0.5;
    vec3 moss = mix(vec3(0.030, 0.062, 0.022), vec3(0.062, 0.108, 0.036), mv);
    alb = mix(alb, moss, mossAmt * 0.92);
    rough = mix(rough, 0.96, mossAmt);
    o.occ = mix(o.occ, o.occ * 0.85, mossAmt);
  }
  float lichAmt = smoothstep(0.55, 0.92, fbm(wp.xz * 2.2 + wp.y * 1.1 + 77.0, 4, 2.1, 0.5) * 0.5 + 0.5)
                * (0.25 + 0.75 * upFacing) * (1.0 - mossAmt * 0.8);
  alb = mix(alb, mix(vec3(0.145, 0.150, 0.118), vec3(0.195, 0.192, 0.150), tone), lichAmt * 0.42);

  // --- wet bark: darker and glossier, worst near the base.
  // a stem on the ground turns its old side into a sky face — that face
  // should stay readable (wet sheen, not an ink slab)
  float wet = clamp(wetness * (0.55 + 0.45 * lowness) + uWeather.w * 0.85, 0.0, 1.0);
  float skyFace = clamp(nrm.y, 0.0, 1.0);
  float crush = mix(0.64, 0.90, skyFace * fallen);
  alb *= mix(1.0, crush, wet);
  alb *= 1.0 + fallen * skyFace * 0.22;
  // standing wet bark stays matte; only a fallen sky-face goes glossy
  float wetRough = mix(0.68, mix(0.28, 0.16, skyFace), fallen);
  rough = mix(rough, wetRough, wet * mix(0.35, 0.80, fallen));

  o.albedo = clamp(alb, vec3(0.004), vec3(0.75));
  o.normal = nrm;
  o.rough = clamp(rough, 0.08, 1.0);
  return o;
}
`,me=`
uniform vec3 uLeafA;
uniform vec3 uLeafB;
uniform vec3 uLeafAutumnA;
uniform vec3 uLeafAutumnB;
uniform vec4 uLeafParams;    // x leaflet count, y needle, z transmission, w aspect

float leafletSDF(vec2 p, float width, float serr, float seed){
  float y = p.y;
  if(y < -0.03 || y > 1.03) return 1.0;
  float yy = clamp(y, 0.0, 1.0);
  float w = width * pow(max(sin(3.14159265 * yy), 0.0), 0.52);
  w *= 1.0 - 0.34 * smoothstep(0.62, 1.0, yy);
  w += serr * width * 0.20 * sin(yy * 34.0 + seed * 24.0)
       * smoothstep(0.05, 0.22, yy) * smoothstep(1.0, 0.82, yy);
  return abs(p.x) - w;
}

/**
 * Compound leaf cluster in card space. Returns coverage plus per-leaflet data
 * used for shading: the local axis for veins, an id for colour variation, and
 * the position along the blade for curl.
 */
float leafCluster(vec2 uv, float seed, out vec2 local, out float lid, out float rib){
  local = vec2(0.0); lid = 0.0; rib = 0.0;
  int n = int(uLeafParams.x);
  vec2 p = uv - vec2(0.5, 0.04);

  // A needle or leaflet thinner than a pixel disappears, which is what makes a
  // spruce read as a bare stick at thirty metres. Widen the analytic outline to
  // at least a pixel; slight over-coverage is far less objectionable than a tree
  // losing its foliage.
  float pxW = max(fwidth(uv.x), fwidth(uv.y)) * 0.62;

  if(uLeafParams.y > 0.5){
    // --- needles: a dense fan of blades from the card base
    float best = 1.0;
    for(int i = 0; i < 20; i++){
      if(i >= n) break;
      float fi = (float(i) + 0.5) / float(n);
      float h = fract(sin(fi * 91.7 + seed * 53.1) * 43758.5453);
      float ang = (fi - 0.5) * 1.72 + (h - 0.5) * 0.22;
      float len = 0.70 + 0.32 * h;
      float c = cos(ang), s = sin(ang);
      vec2 q = mat2(c, -s, s, c) * p;
      q.y /= len;
      float hw = max((0.052 + 0.024 * (1.0 - q.y)) * (1.0 - smoothstep(0.88, 1.0, q.y)), pxW);
      float d = abs(q.x) - hw;
      if(q.y < 0.0 || q.y > 1.0) d = 1.0;
      if(d < best){ best = d; local = q; lid = fi; }
    }
    rib = 1.0 - smoothstep(0.0, 0.020, abs(local.x));
    return -best;
  }

  // --- broadleaf: leaflets alternating along a short rachis
  float best = 1.0;
  for(int i = 0; i < 8; i++){
    if(i >= n) break;
    float fi = (float(i) + 0.5) / float(n);
    float h = fract(sin(fi * 71.3 + seed * 37.7) * 24634.6345);
    float side = (fract(float(i) * 0.5) < 0.25) ? 1.0 : -1.0;
    float baseY = fi * 0.44;
    float ang = side * (0.42 + 0.55 * (1.0 - fi)) + (h - 0.5) * 0.30;
    float len = (0.52 + 0.40 * (1.0 - abs(fi - 0.45) * 1.4)) * (0.85 + 0.3 * h);
    float c = cos(ang), s = sin(ang);
    vec2 q = mat2(c, -s, s, c) * (p - vec2(0.0, baseY));
    q.y /= len;
    float d = leafletSDF(q, max(0.185 * (0.85 + 0.3 * h), pxW * 1.6), 1.0, seed + fi);
    if(d < best){ best = d; local = q; lid = fi + h; }
  }
  // midrib and side veins
  float mid = 1.0 - smoothstep(0.0, 0.016, abs(local.x));
  float side2 = 1.0 - smoothstep(0.0, 0.5, abs(fract(local.y * 7.0 + abs(local.x) * 3.4) - 0.5) * 2.0);
  rib = clamp(mid + side2 * 0.35 * smoothstep(0.02, 0.14, abs(local.x)), 0.0, 1.0);
  return -best;
}

struct Leaf { vec3 albedo; vec3 normal; float rough; float trans; float occ; float thin; };

Leaf leafSurface(vec3 wp, vec3 N, vec3 T, vec3 B, vec2 uv, float seed, float heightNorm,
                 float rnd, float season, float lodPx, out float coverage){
  Leaf o;
  vec2 local; float lid, rib;
  float cov = leafCluster(uv, seed, local, lid, rib);
  coverage = cov;

  float idv = fract(lid * 7.31 + seed * 3.7);
  // young leaves at the tips are lighter and yellower, shaded interior darker
  float lightness = mix(0.55, 1.35, fract(idv * 5.7)) * mix(0.8, 1.15, heightNorm);
  vec3 green = mix(uLeafA, uLeafB, fract(idv * 2.3)) * lightness;
  vec3 autumn = mix(uLeafAutumnA, uLeafAutumnB, fract(idv * 3.9));
  // autumn arrives unevenly across the crown and across individual leaves
  float turn = clamp(season * (0.55 + 0.9 * fract(idv * 11.3)) * (0.5 + 0.8 * heightNorm), 0.0, 1.0);
  vec3 alb = mix(green, autumn, turn);

  // blade shading: dark veins, translucent between them, dried edges
  alb *= mix(1.0, 0.62, rib * 0.8);
  float edge = smoothstep(0.0, 0.10, cov);
  alb *= mix(0.82, 1.0, edge);
  float dry = smoothstep(0.55, 1.0, fract(idv * 17.9)) * (0.35 + 0.65 * season);
  alb = mix(alb, mix(vec3(0.115, 0.075, 0.030), vec3(0.165, 0.115, 0.045), idv), dry * (1.0 - edge * 0.4) * 0.55);

  // --- curvature: leaflets cup along their midrib and curl at the tip
  vec3 nrm = N;
  float curl = (0.55 + 0.6 * fract(idv * 13.1));
  nrm = normalize(nrm + T * local.x * curl * 1.5 + B * (local.y - 0.45) * curl * 0.55);
  // vein micro-relief
  float vr = sin(local.y * 44.0 + local.x * 12.0) * 0.12;
  nrm = normalize(nrm + T * vr * (1.0 - rib) * clamp(1.0 - lodPx * 3.0, 0.0, 1.0));

  o.albedo = clamp(alb, vec3(0.004), vec3(0.8));
  o.normal = nrm;
  // cuticle: young leaves are glossier, dried ones matte
  o.rough = clamp(mix(0.44, 0.70, fract(idv * 4.1)) + dry * 0.22 + uWeather.w * -0.10, 0.12, 1.0);
  o.trans = uLeafParams.z * mix(0.75, 1.25, 1.0 - rib) * mix(1.0, 0.55, turn);
  o.occ = mix(0.62, 1.0, heightNorm) * mix(0.85, 1.0, edge);
  o.thin = 1.0 - rib * 0.6;
  return o;
}
`;function he(){return y.pick(`uTime`,`uDelta`,`uCamPos`,`uWind`,`uWindPhase`,`uWeather`,`uJitter`,`uViewProj`,`uPrevViewProj`,`uFog`)}function ge(e,t,n={}){let r={...he(),...e.sharedUniforms,uTreeHeight:{value:n.height??20},uWindAmp:{value:.0075},uBarkA:{value:new a(...t.barkColor[0])},uBarkB:{value:new a(...t.barkColor[1])},uBarkParams:{value:new o(t.barkRidge??1,t.barkScale??1,t.barkPaper??0,t.barkPlates??0)},uBarkStrip:{value:t.barkStrip??0}},i=`
precision highp float;
precision highp int;
uniform float uTime; uniform float uDelta;
${M}
${_}
${w}
${de}
${fe}
uniform mat4 projectionMatrix; uniform mat4 viewMatrix;
uniform mat4 uViewProj; uniform mat4 uPrevViewProj;
in vec3 position; in vec3 normal; in vec2 uv; in vec4 aExtra; in vec2 aSway;
out vec3 vWorld; out vec3 vNormal; out vec2 vUv; out vec4 vExtra;
out vec4 vCur; out vec4 vPrev; out float vFade; out float vFallen;
void main(){
  float phase = fract(aSway.y + iVar.x);
  vec3 wnw;
  vec3 world = treeVertex(position, aExtra.z, aSway.x, phase, uWindPhase.x, wnw);
  vec3 prevWorld = treeVertex(position, aExtra.z, aSway.x, phase, uWindPhase.x - uDelta, wnw);
  vWorld = world;
  vNormal = normalize(instBasis() * normal);
  vUv = uv;
  vExtra = aExtra;
  vFade = iVar.w;
  vFallen = smoothstep(0.34, 1.12, length(vec2(iRot.z, iRot.w)));
  vCur = uViewProj * vec4(world, 1.0);
  vPrev = uPrevViewProj * vec4(prevWorld, 1.0);
  gl_Position = ${n.shadow?`projectionMatrix * (viewMatrix * vec4(world, 1.0))`:`vCur`};
}
`;if(n.shadow)return new c({glslVersion:P,uniforms:r,vertexShader:i,fragmentShader:`precision highp float;
        layout(location = 0) out vec4 oCol;
        void main(){ oCol = vec4(1.0); }`,side:0});let s=`
precision highp float;
precision highp int;
uniform vec3 uCamPos; uniform vec4 uWeather; uniform float uTime;
${M}
${w}
${pe}
${g}
in vec3 vWorld; in vec3 vNormal; in vec2 vUv; in vec4 vExtra;
in vec4 vCur; in vec4 vPrev; in float vFade; in float vFallen;
void main(){
  if(vFade < 0.999){
    float d = ign(gl_FragCoord.xy, 1.7);
    if(d > vFade) discard;
  }
  vec3 dp1 = dFdx(vWorld), dp2 = dFdy(vWorld);
  vec2 du1 = dFdx(vUv), du2 = dFdy(vUv);
  vec3 T = dp1 * du2.y - dp2 * du1.y;
  vec3 B = -dp1 * du2.x + dp2 * du1.x;
  float tl = length(T), bl = length(B);
  T = tl > 1e-6 ? T / tl : vec3(1.0, 0.0, 0.0);
  B = bl > 1e-6 ? B / bl : vec3(0.0, 0.0, 1.0);
  vec3 N = normalize(vNormal);
  if(!gl_FrontFacing) N = -N;

  float lodPx = length(vec2(length(du1), length(du2)));
  vec4 eco = ecoSample(vWorld.xz);
  vec4 mapv = mapSample(vWorld.xz);
  Bark b = barkSurface(vWorld, N, T, B, vUv, vExtra.x, vExtra.y, vExtra.z, vExtra.w,
                       lodPx, eco, clamp(mapv.b, 0.0, 1.0), vFallen);
  writeGBuffer(b.albedo, b.occ, b.normal, b.rough, 0.0, vCur, vPrev, ${2 .toFixed(1)}, 0.0);
}
`;return new c({glslVersion:P,uniforms:r,vertexShader:i,fragmentShader:s,side:0})}function _e(e,t,n={}){let r={...he(),...e.sharedUniforms,uTreeHeight:{value:n.height??20},uWindAmp:{value:.0075},uLeafA:{value:new a(...t.leafColor[0])},uLeafB:{value:new a(...t.leafColor[1])},uLeafAutumnA:{value:new a(...t.leafAutumn[0])},uLeafAutumnB:{value:new a(...t.leafAutumn[1])},uLeafParams:{value:new o(t.leafletCount||4,+!!t.needle,t.transmission??.6,t.leafAspect??1.2)},uSeason:{value:0},uAlphaRef:{value:0}},i=`
precision highp float;
precision highp int;
uniform float uTime; uniform float uDelta;
${M}
${_}
${w}
${de}
${fe}
uniform mat4 projectionMatrix; uniform mat4 viewMatrix;
uniform mat4 uViewProj; uniform mat4 uPrevViewProj;
in vec3 position; in vec3 normal; in vec2 uv; in vec4 aExtra; in vec2 aSway;
out vec3 vWorld; out vec3 vNormal; out vec2 vUv; out vec4 vExtra;
out vec4 vCur; out vec4 vPrev; out float vFade; out float vFallen;

/** Card-local flutter: twist and flap about the card centre. */
vec3 leafFlutter(vec3 local, vec3 world, float phase, float flex, float t){
  float s = windStrengthAt(world.xz, t);
  float a = t * (5.2 + 3.4 * phase) + phase * 41.0 + dot(world.xz, vec2(0.31, 0.27));
  float amp = clamp(s * 0.020, 0.0, 0.55) * (0.35 + 0.9 * flex);
  vec2 c = (uv - 0.5);
  vec3 off = vec3(0.0);
  // flap: the free edge lifts more than the attached edge
  off.y += sin(a) * amp * aExtra.y * (0.35 + c.y);
  off.x += cos(a * 1.31 + 1.1) * amp * aExtra.y * c.x * 1.4;
  off.z += sin(a * 0.87 + 2.3) * amp * aExtra.y * c.x * 1.4;
  return off;
}

void main(){
  float phase = fract(aSway.y + iVar.x);
  vec3 wnw;
  vec3 world = treeVertex(position, aExtra.z, aSway.x, phase, uWindPhase.x, wnw);
  world += leafFlutter(position, wnw, phase, aSway.x, uWindPhase.x);
  vec3 prevWorld = treeVertex(position, aExtra.z, aSway.x, phase, uWindPhase.x - uDelta, wnw);
  prevWorld += leafFlutter(position, wnw, phase, aSway.x, uWindPhase.x - uDelta);
  vWorld = world;
  vNormal = normalize(instBasis() * normal);
  vUv = uv;
  vExtra = aExtra;
  vFade = iVar.w;
  vFallen = smoothstep(0.34, 1.12, length(vec2(iRot.z, iRot.w)));
  vCur = uViewProj * vec4(world, 1.0);
  vPrev = uPrevViewProj * vec4(prevWorld, 1.0);
  gl_Position = ${n.shadow?`projectionMatrix * (viewMatrix * vec4(world, 1.0))`:`vCur`};
}
`,s=`
precision highp float;
precision highp int;
uniform vec4 uWeather; uniform float uTime;
${M}
${me}
layout(location = 0) out vec4 oCol;
in vec3 vWorld; in vec3 vNormal; in vec2 vUv; in vec4 vExtra;
in vec4 vCur; in vec4 vPrev; in float vFade; in float vFallen;
void main(){
  vec2 local; float lid, rib;
  float cov = leafCluster(vUv, vExtra.x, local, lid, rib);
  if(cov < 0.002) discard;
  if(vFallen > 0.55 && ign(vWorld.xz * 11.0, vExtra.x) > mix(0.88, 0.30, vFallen)) discard;
  oCol = vec4(1.0);
}
`;if(n.shadow)return new c({glslVersion:P,uniforms:r,vertexShader:i,fragmentShader:s,side:2});let l=`
precision highp float;
precision highp int;
uniform vec3 uCamPos; uniform vec4 uWeather; uniform float uTime; uniform float uSeason;
${M}
${w}
${me}
${g}
in vec3 vWorld; in vec3 vNormal; in vec2 vUv; in vec4 vExtra;
in vec4 vCur; in vec4 vPrev; in float vFade; in float vFallen;
void main(){
  if(vFade < 0.999){
    float d = ign(gl_FragCoord.xy, 3.1);
    if(d > vFade) discard;
  }
  // a stem on the ground keeps some crown, but not a standing leaf wall
  if(vFallen > 0.55 && ign(vWorld.xz * 11.0, vExtra.x) > mix(0.88, 0.30, vFallen)) discard;
  vec3 dp1 = dFdx(vWorld), dp2 = dFdy(vWorld);
  vec2 du1 = dFdx(vUv), du2 = dFdy(vUv);
  vec3 T = dp1 * du2.y - dp2 * du1.y;
  vec3 B = -dp1 * du2.x + dp2 * du1.x;
  float tl = length(T), bl = length(B);
  T = tl > 1e-6 ? T / tl : vec3(1.0, 0.0, 0.0);
  B = bl > 1e-6 ? B / bl : vec3(0.0, 0.0, 1.0);
  vec3 N = normalize(vNormal);
  if(!gl_FrontFacing) N = -N;

  float lodPx = length(vec2(length(du1), length(du2)));
  float cov;
  Leaf lf = leafSurface(vWorld, N, T, B, vUv, vExtra.x, vExtra.z, vExtra.w,
                        uSeason, lodPx, cov);
  // stochastic coverage: after temporal accumulation this resolves to a smooth
  // edge without needing sorted transparency
  float thr = mix(0.006, 0.05, clamp(lodPx * 8.0, 0.0, 1.0));
  if(cov < thr * (0.35 + 0.9 * ign(gl_FragCoord.xy, 2.3))) discard;

  vec4 mapv = mapSample(vWorld.xz);
  float wet = clamp(uWeather.w * 0.9, 0.0, 1.0);
  vec3 alb = lf.albedo * mix(1.0, 0.72, wet);
  float rough = mix(lf.rough, 0.14, wet * 0.7);
  writeGBuffer(alb, lf.occ, lf.normal, rough, lf.trans, vCur, vPrev,
              ${1 .toFixed(1)}, lf.thin);
}
`;return new c({glslVersion:P,uniforms:r,vertexShader:i,fragmentShader:l,side:2})}function ve(e,t,n={}){let r={...he(),...e.sharedUniforms,uTreeHeight:{value:n.height??20},uWindAmp:{value:.0075},uLeafA:{value:new a(...t.leafColor[0])},uLeafB:{value:new a(...t.leafColor[1])},uLeafAutumnA:{value:new a(...t.leafAutumn[0])},uLeafAutumnB:{value:new a(...t.leafAutumn[1])},uBarkA:{value:new a(...t.barkColor[0])},uBarkB:{value:new a(...t.barkColor[1])},uCrown:{value:new o(t.crownWidth??1.1,+(t.kind===`conifer`),t.transmission??.5,+(t.kind===`dead`))},uSeason:{value:0}},i=`
precision highp float;
precision highp int;
uniform float uTime; uniform float uDelta;
${M}
${_}
${w}
${de}
uniform float uTreeHeight; uniform float uWindAmp;
uniform vec4 uWeather;
uniform mat4 projectionMatrix; uniform mat4 viewMatrix;
uniform mat4 uViewProj; uniform mat4 uPrevViewProj;
uniform vec3 uCamPos;
uniform vec4 uCrown;
in vec3 position;   // x = -0.5..0.5 across, y = 0..1 up, z = card index (0/1)
in vec2 uv;
out vec3 vWorld; out vec2 vUv; out vec4 vCur; out vec4 vPrev;
out float vFade; out float vSeed; out vec3 vCardN; out vec3 vRight; out float vTreeH;

vec3 place(float t){
  float gy = mix(iPosScale.y, groundHeight(iPosScale.xz), mapInside(iPosScale.xz));
  vec3 base = vec3(iPosScale.x, gy, iPosScale.z);
  float h = uTreeHeight * iPosScale.w;
  float w = h * uCrown.x * 1.08;
  vec3 toCam = uCamPos - base; toCam.y = 0.0;
  float l = length(toCam);
  vec3 f = l > 1e-4 ? toCam / l : vec3(0.0, 0.0, 1.0);
  vec3 r0 = normalize(vec3(-f.z, 0.0, f.x));
  float ang = position.z * 2.0943951;
  vec3 r = normalize(r0 * cos(ang) + f * sin(ang));
  float amt = length(vec2(iRot.z, iRot.w));
  vec3 up = vec3(0.0, 1.0, 0.0);
  if(amt > 0.001){
    vec2 td = vec2(iRot.z, iRot.w) / amt;
    up = normalize(vec3(td.x * sin(amt), cos(amt), td.y * sin(amt)));
  }
  vec3 p = base + r * (position.x * w) + up * (position.y * h);
  float phase = fract(iVar.x);
  vec3 d = windSwayAt(p, position.y * h, 0.35, phase, uWindAmp * (0.9 + uWeather.y * 0.8), t);
  return p + d;
}

void main(){
  vec3 world = place(uWindPhase.x);
  vec3 prev = place(uWindPhase.x - uDelta);
  vWorld = world;
  vUv = uv;
  vSeed = iVar.z;
  vFade = iVar.w;
  vTreeH = uTreeHeight * iPosScale.w;
  float gy = mix(iPosScale.y, groundHeight(iPosScale.xz), mapInside(iPosScale.xz));
  vec3 base = vec3(iPosScale.x, gy, iPosScale.z);
  vec3 toCam = uCamPos - base; toCam.y = 0.0;
  float l = length(toCam);
  vec3 f = l > 1e-4 ? toCam / l : vec3(0.0, 0.0, 1.0);
  vec3 r0v = normalize(vec3(-f.z, 0.0, f.x));
  float angV = position.z * 2.0943951;
  vRight = normalize(r0v * cos(angV) + f * sin(angV));
  vCardN = normalize(cross(vec3(0.0, 1.0, 0.0), vRight));
  vCur = uViewProj * vec4(world, 1.0);
  vPrev = uPrevViewProj * vec4(prev, 1.0);
  gl_Position = ${n.shadow?`projectionMatrix * (viewMatrix * vec4(world, 1.0))`:`vCur`};
}
`,s=`
uniform vec4 uCrown;
uniform vec3 uLeafA; uniform vec3 uLeafB;
uniform vec3 uLeafAutumnA; uniform vec3 uLeafAutumnB;
uniform vec3 uBarkA; uniform vec3 uBarkB;
uniform float uSeason;

// Crown half-width. Broadleaf is a spreading mass, not a sine egg / cone.
float crownProfile(float y, float conifer){
  float broad = smoothstep(0.16, 0.34, y) * smoothstep(1.04, 0.74, y);
  broad *= 0.78 + 0.22 * sin(y * 2.7);
  float cone = clamp(1.0 - (y - 0.08) / 0.96, 0.0, 1.0);
  cone = pow(cone, 0.88) * smoothstep(0.0, 0.08, y);
  return mix(broad, cone, conifer);
}

/**
 * Distant crown. Built to hold up at 80–150 px (mid-stand cards), not only
 * at a 30 px stamp. Broadleaf is overlapping clumps on a wide body; the
 * old sine envelope turned every distant tree into a green cone.
 */
float crownMask(vec2 uv, float seed, out float depth, out float clump){
  float y = uv.y;
  float x = (uv.x - 0.5) * 2.0;
  float conifer = uCrown.y;
  float dead = uCrown.w;
  float prof = crownProfile(y, conifer);
  depth = 0.0;
  clump = fract(seed * 7.13);
  if(prof <= 0.002 && dead < 0.5) return 0.0;

  float m = 0.0;

  if(dead > 0.5){
    for(int i = 0; i < 3; i++){
      float fi = float(i);
      vec3 h = hash33(vec3(seed * 19.0, fi + 2.4, 5.1));
      float cy = mix(0.42, 0.88, h.x);
      float cx = (h.y * 2.0 - 1.0) * 0.22;
      float rr = mix(0.10, 0.18, h.z);
      vec2 d = vec2(x - cx, (y - cy) * 1.6);
      float lm = smoothstep(1.15, 0.35, length(d) / rr);
      if(lm > m){ m = lm; depth = rr * 0.4; clump = h.x; }
    }
    return m;
  }

  if(conifer > 0.5){
    // ragged tiers: hemline noise so a pine is not a filled cone
    for(int i = 0; i < 5; i++){
      float fi = float(i);
      vec3 h = hash33(vec3(seed * 11.0, fi * 2.9, 1.7));
      float y0 = mix(0.12, 0.74, fi / 4.0) + (h.x - 0.5) * 0.04;
      float y1 = y0 + mix(0.16, 0.26, h.y);
      if(y < y0 - 0.03 || y > y1 + 0.03) continue;
      float t = clamp((y - y0) / max(y1 - y0, 1e-3), 0.0, 1.0);
      float halfW = mix(1.08, 0.18, t) * mix(1.00, 0.42, fi / 4.5);
      halfW *= (0.78 + 0.34 * h.z);
      float hem = 0.16 * sin((x) * 13.0 + seed * 6.0 + fi * 2.1)
                + 0.08 * sin(y * 22.0 - fi * 3.0 + seed * 4.0);
      float cx = (h.y - 0.5) * 0.16;
      float wx = abs(x - cx) / max(halfW, 1e-3);
      float lm = (1.0 - smoothstep(0.70 + hem, 1.12 + hem, wx))
               * smoothstep(-0.04, 0.07, y - y0)
               * smoothstep(y1 + 0.04, y1 - 0.05, y);
      if(lm > m){
        m = lm;
        clump = fract(h.x * 5.1 + fi * 0.27);
        depth = (1.0 - t) * halfW * 0.45;
      }
    }
  } else {
    // wide body so a 100 px card is a canopy mass, not a pill or a box
    float body = smoothstep(0.18, 0.34, y) * smoothstep(1.02, 0.68, y);
    float wob = 0.18 * sin(y * 13.0 + seed * 9.0) + 0.11 * sin(y * 25.0 - seed * 4.0)
              + 0.07 * sin(x * 9.0 + seed * 6.0);
    body *= smoothstep(1.32, 0.44, abs(x) + wob);
    m = max(m, body * 0.72);
    depth = body * 0.35;
    const int LOBES = 8;
    for(int i = 0; i < LOBES; i++){
      float fi = float(i);
      vec3 h = hash33(vec3(seed * 37.1, fi * 1.7, 3.13));
      float cy = mix(0.30, 0.94, mix(h.x, 0.28 + 0.72 * h.x, 0.55));
      float pr = max(crownProfile(cy, 0.0), 0.35);
      float cx = (h.y * 2.0 - 1.0) * pr * 0.78;
      float rr = mix(0.32, 0.64, h.z) * (0.74 + 0.58 * pr);
      vec2 d = vec2(x - cx, (y - cy) * 1.05);
      float dd = length(d) / max(rr, 1e-3);
      if(dd > 1.9) continue;
      float ang = atan(d.y, d.x);
      float scallop = 1.0
        + 0.32 * sin(ang * 3.0 + seed * 17.0 + fi * 2.3)
        + 0.16 * sin(ang * 5.0 - fi * 1.7 + seed * 9.0);
      float lm = smoothstep(scallop, scallop * 0.38, dd);
      if(lm > m){
        m = lm;
        clump = fract(h.x * 7.31 + fi * 0.37);
        depth = sqrt(max(0.0, 1.0 - min(dd, 1.0) * min(dd, 1.0))) * rr;
      }
    }
  }
  if(m <= 0.001) return 0.0;

  // one soft sky gap, kept large so it reads at 30 px without speckling
  vec3 g0 = hash33(vec3(seed * 13.0, 4.2, 8.1));
  vec2 hole0 = vec2((g0.x - 0.5) * 0.95, mix(0.48, 0.84, g0.y));
  float hr0 = mix(0.12, 0.22, g0.z);
  m *= 1.0 - 0.30 * smoothstep(hr0, hr0 * 0.30, length(vec2(x - hole0.x, (y - hole0.y) * 1.15)));

  // conifer only: keep a taper. Broadleaf must not inherit a cone envelope.
  if(conifer > 0.5){
    float envelope = smoothstep(1.45, 0.62, abs(x) / max(prof, 1e-3));
    m *= mix(0.20, 1.0, envelope);
  }
  // Leaf-scale bite when the card is large on screen. A filled capsule
  // at 80–150 px reads as a green block; holes keep it a canopy.
  float uvPx = 1.0 / max(length(dFdx(uv)) + length(dFdy(uv)), 1e-4);
  float close = smoothstep(36.0, 88.0, uvPx);
  if(close > 0.04 && conifer < 0.5){
    float leaf = fbm(uv * 16.0 + seed * 8.0, 3, 2.12, 0.52) * 0.5 + 0.5;
    float bite = smoothstep(0.16, 0.58, leaf);
    m *= mix(1.0, 0.42 + 0.58 * bite, close * 0.72);
  }
  return m;
}
`;return n.shadow?new c({glslVersion:P,uniforms:r,vertexShader:i,fragmentShader:`
precision highp float;
${M}
${s}
layout(location = 0) out vec4 oCol;
in vec3 vWorld; in vec2 vUv; in vec4 vCur; in vec4 vPrev;
in float vFade; in float vSeed; in vec3 vCardN; in vec3 vRight; in float vTreeH;
void main(){
  float depth, clump;
  float m = crownMask(vUv, vSeed, depth, clump);
  float trunk = 1.0 - smoothstep(0.010, 0.030, abs(vUv.x - 0.5));
  trunk *= 1.0 - smoothstep(0.30, 0.45, vUv.y);
  if(max(m, trunk) < 0.28) discard;
  oCol = vec4(1.0);
}
`,side:2}):new c({glslVersion:P,uniforms:r,vertexShader:i,fragmentShader:`
precision highp float;
precision highp int;
uniform vec3 uCamPos; uniform vec4 uWeather; uniform float uTime;
${M}
${w}
${s}
${g}
in vec3 vWorld; in vec2 vUv; in vec4 vCur; in vec4 vPrev;
in float vFade; in float vSeed; in vec3 vCardN; in vec3 vRight; in float vTreeH;
void main(){
  if(vFade < 0.999){
    float d = ign(gl_FragCoord.xy, 7.7);
    if(d > vFade) discard;
  }
  float depth, clump;
  float m = crownMask(vUv, vSeed, depth, clump);
  float trunkW = 0.016 + 0.018 * uCrown.w;
  float trunk = 1.0 - smoothstep(trunkW, trunkW * 2.6, abs(vUv.x - 0.5));
  trunk *= 1.0 - smoothstep(0.28, 0.50, vUv.y);
  float cov = max(m, trunk * 0.92);
  if(cov < 0.18) discard;

  vec3 up = vec3(0.0, 1.0, 0.0);
  // spherical crown normal so the billboard shades like a volume
  vec3 N = normalize(vRight * (vUv.x - 0.5) * 2.0 + up * (vUv.y - 0.55) * 1.2 + vCardN * max(depth, 0.15) * 2.0);
  bool isTrunk = trunk > m;
  vec3 alb;
  float rough, trans, occ;
  if(isTrunk){
    // cylindrical shading across the narrow trunk strip
    float across = clamp(abs(vUv.x - 0.5) / max(trunkW * 2.4, 1e-4), 0.0, 1.0);
    alb = mix(uBarkA, uBarkB, 0.35 + 0.4 * fract(vSeed * 7.1)) * (0.55 + 0.65 * (1.0 - across));
    N = normalize(vRight * (vUv.x - 0.5) * 30.0 + vCardN * max(1.0 - across, 0.15));
    rough = 0.9; trans = 0.0; occ = 0.55;
  } else {
    float idv = fract(vSeed * 13.7 + clump * 3.3);
    vec3 green = mix(uLeafA, uLeafB, idv) * mix(0.62, 1.22, clump);
    vec3 autumn = mix(uLeafAutumnA, uLeafAutumnB, idv);
    alb = mix(green, autumn, clamp(uSeason * (0.6 + 0.7 * idv), 0.0, 1.0));
    if(uCrown.w > 0.5) alb = mix(uBarkA, uBarkB, idv) * 0.8;
    // self-shadowing: dark underside, brighter sunlit crown top. That
    // height gradient is what stops a distant tree reading as a stamp.
    float shade = clump * 0.36 + 0.64 * smoothstep(0.18, 0.88, vUv.y);
    alb *= mix(0.18, 0.94, shade);
    rough = 0.56; trans = uCrown.z * 0.72;
    occ = mix(0.28, 1.0, shade);
  }
  alb *= mix(1.0, 0.74, uWeather.w);
  writeGBuffer(alb, occ, N, rough, trans, vCur, vPrev,
    isTrunk ? ${2 .toFixed(1)} : ${1 .toFixed(1)}, 0.6);
}
`,side:2})}var B=48,ye=3.4,be=2,xe=[15,38,78],V=class{constructor(e=12){this.stride=e,this.data=new Float32Array(e*64),this.count=0}reset(){this.count=0}push(e){let t=(this.count+1)*this.stride;if(t>this.data.length){let e=new Float32Array(Math.max(t,this.data.length*2));e.set(this.data),this.data=e,this.dirtyAlloc=!0}this.data.set(e,this.count*this.stride),this.count++}},Se=class{constructor(e,t){this.forest=e,this.maps=e.maps,this.quality=t,this.radius=t.treeRadius,this.detail=t.treeDetail??0,this.lodScale=1+Math.min(this.detail,2)*.16,this.lodBounds=t.lodBounds??xe,this.farMode=`full`,this.gfx=`balanced`,this.lodStress=0,this.pxFull=88,this.pxMid=22,this.maxLod0=40,this.maxLod1=110,this.pxCard=24,this.maxTrees=720,this.maxCards=2400,this._pack=[],this.density=.105*t.treeDensity,this.speciesKeys=Object.keys(ee),this.variants=[],this.chunks=new Map,this.pending=[],this.meshes=[],this.shadowMeshes=[],this.season=0,this._eco={},this._lastRebuild=new a(1e9,1e9,1e9),this._frame=0,this.stats={trees:0,lod:[0,0,0,0],fallen:0},this._wounds=new Map}setLook(e,t){let n=.105*E(e,.02,1.65),r=E(t??this.radius,40,420);Math.abs(n-this.density)<1e-4&&Math.abs(r-this.radius)<.25||(this.density=n,this.radius=r,this.invalidate())}setPolicy({radius:e,farMode:t,gfx:n,pxFull:r,pxMid:i,pxCard:a,maxLod0:o,maxLod1:s,maxTrees:c,maxCards:l}={}){let u=!1;if(e!=null){let t=E(e,40,420);Math.abs(t-this.radius)>.25&&(this.radius=t,u=!0)}t!=null&&t!==this.farMode&&(this.farMode=t,u=!0),n!=null&&n!==this.gfx&&(this.gfx=n,u=!0),r!=null&&(this.pxFull=r),i!=null&&(this.pxMid=i),a!=null&&(this.pxCard=a),o!=null&&(this.maxLod0=o),s!=null&&(this.maxLod1=s),c!=null&&(this.maxTrees=c),l!=null&&(this.maxCards=l),u&&(this.pending.length=0,this._lastRebuild.set(1e9,1e9,1e9))}invalidate(){this.chunks.clear(),this.pending.length=0,this._lastRebuild.set(1e9,1e9,1e9)}_streamRadius(){return this.radius+B*2.2}_chunkCenter(e,t){return{x:(e+.5)*B,z:(t+.5)*B}}_pruneFar(e){let t=this._streamRadius()+B*2.2;for(let n of this.chunks.keys()){let[r,i]=n.split(`,`).map(Number),a=this._chunkCenter(r,i);Math.hypot(a.x-e.x,a.z-e.z)>t&&this.chunks.delete(n)}}_pruneOutsideMaps(){let e=this.maps;if(e?.covers)for(let t of this.chunks.keys()){let[n,r]=t.split(`,`).map(Number),i=this._chunkCenter(n,r);e.covers(i.x,i.z)||this.chunks.delete(t)}}_enqueueMissing(e){let t=this._streamRadius(),n=Math.floor((e.x-t)/B),r=Math.floor((e.x+t)/B),i=Math.floor((e.z-t)/B),a=Math.floor((e.z+t)/B),o=[];for(let s=i;s<=a;s++)for(let i=n;i<=r;i++){let n=this._chunkKey(i,s);if(this.chunks.has(n))continue;let r=this._chunkCenter(i,s),a=Math.hypot(r.x-e.x,r.z-e.z);a>t+B*.25||o.push({cx:i,cz:s,key:n,dist:a})}o.sort((e,t)=>e.dist-t.dist),this.pending=o}_ageAppear(e){if(e<=0)return!1;let t=e*ye,n=!1;for(let e of this.chunks.values())for(let r of e){let e=r._appear??0;e<1&&(r._appear=Math.min(1,e+t),n=!0)}return n}fillAround(e,{settle:t=!1}={}){let n=e.position;for(this._pruneFar(n),this._pruneOutsideMaps(),this.pending.length=0,this._enqueueMissing(n);this.pending.length;){let e=this.pending.shift();if(this.chunks.has(e.key))continue;let n=this._generateChunk(e.cx,e.cz);if(t)for(let e of n)e._appear=1;this.chunks.set(e.key,n)}if(t)for(let e of this.chunks.values())for(let t of e)t._appear=1;this._lastRebuild.copy(n),this._rebuildBuckets(e)}async build(e){let t=this.maps,n=0,r=this.speciesKeys.length*be;for(let i of this.speciesKeys){let a=ee[i];for(let o=0;o<be;o++){let s=k(i.length*7919+o*104729,13),c=ue(a,s,{age:.62+.38*(o*41%100)/100,detail:this.detail}),l={species:a,key:i,seed:s,height:c.height,radius:c.radius,crownRadius:c.crownRadius,lods:c.lods,buckets:[new V,new V,new V,new V],draws:[]};this._makeDraws(l,t),this.variants.push(l),n++,e?.(n/r,`growing ${i} ${o+1}/${be}`),await new Promise(e=>setTimeout(e,0))}}this._buildBillboards(t)}_instanceAttrs(e){return new f(new Float32Array,4)}_attachInstances(e,t){let r=new n(t.data,12,1);return r.setUsage(F),e.setAttribute(`iPosScale`,new l(r,4,0)),e.setAttribute(`iRot`,new l(r,4,4)),e.setAttribute(`iVar`,new l(r,4,8)),e.instanceCount=0,r}_makeDraws(e,t){for(let n=0;n<3;n++){let i=e.lods[n],o=e.buckets[n],s=new r;s.index=i.branchGeometry.index;for(let e of[`position`,`normal`,`uv`,`aExtra`,`aSway`])s.setAttribute(e,i.branchGeometry.getAttribute(e));s.boundingSphere=new u(new a,1e6);let c=this._attachInstances(s,o),l=ge(t,e.species,{height:e.height}),d=ge(t,e.species,{height:e.height,shadow:!0}),f=new S(s,l);f.frustumCulled=!1,f.matrixAutoUpdate=!1,f.renderOrder=1;let p=new S(s,d);p.frustumCulled=!1,p.matrixAutoUpdate=!1;let m=[{mesh:f,shadow:p,buf:c,geo:s,lod:n}];if(i.leafGeometry){let s=new r;s.index=i.leafGeometry.index;for(let e of[`position`,`normal`,`uv`,`aExtra`,`aSway`])s.setAttribute(e,i.leafGeometry.getAttribute(e));s.boundingSphere=new u(new a,1e6);let c=this._attachInstances(s,o),l=_e(t,e.species,{height:e.height}),d=_e(t,e.species,{height:e.height,shadow:!0}),f=new S(s,l);f.frustumCulled=!1,f.matrixAutoUpdate=!1,f.renderOrder=2;let p=new S(s,d);p.frustumCulled=!1,p.matrixAutoUpdate=!1,m.push({mesh:f,shadow:p,buf:c,geo:s,lod:n,leaf:!0})}for(let t of m)e.draws.push(t),this.meshes.push(t.mesh),t.shadowCascades=n===0?[0]:n===1?[0,1]:[1,2],this.shadowMeshes.push(t.shadow)}}_buildBillboards(e){let t=[],n=[],i=[];for(let e=0;e<3;e++){let r=e*4;t.push(-.5,0,e,.5,0,e,.5,1,e,-.5,1,e),n.push(0,0,1,0,1,1,0,1),i.push(r,r+1,r+2,r,r+2,r+3)}this.billboards=[];for(let o of this.speciesKeys){let s=ee[o],c=this.variants.filter(e=>e.key===o),l=c.reduce((e,t)=>e+t.height,0)/Math.max(c.length,1),d=new V,f=new r;f.setAttribute(`position`,new I(new Float32Array(t),3)),f.setAttribute(`uv`,new I(new Float32Array(n),2)),f.setIndex(i),f.boundingSphere=new u(new a,1e6);let p=this._attachInstances(f,d),m=ve(e,s,{height:l}),h=ve(e,s,{height:l,shadow:!0}),g=new S(f,m);g.frustumCulled=!1,g.matrixAutoUpdate=!1,g.renderOrder=3;let _=new S(f,h);_.frustumCulled=!1,_.matrixAutoUpdate=!1;let v={key:o,species:s,height:l,bucket:d,geo:f,buf:p,mesh:g,shadow:_};v.shadowCascades=[2,3],this.billboards.push(v),this.meshes.push(g),this.shadowMeshes.push(_);for(let e of this.variants)e.key===o&&(e.billboard=v)}}_chunkKey(e,t){return`${e},${t}`}_generateChunk(e,t){let n=this.maps,r=this._eco,i=[],a=1/Math.sqrt(Math.max(this.density,1e-5)),o=(2*this.radius/B+2)**2,s=Math.max(this.maxTrees??980,(this.maxCards??2400)*.85),c=Math.max(12,s*1.55/Math.max(o,1)),l=Math.max(8,Math.min(16,Math.round(Math.sqrt(c*5.2)))),u=Math.max(1,Math.min(l,Math.round(B/a))),d=B/u,f=e*B,p=t*B,h=new j(k(e,t)^1542469173);for(let e=0;e<u;e++)for(let t=0;t<u;t++){let a=h.f(),o=h.f(),s=h.f(),c=h.f(),l=f+(t+a)*d,u=p+(e+o)*d;if(n.sample(l,u,r),!r.inside||r.waterDepth>-.05||r.slope>.72)continue;let g=.54+r.canopy*.82;if(g=Math.max(g,.48*(1-r.rock*.85)),g*=1-m(.62,.96,r.rock)*.55,g*=1-m(.58,.96,r.slope)*.45,g*=1-m(0,.6,r.waterDepth+.6)*.85,c>g)continue;let _=ne(r,s),v=[];for(let e=0;e<this.variants.length;e++)this.variants[e].key===_&&v.push(e);if(!v.length)continue;let y=v[h.int(v.length)],b=this.variants[y],S=x(.35,1,r.canopy),C=E(h.f()**1.6*.7+S*.55,.16,1.25),w=E(.45+r.moisture*.4-r.rock*.3+h.sym()*.22,.1,1),T=C*x(.85,1.15,h.f()),D=h.f()*Math.PI*2,O=(.02+r.slope*.14)*(1-r.canopy*.4),k=h.f()*Math.PI*2,A={x:l,z:u,y:r.height,scale:T,cos:Math.cos(D),sin:Math.sin(D),tiltX:Math.cos(k)*O,tiltZ:Math.sin(k)*O,phase:h.f(),tint:E(1-w+h.f()*.25,0,1),rnd:h.f(),variant:y,height:b.height*T,crown:b.crownRadius*T,_appear:0},j=this._wounds.get(`${l.toFixed(2)},${u.toFixed(2)}`);j&&(A.damage=j.damage,A.fallDirX=j.fallDirX,A.fallDirZ=j.fallDirZ),i.push(A)}return i}onMapsRebaked(){this._pruneOutsideMaps(),this.pending.length=0,this._lastRebuild.set(1e9,1e9,1e9)}update(e,t,n){this._frame++;let r=t.position;this._pruneFar(r),this.pending.length===0&&this._enqueueMissing(r);let i=this.chunks.size===0?48:this.pending.length>12?20:10,a=0;for(;this.pending.length&&a<i;){let e=this.pending.shift();if(!this.chunks.has(e.key)){let t=this._generateChunk(e.cx,e.cz),n=this._chunkCenter(e.cx,e.cz);if(Math.hypot(n.x-r.x,n.z-r.z)<this.radius+B*.6)for(let e of t)e._appear=1;this.chunks.set(e.key,t),a++}}this._tickDamage(e,r);let o=this._ageAppear(e),s=this._lastRebuild.distanceTo(r);(a>0||o||s>6||this._damageDirty||this._frame%50==0)&&(this._lastRebuild.copy(r),this._damageDirty=!1,this._rebuildBuckets(t))}_tickDamage(e,t){let n=p.uWeather.value.y,r=p.uWind.value.z,i=p.uWeather.value.z;if(n<.18&&r<8.5)return;let a=(n*.65+Math.max(0,r-8)*.045)*(.55+i*.55),o=p.uWind.value.x,s=p.uWind.value.y,c=0;for(let r of this.chunks.values())for(let i of r){if(i.scale<.28)continue;let r=i.x-t.x,l=i.z-t.z;if(r*r+l*l>24025||(i.damage??0)>=1)continue;if((i.damage??0)>0){i.damage=Math.min(1,i.damage+e*(.32+n*.85)),c++;continue}let u=.28+i.tint*1.55,d=a*e*.055*u*(.4+i.rnd*.8);if(Math.random()<d){let e=i.rnd*Math.PI*2;i.fallDirX=o*.75+Math.cos(e)*.35,i.fallDirZ=s*.75+Math.sin(e)*.35;let t=Math.hypot(i.fallDirX,i.fallDirZ)||1;i.fallDirX/=t,i.fallDirZ/=t,i.damage=.05,c++}}c&&(this._damageDirty=!0,this._rememberWounds())}_rememberWounds(){for(let e of this.chunks.values())for(let t of e)(t.damage??0)>.001&&this._wounds.set(`${t.x.toFixed(2)},${t.z.toFixed(2)}`,{damage:t.damage,fallDirX:t.fallDirX,fallDirZ:t.fallDirZ});if(this._wounds.size>4e3){let e=this._wounds.size-3e3,t=this._wounds.keys();for(let n=0;n<e;n++)this._wounds.delete(t.next().value)}}onLightning(e){if(!e)return;let t=0;for(let n of this.chunks.values())for(let r of n){let n=r.x-e.x,i=r.z-e.z;if(n*n+i*i>3025||r.rnd<.45)continue;r.fallDirX=r.fallDirX??(n||1),r.fallDirZ=r.fallDirZ??(i||0);let a=Math.hypot(r.fallDirX,r.fallDirZ)||1;r.fallDirX/=a,r.fallDirZ/=a,r.damage=Math.min(1,(r.damage??0)+.2+r.rnd*.35),t++}t&&(this._damageDirty=!0,this._rememberWounds())}_rebuildBuckets(n){let r=n.position;for(let e of this.variants)for(let t of e.buckets)t.reset();for(let e of this.billboards)e.bucket.reset();let i=new Float32Array(12),a=this.radius,o=0,s=[0,0,0,0],c=this._frustum??=new t,l=this._mvp??=new e;l.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),c.setFromProjectionMatrix(l);let d=this._sphere??=new u,f=Math.max(p.uProjScaleY.value||500,80),h=this.lodStress??0,g=this.farMode===`blur`?1.18:1,_=this.pxFull*g*(1+h*.7),v=this.pxMid*g*(1+h*.55),y=(this.pxCard??24)*g*(1+h*.4),b=this.maxLod0|0,x=this.maxLod1|0,S=this.maxCards|0||Math.round((this.maxTrees||980)*2.6),C=this._pack;C.length=0;for(let e of this.chunks.values())for(let t of e){let e=t.x-r.x,n=t.z-r.z,i=t.y+t.height*.5-r.y,o=Math.sqrt(e*e+n*n+i*i);if(o>a)continue;let s=t.damage??0;if(o>48){let e=s>.2?s*1.55:0,n=t.height*Math.sin(e)*.45;if(d.center.set(t.x+(t.fallDirX??0)*n,t.y+t.height*Math.cos(e)*.45,t.z+(t.fallDirZ??0)*n),d.radius=Math.max(t.crown,t.height*(s>.2?.72:.6)),!c.intersectsSphere(d))continue}t._dist=o,t._px=t.height*f/Math.max(o,.35),t._dmg=s,C.push(t)}C.sort((e,t)=>e._dist-t._dist);let w=a*.48,T=Math.max(80,Math.round(S*.55)),D=Math.max(80,S-T),O=0,A=0,j=0,M=0;for(let e of C){let t=this.variants[e.variant],n=e._dmg,r=e._dist,c=e._px;if(i[0]=e.x,i[1]=e.y,i[2]=e.z,i[3]=e.scale,i[4]=e.cos,i[5]=e.sin,n>.001){let t=n*n*(3-2*n),r=Math.hypot(e.tiltX,e.tiltZ)+t*1.56;i[6]=(e.fallDirX??1)*r,i[7]=(e.fallDirZ??0)*r,this._wounds.set(`${e.x.toFixed(2)},${e.z.toFixed(2)}`,{damage:n,fallDirX:e.fallDirX,fallDirZ:e.fallDirZ})}else i[6]=e.tiltX,i[7]=e.tiltZ;i[8]=e.phase,i[9]=e.tint,i[10]=e.rnd;let l=(1-m(a*.95,a,r))*(e._appear??1),u=(e,n)=>{i[11]=n*l,e<3?t.buckets[e].push(i):t.billboard.bucket.push(i),s[e]++},d=Math.min(52,Math.max(16,x*.3|0)),f=Math.max(8,x-d),p=3;if(c>_&&O<b?p=0:(c>58&&A<x||(c>v||c>y)&&A<f)&&(p=1),p===0){let e=_*1.16;if(c<e&&A<x){let t=E((e-c)/Math.max(_*.16,.001),0,1);u(0,1-t),u(1,t),O++,A++}else u(0,1),O++}else if(p===1){let e=v*1.22;if(c<e){let t=E((e-c)/Math.max(v*.22,.001),0,1);u(1,1-t),u(3,t),A++,r>w?M++:j++}else u(1,1),A++}else{if(r>w){if(M>=D)continue;M++}else{if(j>=T)continue;j++}u(3,1)}o++}let N=0;{let e=Array(36).fill(0),t=(e,t)=>{let n=Math.atan2(t-r.z,e-r.x);return(Math.floor((n+Math.PI)/(Math.PI*2)*36)%36+36)%36};for(let n of C)n._dist>=w&&n._dist<=a&&e[t(n.x,n.z)]++;let c=n.matrixWorld.elements,l=-c[8],u=-c[10],d=Math.hypot(l,u)||1,f=l/d,p=u/d,m=this._eco,h=this.maps,g=[0,9,-8,5,-6],_=[0,4,6,-8,-5],v=(e,t,n)=>{if(N>=140)return!1;let c=-Math.PI+(e+.16+t*.21)/36*Math.PI*2,l=a*n;for(let n=0;n<g.length;n++){let a=r.x+Math.cos(c)*l+g[n],u=r.z+Math.sin(c)*l+_[n];if(h.covers&&!h.covers(a,u)||(h.sample(a,u,m),!m.inside)||m.waterDepth>-.02||m.slope>.7)continue;let d=(k(e+19,t+7+n*13)>>>0)/4294967296,f=ne(m,d),p=0;for(let e=0;e<this.variants.length;e++)if(this.variants[e].key===f){p=e;break}let v=this.variants[p];if(!v?.billboard)continue;let y=h.height(a,u);return i[0]=a,i[1]=y,i[2]=u,i[3]=1.1+d*.28,i[4]=1,i[5]=0,i[6]=0,i[7]=0,i[8]=d,i[9]=.42+d*.22,i[10]=d,i[11]=.88,v.billboard.bucket.push(i),s[3]++,o++,N++,!0}return!1};for(let t=0;t<36;t++){let n=-Math.PI+(t+.5)/36*Math.PI*2,r=Math.cos(n),i=Math.sin(n);if(r*f+i*p<.02)continue;let a=10-e[t];if(!(a<=0))for(let e=0;e<a&&N<140;e++){let n=.78+.14*((e*17+t*3)%5)/4;if(v(t,e,n),!(e&1)){let n=.56+.12*((e*11+t*5)%5)/4;v(t,e+17,n)}}}}for(let e of this.variants){for(let t of e.draws){let n=e.buckets[t.lod];n.dirtyAlloc&&this._reattach(t,n),t.geo.instanceCount=n.count,t.mesh.visible=n.count>0,t.shadow.visible=n.count>0,t.buf.needsUpdate=!0,t.buf.updateRanges=[{start:0,count:n.count*12}]}for(let t of e.buckets)t.dirtyAlloc=!1}for(let e of this.billboards)e.bucket.dirtyAlloc&&(this._reattach(e,e.bucket),e.bucket.dirtyAlloc=!1),e.geo.instanceCount=e.bucket.count,e.mesh.visible=e.bucket.count>0,e.shadow.visible=e.bucket.count>0,e.buf.needsUpdate=!0;this.stats.trees=o,this.stats.lod=s,this.stats.horizonFill=N;let P=0;for(let e of this.chunks.values())for(let t of e)(t.damage??0)>.2&&P++;this.stats.fallen=P}_reattach(e,t){let r=new n(t.data,12,1);r.setUsage(F),e.geo.setAttribute(`iPosScale`,new l(r,4,0)),e.geo.setAttribute(`iRot`,new l(r,4,4)),e.geo.setAttribute(`iVar`,new l(r,4,8)),e.buf=r}trunksNear(e,t,n,r=[]){r.length=0;let i=Math.floor((e-n)/B),a=Math.floor((e+n)/B),o=Math.floor((t-n)/B),s=Math.floor((t+n)/B);for(let c=o;c<=s;c++)for(let o=i;o<=a;o++){let i=this.chunks.get(this._chunkKey(o,c));if(i)for(let a of i){let i=a.x-e,o=a.z-t,s=this.variants[a.variant].radius*a.scale,c=n+s;i*i+o*o<c*c&&r.push({x:a.x,z:a.z,r:s,h:a.height})}}return r}pushOutOfTrunks(e,t=.55){let n=this.trunksNear(e.x,e.z,3,this._near??=[]),r=!1;for(let i of n){let n=e.y-this.forest.maps.height(i.x,i.z),a=1+1.4*Math.max(0,1-n/Math.max(i.h*.06,.4)),o=i.r*a+t,s=e.x-i.x,c=e.z-i.z,l=Math.hypot(s,c);l>=o||(l<1e-4&&(s=1,c=0,l=1),e.x=i.x+s/l*o,e.z=i.z+c/l*o,r=!0)}return r}beforeShadow(e,t){for(let e of this.variants)for(let n of e.draws)n.shadow.visible=e.buckets[n.lod].count>0&&n.shadowCascades.includes(t);for(let e of this.billboards)e.shadow.visible=e.bucket.count>0&&e.shadowCascades.includes(t)}setSeason(e){this.season=e;for(let t of this.variants)for(let n of t.draws)n.mesh.material.uniforms.uSeason&&(n.mesh.material.uniforms.uSeason.value=e);for(let t of this.billboards)t.mesh.material.uniforms.uSeason&&(t.mesh.material.uniforms.uSeason.value=e)}},Ce=5;function we(e){let t=[],n=[];for(let n=0;n<=e;n++){let r=n/e;n===e?t.push(0,r,0):(t.push(-1,r,0),t.push(1,r,0))}for(let t=0;t<e;t++){let r=t*2,i=r+1;t===e-1?n.push(r,i,e*2):n.push(r,i,r+3,r,r+3,r+2)}let i=new r;return i.setAttribute(`position`,new I(new Float32Array(t),3)),i.setIndex(n),i.boundingSphere=new u(new a,1e6),i}var Te=`
uniform sampler2D uBladeA;   // base.xyz, height
uniform sampler2D uBladeB;   // angle, width, bend, phase
uniform sampler2D uBladeC;   // dryness, lush, species, ao
uniform vec4 uRing;          // x inner, y outer, z spacing, w blade width scale
uniform vec2 uRingOrigin;
uniform vec2 uDataOrigin;    // snapped gen origin; we slide by the remainder
uniform float uCount;

struct Blade {
  vec3 base; vec3 dir; float height; float width; float bend;
  float phase; float dryness; float lush; float species; float ao; float valid;
};

Blade fetchBlade(float id){
  Blade b;
  float col = mod(id, uCount);
  float row = floor(id / uCount);
  vec2 uv = (vec2(col, row) + 0.5) / uCount;
  vec4 A = texture(uBladeA, uv);
  vec4 B = texture(uBladeB, uv);
  vec4 C = texture(uBladeC, uv);
  b.base = A.xyz;
  b.height = A.w;
  b.dir = vec3(cos(B.x), 0.0, sin(B.x));
  b.width = B.y * uRing.w;
  b.bend = B.z;
  b.phase = B.w;
  b.dryness = C.x; b.lush = C.y; b.species = C.z; b.ao = C.w;
  b.valid = step(0.004, b.height);
  // Slide the baked lattice with the camera so a cell crossing does not
  // teleport the whole ring. Ecology stays snapped; the jump is at most
  // one spacing in the sample, not in the blades.
  b.base.xz += uRingOrigin - uDataOrigin;
  // annulus test lives here so the data pass can stay lattice-anchored
  vec2 d = abs(b.base.xz - uRingOrigin);
  float cheb = max(d.x, d.y);
  if(cheb < uRing.x || cheb > uRing.y) b.valid = 0.0;
  return b;
}

void bladePoint(Blade b, float t, float side, float windLean, vec3 windDir, float twist,
                float widthMul, out vec3 pos, out vec3 nrm){
  float lean = b.bend * 0.42 + windLean;
  vec3 up = vec3(0.0, 1.0, 0.0);
  vec3 hdir = normalize(b.dir + windDir * windLean * 2.2 + 1e-5);
  vec3 p1 = up * b.height * 0.56 + hdir * b.height * lean * 0.26;
  vec3 p2 = up * b.height * (1.0 - lean * lean * 0.40) + hdir * b.height * lean * 1.10;
  float u = 1.0 - t;
  vec3 c = 2.0 * u * t * p1 + t * t * p2;
  vec3 tangent = normalize(2.0 * u * p1 + 2.0 * t * (p2 - p1) + 1e-6);
  float w = b.width * widthMul * (1.0 - pow(t, 1.5)) * (0.62 + 0.38 * (1.0 - t * 0.5));
  vec3 sideDir = normalize(cross(tangent, hdir) + 1e-6);
  float roll = twist * (0.30 + 0.70 * t);
  vec3 n0 = normalize(cross(sideDir, tangent));
  sideDir = normalize(sideDir * cos(roll) + n0 * sin(roll));
  nrm = normalize(cross(sideDir, tangent));
  // blades are V-shaped in cross-section, so bow the normal outward
  nrm = normalize(nrm - sideDir * side * 0.5);
  pos = c + sideDir * side * w;
}
`,Ee=class{constructor(e,t){this.forest=e,this.renderer=e.renderer,this.quality=t,this.meshes=[],this.shadowMeshes=[],this.rings=[];let n=e.maps,c=we(Ce),l=we(3),p=we(2),m=t.grassCount??256,h=t.grassSpacing??.036,g=0,_=t.grassRadius;for(let e=0;e<t.grassRings;e++){let t=m*h*.5*.92,n=Math.min(_,t),r={inner:g,outer:n,spacing:h,lod:e,widthScale:1+e*.42,count:m};if(this.rings.push(r),g=n,h*=2,g>=_-.01)break}this.genPass=new v(T(this._genFragment(),{...n.sharedUniforms,...y.pick(`uTime`,`uWeather`),uRingSpacing:{value:0},uOrigin:{value:new i},uCount:{value:m},uDensity:{value:t.grassDensity},uHeightMul:{value:1}}));for(let e of this.rings){e.dataRT=b(e.count,e.count,{count:3,type:d,minFilter:s,magFilter:s}),e.origin=new i(1e9,1e9);let t=e.count*e.count,n=e.lod===0?c:e.lod<=2?l:p,m=new r;m.index=n.index,m.setAttribute(`position`,n.getAttribute(`position`));let h=new Float32Array(t);for(let e=0;e<t;e++)h[e]=e;m.setAttribute(`aId`,new f(h,1)),m.instanceCount=t,m.boundingSphere=new u(new a,1e6);let g={...y.pick(`uTime`,`uDelta`,`uCamPos`,`uWind`,`uWindPhase`,`uWeather`,`uJitter`,`uViewProj`,`uPrevViewProj`,`uProjScaleY`),uBladeA:{value:e.dataRT.textures[0]},uBladeB:{value:e.dataRT.textures[1]},uBladeC:{value:e.dataRT.textures[2]},uRing:{value:new o(e.inner,e.outer,e.spacing,e.widthScale)},uRingOrigin:{value:new i},uDataOrigin:{value:new i},uCount:{value:e.count}};e.uniforms=g,e.mesh=new S(m,this._drawMaterial(g,!1)),e.mesh.frustumCulled=!1,e.mesh.matrixAutoUpdate=!1,e.shadowMesh=new S(m,this._drawMaterial(g,!0)),e.shadowMesh.frustumCulled=!1,e.shadowMesh.matrixAutoUpdate=!1,e.shadowMesh.userData.cascades=e.lod===0?[0]:e.lod<=2?[0,1]:[1],this.meshes.push(e.mesh),this.shadowMeshes.push(e.shadowMesh)}this.stats={blades:this.rings.reduce((e,t)=>e+t.count*t.count,0)},this.ringBudget=this.rings.length,this.heightMul=1}setLook(e,t){let n=this.genPass.material.uniforms,r=!1;if(e!=null){let t=Math.max(.05,Math.min(e,1.55));Math.abs(n.uDensity.value-t)>1e-4&&(n.uDensity.value=t,r=!0)}if(t!=null){let e=Math.max(.35,Math.min(t,1.45));Math.abs(this.heightMul-e)>1e-4&&(this.heightMul=e,r=!0)}if(r)for(let e of this.rings)e.origin.set(1e9,1e9)}setRingBudget(e){this.ringBudget=Math.max(1,Math.min(e,this.rings.length));for(let e=0;e<this.rings.length;e++){let t=e<this.ringBudget;this.rings[e].mesh.visible=t}}_genFragment(){return`
${O}
${M}
${w}
uniform vec2 uOrigin;
uniform float uRingSpacing;
uniform float uCount;
uniform float uDensity;
uniform float uHeightMul;
uniform vec4 uWeather;
layout(location = 0) out vec4 oA;
layout(location = 1) out vec4 oB;
layout(location = 2) out vec4 oC;
in vec2 vUv;

void main(){
  vec2 px = floor(gl_FragCoord.xy);
  vec2 cell = px - uCount * 0.5;
  float sp = uRingSpacing;
  vec2 p = uOrigin + cell * sp;

  ivec2 ic = ivec2(floor(p / sp + 0.5));
  uint h = uhash(uvec2(ic + 1000000));
  vec4 r1 = vec4(uhashf(h), uhashf(h ^ 0x9e3779b9u), uhashf(h ^ 0x85ebca6bu), uhashf(h ^ 0xc2b2ae35u));
  vec4 r2 = vec4(uhashf(h ^ 0x27d4eb2fu), uhashf(h ^ 0x165667b1u), uhashf(h ^ 0xd3a2646cu), uhashf(h ^ 0xfd7046c5u));
  p += (r1.xy - 0.5) * sp * 1.4;

  oA = vec4(0.0); oB = vec4(0.0); oC = vec4(0.0);
  if(mapInside(p) < 0.5) return;

  vec4 m = mapSample(p);
  vec4 eco = ecoSample(p);
  vec4 ao = aoSample(p);
  float waterDepth = m.g - m.r;
  float slope = 1.0 - clamp(groundNormalMap(p, uMapInfo.w * 1.5).y, 0.0, 1.0);

  // Grass is a light-limited species: under a closed canopy the floor is leaf
  // litter and shade herbs, not a lawn. Multiplying by the light fraction rather
  // than subtracting is what makes a closed stand read as a closed stand.
  float light = pow(clamp(1.0 - eco.g * 0.72, 0.0, 1.0), 1.12);
  float dens = (0.28 + eco.r * 0.52) * (0.28 + 1.15 * light);
  dens -= eco.b * 1.00;
  dens -= smoothstep(0.30, 0.80, slope) * 0.55;
  dens -= smoothstep(0.50, 0.95, eco.a) * 0.32;
  // pull the sward back from the wet line so the waterline is gravel, not lawn
  dens *= 1.0 - smoothstep(-0.28, 0.06, waterDepth);
  // tussocks: two scales of clumping so the sward is patchy, never a lawn
  float clump = fbm(p * 0.105, 4, 2.1, 0.55) * 0.5 + 0.5;
  float clump2 = fbm(p * 0.58 + 31.0, 3, 2.1, 0.5) * 0.5 + 0.5;
  float clumpK = smoothstep(0.18, 0.70, clump) * 0.72 + 0.34 * clump2;
  dens *= clumpK;
  dens *= uDensity;
  if(r1.z > clamp(dens, 0.0, 1.0)) return;

  float lush = clamp(0.32 + eco.r * 0.75 - eco.b * 0.45 + (1.0 - eco.g) * 0.40, 0.0, 1.45);
  float hgt = mix(0.16, 0.92, pow(r2.x, 1.12)) * mix(0.58, 1.42, lush)
            * uHeightMul * mix(0.78, 1.55, clumpK);
  // sedges get tall in the wet, grazed swards stay short on thin soil
  hgt *= mix(1.0, 1.45, smoothstep(0.6, 1.0, eco.r) * (1.0 - smoothstep(0.1, 0.5, waterDepth + 0.4)));
  hgt *= mix(1.0, 0.55, eco.b);

  oA = vec4(p.x, m.r - 0.035, p.y, hgt);
  oB = vec4(r1.w * 6.2831853,
            mix(0.0032, 0.0125, r2.y) * mix(0.8, 1.35, lush),
            mix(0.15, 0.90, r2.z),
            r1.x);
  float dry = clamp(0.55 - eco.r * 0.55 + (fbm(p * 0.33 + 71.0, 3, 2.1, 0.5) * 0.5 + 0.5) * 0.55, 0.0, 1.0);
  oC = vec4(dry, lush, r2.w, ao.r);
}
`}_drawMaterial(e,t){let n=`
precision highp float;
precision highp int;
uniform float uTime; uniform float uDelta; uniform vec3 uCamPos; uniform vec4 uWeather;
uniform float uProjScaleY;
${M}
${_}
${Te}
uniform mat4 projectionMatrix; uniform mat4 viewMatrix;
uniform mat4 uViewProj; uniform mat4 uPrevViewProj;
in vec3 position;
in float aId;
out vec3 vWorld; out vec3 vNormal; out vec2 vUv; out vec4 vData; out vec4 vCur; out vec4 vPrev;

vec3 evalBlade(Blade b, float t, float side, float time, float widthMul, out vec3 nrm){
  float s = windStrengthAt(b.base.xz, time);
  vec2 wd2 = normalize(uWind.xy + 1e-5);
  vec3 windDir = vec3(wd2.x, 0.0, wd2.y);
  float gust = windGustAt(b.base.xz, time);
  float sway = sin(time * (2.0 + 2.7 * b.phase) + b.phase * 31.0 + dot(b.base.xz, wd2) * 0.85);
  float sway2 = sin(time * (5.9 + 3.3 * b.phase) + b.phase * 61.0);
  float lean = clamp(s * 0.042 * gust, 0.0, 1.6)
             + sway * 0.05 * (0.35 + s * 0.05) + sway2 * 0.016;
  vec3 pos, n;
  bladePoint(b, t, side, lean, windDir, (b.phase - 0.5) * 2.2, widthMul, pos, n);
  // the camera parts the grass as it passes through
  vec3 toCam = b.base - uCamPos;
  float dc = length(toCam.xz);
  float push = exp(-dc * dc * 1.4) * 0.9;
  if(push > 0.003){
    vec3 away = normalize(vec3(toCam.x, 0.0, toCam.z) + 1e-5);
    pos += away * push * t * t * b.height * 1.0;
    pos.y -= push * t * t * b.height * 0.4;
  }
  nrm = n;
  return b.base + pos;
}

void main(){
  Blade b = fetchBlade(aId);
  if(b.valid < 0.5){
    gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
    vWorld = vec3(0.0); vNormal = vec3(0.0, 1.0, 0.0); vUv = vec2(0.0);
    vData = vec4(0.0); vCur = vec4(0.0, 0.0, 2.0, 1.0); vPrev = vCur;
    return;
  }
  float t = position.y;
  float side = position.x;
  // Keep blades at least ~1.3 px wide. Sub-pixel blades otherwise sparkle
  // violently and no amount of temporal filtering recovers them.
  float viewDist = max(length(b.base - uCamPos), 0.15);
  float pxWidth = b.width * uProjScaleY / viewDist;
  float widthMul = max(1.0, 1.3 / max(pxWidth, 1e-4));
  widthMul = min(widthMul, 9.0);
  vec3 nrm, nrmP;
  vec3 world = evalBlade(b, t, side, uWindPhase.x, widthMul, nrm);
  vec3 prev = evalBlade(b, t, side, uWindPhase.x - uDelta, widthMul, nrmP);
  vWorld = world;
  vNormal = nrm;
  vUv = vec2(side * 0.5 + 0.5, t);
  vData = vec4(b.dryness, b.lush, b.species, min(b.ao, 1.0));
  vCur = uViewProj * vec4(world, 1.0);
  vPrev = uPrevViewProj * vec4(prev, 1.0);
  gl_Position = ${t?`projectionMatrix * (viewMatrix * vec4(world, 1.0))`:`vCur`};
}
`;return t?new c({glslVersion:P,uniforms:e,vertexShader:n,fragmentShader:`precision highp float;
          layout(location = 0) out vec4 oCol;
          void main(){ oCol = vec4(1.0); }`,side:2}):new c({glslVersion:P,uniforms:e,vertexShader:n,fragmentShader:`
precision highp float;
precision highp int;
uniform vec3 uCamPos; uniform vec4 uWeather; uniform float uTime;
${M}
${g}
in vec3 vWorld; in vec3 vNormal; in vec2 vUv; in vec4 vData; in vec4 vCur; in vec4 vPrev;
void main(){
  float dry = vData.x, lush = vData.y, sp = vData.z, ao = vData.w;
  vec3 c1 = vec3(0.038, 0.094, 0.026);
  vec3 c2 = vec3(0.086, 0.148, 0.036);
  vec3 c3 = vec3(0.052, 0.088, 0.040);
  vec3 base = sp < 0.42 ? mix(c1, c2, fract(sp * 3.1))
            : sp < 0.78 ? mix(c2, c3, fract(sp * 5.7))
                        : mix(c3, c1, fract(sp * 7.3));
  base *= mix(0.62, 1.32, lush);
  vec3 straw = mix(vec3(0.140, 0.112, 0.046), vec3(0.198, 0.162, 0.068), fract(sp * 11.7));
  float tipDry = clamp(dry * (0.20 + 1.20 * vUv.y), 0.0, 1.0);
  vec3 alb = mix(base, straw, tipDry * 0.85);
  float rib = 1.0 - smoothstep(0.0, 0.24, abs(vUv.x - 0.5));
  alb *= mix(1.0, 0.80, rib * 0.45);
  float depth = smoothstep(0.0, 0.42, vUv.y);
  alb *= mix(0.38, 1.0, depth);
  float occ = mix(0.30, 1.0, depth) * mix(0.6, 1.0, ao);

  vec3 N = normalize(vNormal);
  if(!gl_FrontFacing) N = -N;
  float wet = clamp(uWeather.w, 0.0, 1.0);
  alb *= mix(1.0, 0.72, wet);
  float rough = mix(0.42, 0.72, tipDry) - wet * 0.24;
  float trans = mix(0.90, 0.45, tipDry) * mix(0.65, 1.0, depth);
  writeGBuffer(alb, occ, N, clamp(rough, 0.06, 1.0), trans, vCur, vPrev,
    ${4 .toFixed(1)}, 0.85);
}
`,side:2})}onMapsRebaked(){for(let e of this.rings)e.origin.set(1e9,1e9)}update(e,t){let n=t.position.x,r=t.position.z,i=this.renderer,a=i.getRenderTarget(),o=this.genPass.material.uniforms,s=this.ringBudget??this.rings.length;for(let e=0;e<this.rings.length;e++){let t=this.rings[e];if(e>=s){t.mesh.visible=!1;continue}t.mesh.visible=!0,t.uniforms.uRingOrigin.value.set(n,r);let a=Math.floor(n/t.spacing)*t.spacing,c=Math.floor(r/t.spacing)*t.spacing;Math.abs(a-t.origin.x)<1e-4&&Math.abs(c-t.origin.y)<1e-4||(t.origin.set(a,c),t.uniforms.uDataOrigin.value.set(a,c),o.uOrigin.value.set(a,c),o.uRingSpacing.value=t.spacing,o.uCount.value=t.count,o.uHeightMul.value=this.heightMul??1,this.genPass.render(i,t.dataRT))}i.setRenderTarget(a)}beforeShadow(e,t){let n=this.ringBudget??this.rings.length;for(let e=0;e<this.rings.length;e++){let r=this.rings[e];r.shadowMesh.visible=e<n&&r.shadowMesh.userData.cascades.includes(t)}}},H={STEM:0,BLADE:1,PETAL:2,CENTRE:3,FROND:4,STONE:5,WOOD:6,CAP:7,GILL:8,MOSS:9,BARK:10,PAD:11},U=()=>new a,W=class{constructor(){this.pos=[],this.nrm=[],this.uv=[],this.extra=[],this.sway=[],this.idx=[],this.height=0,this.radius=0}vertex(e,t,n,r,i){return this.pos.push(e.x,e.y,e.z),this.nrm.push(t.x,t.y,t.z),this.uv.push(n[0],n[1]),this.extra.push(r[0],r[1],r[2],r[3]),this.sway.push(i[0],i[1]),this.height=Math.max(this.height,e.y),this.radius=Math.max(this.radius,Math.hypot(e.x,e.z)),this.pos.length/3-1}tri(e,t,n){this.idx.push(e,t,n)}quad(e,t,n,r){this.idx.push(e,t,n,e,n,r)}get triangles(){return this.idx.length/3}toGeometry(){if(!this.pos.length)return null;let e=new h;e.setAttribute(`position`,new I(new Float32Array(this.pos),3)),e.setAttribute(`normal`,new I(new Float32Array(this.nrm),3)),e.setAttribute(`uv`,new I(new Float32Array(this.uv),2)),e.setAttribute(`aExtra`,new I(new Float32Array(this.extra),4)),e.setAttribute(`aSway`,new I(new Float32Array(this.sway),2));let t=this.pos.length/3;return e.setIndex(t>65534?new I(new Uint32Array(this.idx),1):new I(new Uint16Array(this.idx),1)),e.computeBoundingSphere(),e}};function De(e,t){let n=Math.abs(e.y)>.95?U().set(1,0,0):U().set(0,1,0);t.t.crossVectors(n,e).normalize(),t.b.crossVectors(e,t.t).normalize()}function G(e,t,n,r,i,a={}){let o={t:U(),b:U()},s=t.length,c=null,l=null,u=a.totalHeight??Math.max(...t.map(e=>e.y))??1,d=0;for(let f=0;f<s;f++){let p=t[f],m=U();f===0?m.subVectors(t[1],t[0]):f===s-1?m.subVectors(t[s-1],t[s-2]):m.subVectors(t[f+1],t[f-1]),m.lengthSq()<1e-10&&m.set(0,1,0),m.normalize(),De(m,o);let h=n[Math.min(f,n.length-1)],g=f/(s-1),_=[];for(let t=0;t<=r;t++){let n=t%r/r*Math.PI*2,s=Math.cos(n),c=Math.sin(n),l=h*(a.lumpy?1+a.lumpy*(Math.sin(n*4+f*1.7)*.5+.35*Math.sin(n*9-f*2.3)):1),m=U().copy(p).addScaledVector(o.t,s*l).addScaledVector(o.b,c*l),v=U().addScaledVector(o.t,s).addScaledVector(o.b,c).normalize();_.push(e.vertex(m,v,[t/r*(a.uScale??1),d],[i,h,Math.max(p.y,0)/Math.max(u,.001),a.rnd??0],[a.flex0===void 0?g:a.flex0+(a.flex1-a.flex0)*g,a.phase??0]))}if(f>0&&(d+=t[f].distanceTo(t[f-1])*(a.vScale??3)),c)for(let t=0;t<r;t++)e.quad(c[t],_[t],_[t+1],c[t+1]);l||=_,c=_}if(a.cap&&c){let n=t[s-1],o=U().subVectors(t[s-1],t[s-2]).normalize(),l=e.vertex(n,o,[0,d],[i,0,Math.max(n.y,0)/Math.max(u,.001),a.rnd??0],[a.flex1??1,a.phase??0]);for(let t=0;t<r;t++)e.tri(c[t],c[t+1],l)}if(a.capStart&&l){let n=t[0],o=U().subVectors(t[0],t[1]).normalize(),s=e.vertex(n,o,[0,0],[i,0,Math.max(n.y,0)/Math.max(u,.001),a.rnd??0],[a.flex0??0,a.phase??0]);for(let t=0;t<r;t++)e.tri(l[t+1],l[t],s)}return c}function Oe(e,t,n,r,i,a,o={}){let s=n.clone().normalize(),c={t:U(),b:U()};De(s,c);let l=o.inset??r*.28,u=U().copy(t).addScaledVector(s,-l),d=o.rnd??0,f=o.jitter??.22,p=e.vertex(u,s,[.5,.5],[a,r,2,d],[0,o.phase??0]),m=[];for(let n=0;n<=i;n++){let u=n%i/i*Math.PI*2,p=1+f*Math.sin(u*3+d*17)+f*.55*Math.sin(u*7-d*9),h=l*.35*Math.sin(u*5+d*11),g=U().copy(t).addScaledVector(c.t,Math.cos(u)*r*p).addScaledVector(c.b,Math.sin(u)*r*p).addScaledVector(s,h);m.push(e.vertex(g,s,[.5+Math.cos(u)*.5,.5+Math.sin(u)*.5],[a,r,2,d],[0,o.phase??0]))}for(let t=0;t<i;t++)e.tri(p,m[t],m[t+1]);return m}function ke(e,t,n,r,i={}){let a=t.length,o=i.up??U().set(0,1,0),s=null,c=null,l=i.totalHeight??1;for(let u=0;u<a;u++){let d=t[u],f=U();u===0?f.subVectors(t[1],t[0]):u===a-1?f.subVectors(t[a-1],t[a-2]):f.subVectors(t[u+1],t[u-1]),f.lengthSq()<1e-10&&f.set(0,1,0),f.normalize();let p=U().crossVectors(f,o);p.lengthSq()<1e-8&&(p=U().crossVectors(f,U().set(1,0,0))),p.normalize();let m=U().crossVectors(p,f).normalize(),h=(i.roll??0)*(u/(a-1)),g=Math.cos(h),_=Math.sin(h),v=U().addScaledVector(p,g).addScaledVector(m,_),y=U().crossVectors(v,f).normalize(),b=n[Math.min(u,n.length-1)],x=u/(a-1),S=e.vertex(U().copy(d).addScaledVector(v,-b),y,[0,x],[r,b,Math.max(d.y,0)/Math.max(l,.001),i.rnd??0],[(i.flex0??0)+((i.flex1??1)-(i.flex0??0))*x,i.phase??0]),C=e.vertex(U().copy(d).addScaledVector(v,b),y,[1,x],[r,b,Math.max(d.y,0)/Math.max(l,.001),i.rnd??0],[(i.flex0??0)+((i.flex1??1)-(i.flex0??0))*x,i.phase??0]);s!==null&&e.quad(s,S,C,c),s=S,c=C}}function K(e,t,n,r,i,a,o,s={}){let c=U().crossVectors(n,r).normalize(),l=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]],u=[],d=s.totalHeight??1;for(let[f,p]of l){let l=U().copy(t).addScaledVector(n,f*i).addScaledVector(r,p*a);s.droop&&(l.y-=s.droop*Math.max(0,p+.5)*a*.35),u.push(e.vertex(l,c,[f+.5,p+.5],[o,s.param??0,Math.max(l.y,0)/Math.max(d,.001),s.rnd??0],[s.flex??.5,s.phase??0]))}return e.quad(u[0],u[1],u[2],u[3]),u}function q(e,t,n={}){let r=n.radial??10,i=n.rings??6,a=n.rx??.35,o=n.ry??.26,s=n.rz??.32,c=n.rough??.3,l=n.part??H.STONE,u=[t.range(0,10),t.range(0,10),t.range(0,10),t.range(0,10)],d=[];for(let e=0;e<=i;e++){let t=e/i*Math.PI*.5*(n.hemi?1:2)+(n.hemi,0),l=[];for(let e=0;e<=r;e++){let i=e%r/r*Math.PI*2,d=Math.sin(t),f=Math.cos(t),p=Math.cos(i)*d,m=f,h=Math.sin(i)*d;n.hemi&&(m=f);let g=1+c*.55*Math.sin(i*3+u[0]+m*2.1)+c*.32*Math.sin(i*5.7-u[1]+m*4.3)+c*.18*Math.sin(i*11.3+u[2]-m*7.9)+c*.22*Math.sin(t*4.1+u[3]),_=U().set(p*a*g,m*o*g,h*s*g);n.hemi?_.y=Math.max(_.y,0):_.y+=o*.55,n.flatten&&(_.y=Math.max(_.y,-o*.1)),l.push(_)}d.push(l)}let f=[];for(let t=0;t<=i;t++){let a=[];for(let s=0;s<=r;s++){let c=d[t][s],u=d[Math.min(t+1,i)][s],f=d[Math.max(t-1,0)][s],p=d[t][(s+1)%(r+1)],m=d[t][(s-1+r+1)%(r+1)],h=U().subVectors(p,m),g=U().subVectors(u,f),_=U().crossVectors(g,h);_.lengthSq()<1e-10&&_.copy(c).normalize(),_.normalize(),_.dot(c)<0&&_.negate(),a.push(e.vertex(c,_,[s/r,t/i],[l,n.param??0,Math.max(c.y,0)/Math.max(o*2,.001),n.rnd??0],[0,n.phase??0]))}f.push(a)}for(let t=0;t<i;t++)for(let n=0;n<r;n++)e.quad(f[t][n],f[t+1][n],f[t+1][n+1],f[t][n+1])}function J(e,t,n,r,i,a=U().set(0,1,0)){let o=[],s=t.clone().normalize(),c=e.clone(),l=n/r;for(let e=0;e<=r;e++){o.push(c.clone());let t=e/r;s.addScaledVector(a,-i*l*(.4+t)),s.normalize(),c.addScaledVector(s,l)}return o}var Y=(e=0,t=0,n=0)=>new a(e,t,n);function Ae(e,t={}){let n=new j(e),r=new W,i=4+n.int(5),a=x(.35,.95,n.f())*(t.scale??1),o=a*.85;for(let e=0;e<i;e++){let t=e/i*Math.PI*2+n.range(-.4,.4),s=x(.3,.85,n.f()),c=a*x(.65,1.15,n.f()),l=Y(Math.cos(t)*s,1-s*.55,Math.sin(t)*s).normalize(),u=J(Y(Math.cos(t)*.012,a*.05,Math.sin(t)*.012),l,c,8,x(.7,2,n.f())),d=[];for(let e=0;e<=8;e++){let t=e/8,r=Math.sin(Math.PI*E(t*.92+.06,0,1))**.62;d.push(c*.145*r*x(.85,1.15,n.f()))}ke(r,u,d,H.FROND,{totalHeight:o,rnd:n.f(),roll:n.range(-.5,.5),flex0:.12,flex1:1,phase:n.f()})}return{mesh:r,height:o,radius:r.radius,material:`plant`}}function je(e,t={}){let n=new j(e),r=new W,i=x(.55,1.5,n.f())*(t.scale??1),a=3+n.int(4),o=i,s=t.arching??0;for(let e=0;e<a;e++){let t=e/a*Math.PI*2+n.range(-.5,.5),c=x(.15,.55,n.f())+s*.35,l=i*x(.7,1.1,n.f()),u=Y(Math.cos(t)*c,1,Math.sin(t)*c).normalize(),d=s?x(1.2,2.4,n.f()):x(.15,.6,n.f()),f=J(Y(Math.cos(t)*i*.04,0,Math.sin(t)*i*.04),u,l,5,d),p=i*x(.01,.02,n.f());G(r,f,[p,p*.8,p*.62,p*.45,p*.3,p*.18],4,H.STEM,{totalHeight:o,rnd:n.f(),flex0:.05,flex1:.85,phase:n.f(),cap:!1,lumpy:.1});let m=5+n.int(7);for(let e=0;e<m;e++){let e=x(.3,1,n.f()**.7),t=Math.min(5,Math.floor(e*5)),a=f[t].clone(),s=Y().subVectors(f[Math.min(t+1,5)],f[t]).normalize(),c={t:Y(),b:Y()};De(s,c);let l=n.f()*Math.PI*2,u=Math.cos(l),d=Math.sin(l),p=Y().addScaledVector(c.t,u).addScaledVector(c.b,d),m=a.clone().addScaledVector(p,i*x(.05,.18,n.f()));m.y+=n.sym()*i*.05;let h=i*x(.09,.17,n.f()),g=h*x(1.1,1.7,n.f()),_=p.clone(),v=Y().crossVectors(p,Y(n.sym(),1,n.sym()).normalize()).normalize();v.lengthSq()<1e-6&&v.set(0,1,0),K(r,m,_,v,h,g,H.BLADE,{totalHeight:o,rnd:n.f(),param:h,droop:.4,flex:E(.45+e*.5,0,1),phase:n.f()})}}return{mesh:r,height:o,radius:r.radius,material:`plant`}}function Me(e,t={}){let n=new j(e),r=new W,i=x(.34,.82,n.f())*(t.scale??1),a=1+n.int(3),o=i;for(let e=0;e<a;e++){let e=n.f()*Math.PI*2,t=x(.03,.22,n.f()),a=Y(Math.cos(e)*t,1,Math.sin(e)*t).normalize(),s=i*x(.8,1,n.f()),c=J(Y(Math.cos(e)*i*.05,0,Math.sin(e)*i*.05),a,s,4,x(.2,.9,n.f())),l=i*.016;G(r,c,[l,l*.9,l*.8,l*.7,l*.6],3,H.STEM,{totalHeight:o,rnd:n.f(),flex0:.15,flex1:1,phase:n.f()});for(let t=0;t<2;t++){let t=e+n.range(1.5,4.5),a=Y(Math.cos(t)*.9,.6,Math.sin(t)*.9).normalize();ke(r,J(Y(0,i*.03,0),a,i*x(.35,.6,n.f()),4,1.7),[i*.02,i*.035,i*.03,i*.018,i*.004],H.BLADE,{totalHeight:o,rnd:n.f(),flex0:.2,flex1:1,phase:n.f()})}let u=c[4].clone(),d=5+n.int(4),f=i*x(.12,.2,n.f()),p=n.f();for(let e=0;e<d;e++){let t=e/d*Math.PI*2+n.range(-.15,.15),i=Y(Math.cos(t),x(.15,.7,n.f()),Math.sin(t)).normalize(),a=Y().crossVectors(i,Y(0,1,0));a.lengthSq()<1e-6&&a.set(1,0,0),a.normalize(),K(r,u.clone().addScaledVector(i,f*.62),a,i,f,f*1.5,H.PETAL,{totalHeight:o,rnd:p,param:f,flex:1,phase:n.f()})}K(r,u,Y(1,0,0),Y(0,0,1),f*.55,f*.55,H.CENTRE,{totalHeight:o,rnd:p,flex:1,phase:n.f()})}return{mesh:r,height:o,radius:r.radius,material:`plant`}}function Ne(e,t={}){let n=new j(e),r=new W,i=x(.055,.2,n.f()**1.25)*(t.scale??1),a=1+n.int(4),o=i*1.6;for(let e=0;e<a;e++){let t=e===0?0:n.sym()*i*1.5,a=e===0?0:n.sym()*i*1.5,s=i*(e===0?1:x(.45,.95,n.f())),c=s*x(1,2.2,n.f()),l=n.range(-.14,.14),u=[];for(let e=0;e<=4;e++){let n=e/4;u.push(Y(t+l*n*n*c,n*c,a+l*.6*n*n*c))}let d=s*x(.1,.19,n.f());G(r,u,[d*1.25,d,d*.92,d*.9,d*.95],7,H.WOOD,{totalHeight:o,rnd:n.f(),flex0:0,flex1:.05,phase:n.f(),lumpy:.08});let f=u[4].clone(),p=n.f(),m=s*x(.55,1.05,n.f()),h=m*x(.75,.32,p),g=[];for(let t=0;t<=4;t++){let n=t/4,r=[];for(let t=0;t<=10;t++){let i=t%10/10*Math.PI*2,a=m*Math.sin(n*Math.PI*.5+.001)*(1+.07*Math.sin(i*5+e)),o=h*Math.cos(n*Math.PI*.5);r.push(Y(f.x+Math.cos(i)*a,f.y+o-h*.05,f.z+Math.sin(i)*a))}g.push(r)}let _=[];for(let e=0;e<=4;e++){let t=[];for(let i=0;i<=10;i++){let a=g[e][i],o=Y(a.x-f.x,(a.y-f.y)*(m/Math.max(h,1e-4)),a.z-f.z);o.lengthSq()<1e-10&&o.set(0,1,0),o.normalize(),t.push(r.vertex(a,o,[i/10,e/4],[H.CAP,m,1,p],[.05,n.f()]))}_.push(t)}for(let e=0;e<4;e++)for(let t=0;t<10;t++)r.quad(_[e][t],_[e+1][t],_[e+1][t+1],_[e][t+1]);let v=[],y=r.vertex(Y(f.x,f.y-h*.06,f.z),Y(0,-1,0),[.5,.5],[H.GILL,m,1,p],[.05,0]);for(let e=0;e<=10;e++){let t=g[4][e];v.push(r.vertex(Y(t.x,t.y,t.z),Y(0,-1,0),[e/10,1],[H.GILL,m,1,p],[.05,0]))}for(let e=0;e<10;e++)r.tri(v[e+1],v[e],y)}return{mesh:r,height:o,radius:r.radius,material:`solid`}}function Pe(e,t={}){let n=new j(e),r=new W,i=x(.12,1.4,n.f()**1.7)*(t.scale??1);return q(r,n,{radial:i>.6?12:9,rings:i>.6?7:5,rx:i*x(.8,1.3,n.f()),ry:i*x(.42,.85,n.f()),rz:i*x(.8,1.3,n.f()),rough:x(.18,.42,n.f()),part:H.STONE,rnd:n.f(),flatten:!0}),{mesh:r,height:r.height,radius:r.radius,material:`solid`,sink:i*.22}}function Fe(e,t={}){let n=new j(e),r=new W,i=x(.18,.85,n.f())*(t.scale??1),a=i*x(.012,.03,n.f()),o=n.f()*Math.PI*2,s=[],c=n.range(-.5,.5);for(let e=0;e<=4;e++){let t=e/4;s.push(Y(Math.cos(o)*i*t+Math.cos(o+1.57)*c*i*t*t*.3,a*(.9+.2*Math.sin(t*5)),Math.sin(o)*i*t+Math.sin(o+1.57)*c*i*t*t*.3))}if(G(r,s,[a,a*.9,a*.75,a*.55,a*.35],5,H.WOOD,{totalHeight:a*2,rnd:n.f(),lumpy:.16,cap:!0,vScale:6}),n.f()<.6){let e=s[1+n.int(3)],t=o+n.range(.6,2)*(n.f()<.5?1:-1),c=i*x(.25,.5,n.f()),l=[];for(let n=0;n<=3;n++){let r=n/3;l.push(Y(e.x+Math.cos(t)*c*r,e.y+a*.4*r,e.z+Math.sin(t)*c*r))}let u=a*.55;G(r,l,[u,u*.8,u*.6,u*.3],4,H.WOOD,{totalHeight:a*2,rnd:n.f(),lumpy:.2,cap:!0,vScale:6})}return{mesh:r,height:r.height,radius:r.radius,material:`solid`}}function Ie(e,t={}){let n=new j(e),r=new W,i=x(1.8,6.5,n.f())*(t.scale??1),a=x(.1,.32,n.f())*(t.scale??1),o=n.f()*Math.PI*2,s=[],c=n.range(0,.35);for(let e=0;e<=7;e++){let t=e/7,n=a*(1-c*Math.sin(t*Math.PI)*.5)+a*.1*Math.sin(t*7+1);s.push(Y(Math.cos(o)*i*(t-.5),n,Math.sin(o)*i*(t-.5)))}let l=[];for(let e=0;e<=7;e++){let t=e/7;l.push(a*(1-t*.35)*(1+.12*Math.sin(t*9+2)))}G(r,s,l,9,H.BARK,{totalHeight:a*2,rnd:n.f(),lumpy:.14,cap:!0,vScale:2.2});let u=3+n.int(5);for(let e=0;e<u;e++){let e=n.f(),t=Math.min(7,Math.floor(e*7)),i=s[t].clone(),a=l[t],c=n.range(-.6,.6),u=Y(-Math.sin(o),0,Math.cos(o)),d=i.clone().addScaledVector(u,c*a).add(Y(0,a*(.72-Math.abs(c)*.3),0)),f=r.pos.length;q(r,n,{radial:7,rings:3,hemi:!0,rx:a*x(.5,1,n.f()),ry:a*x(.12,.28,n.f()),rz:a*x(.6,1.3,n.f()),rough:.45,part:H.MOSS,rnd:n.f()});for(let e=f;e<r.pos.length;e+=3)r.pos[e]+=d.x,r.pos[e+1]+=d.y,r.pos[e+2]+=d.z}let d=1+n.int(3);for(let e=0;e<d;e++){let e=x(.15,.9,n.f()),t=s[Math.min(7,Math.floor(e*7))].clone(),i=n.f()*Math.PI*2,o=a*x(1.2,3,n.f()),c=Y(Math.cos(i)*.85,.5,Math.sin(i)*.85).normalize(),l=[];for(let e=0;e<=2;e++)l.push(t.clone().addScaledVector(c,o*e/2));let u=a*x(.18,.34,n.f());G(r,l,[u,u*.8,u*.5],5,H.BARK,{totalHeight:a*2,rnd:n.f(),lumpy:.2,cap:!0,vScale:4})}return{mesh:r,height:r.height,radius:i*.5,material:`solid`,sink:a*.3}}function Le(e,t={}){let n=new j(e),r=new W,i=x(.2,.52,n.f())*(t.scale??1),a=9+n.int(11);for(let e=0;e<a;e++){let e=n.f()*Math.PI*2,t=i*n.f()**.65,a=n.f()>.78,o=a?x(.012,.055,n.f()):.004+n.f()*.018,s=Y(Math.cos(e)*t,o,Math.sin(e)*t),c=n.f()*Math.PI*2,l=a?n.range(-1.1,1.1):n.range(-.55,.55),u=a?n.range(-.9,.9):n.range(-.48,.48),d=Y(Math.cos(c),l,Math.sin(c)).normalize(),f=Y(-Math.sin(c),u,Math.cos(c)).normalize(),p=i*x(.22,a?.48:.62,n.f());K(r,s,d,f,p,p*x(1.05,1.85,n.f()),H.BLADE,{totalHeight:.08,rnd:n.f(),param:p,flex:0,phase:n.f(),droop:a?.55:.22})}return{mesh:r,height:.08,radius:r.radius,material:`litter`}}function Re(e,t={}){let n=new j(e),r=new W,i=x(.1,.22,n.f())*(t.scale??1),a=3+n.int(4);for(let e=0;e<a;e++){let e=n.f()*Math.PI*2,t=i*1.4*Math.sqrt(n.f()),a=Math.cos(e)*t,o=Math.sin(e)*t;for(let e=0;e<3;e++){let t=e/3*Math.PI*2+n.range(-.2,.2),s=Y(Math.cos(t),x(.18,.55,n.f()),Math.sin(t)).normalize(),c=Y().crossVectors(s,Y(0,1,0));c.lengthSq()<1e-6&&c.set(1,0,0),c.normalize();let l=i*x(.28,.48,n.f());K(r,Y(a,i*.12,o).addScaledVector(s,l*.55),c,s,l,l*x(.85,1.15,n.f()),H.BLADE,{totalHeight:i,rnd:n.f(),param:l,flex:.35,phase:n.f(),droop:.25})}}return{mesh:r,height:i*.55,radius:r.radius,material:`plant`}}function ze(e,t={}){let n=new j(e),r=new W,i=x(.72,1.7,n.f())*(t.scale??1),a=12+n.int(16);for(let e=0;e<a;e++){let e=n.f()*Math.PI*2,t=x(.08,.62,n.f()**.7),a=i*x(.58,1.18,n.f()),o=Y(Math.cos(e)*t,1,Math.sin(e)*t).normalize(),s=J(Y(Math.cos(e)*i*.03,0,Math.sin(e)*i*.03),o,a,5,x(.6,2.6,n.f())),c=i*x(.024,.058,n.f());ke(r,s,[c,c*.96,c*.84,c*.62,c*.36,c*.08],H.BLADE,{totalHeight:i,rnd:n.f(),roll:n.range(-1.2,1.2),flex0:.1,flex1:1,phase:n.f()})}return{mesh:r,height:i,radius:r.radius,material:`plant`}}function Be(e,t={}){let n=new j(e),r=new W,i=2+n.int(2),a=.12;for(let e=0;e<i;e++){let i=x(.3,.56,n.f())*(t.scale??1),o=n.f()*Math.PI*2,s=e===0?0:i*x(.55,.95,n.f()),c=Math.cos(o)*s,l=Math.sin(o)*s,u=n.f()*Math.PI*2,d=Y(Math.cos(u),0,Math.sin(u)),f=Y(-Math.sin(u),x(.04,.14,n.f()),Math.cos(u)).normalize();K(r,Y(c,.03,l),d,f,i,i,H.PAD,{totalHeight:.12,rnd:n.f(),flex:.08,phase:n.f(),droop:0}),a=Math.max(a,s+i*.55)}return{mesh:r,height:.08,radius:Math.max(r.radius,a),material:`plant`,sink:0}}function Ve(e,t={}){return je(e,{...t,arching:1})}function He(e,t={}){let n=new j(e),r=new W,i=x(4.2,10.5,n.f())*(t.scale??1),a=3+n.int(3),o=n.f()*6.2;for(let e=0;e<a;e++){let t=e/a*Math.PI*2+n.range(-.55,.55),s=[],c=x(.12,.48,n.f()),l=x(.42,1,n.f()),u=n.range(-.9,.9);for(let n=0;n<=10;n++){let r=n/10,a=r*r,d=Math.sin(r*5.4+o+e)*i*.07,f=r*u;s.push(Y(Math.cos(t+f)*c*i*a*.55+Math.cos(t+1.3)*d,i*(1-r*l),Math.sin(t+f)*c*i*a*.55+Math.sin(t+1.3)*d))}let d=x(.014,.032,n.f()),f=[];for(let e=0;e<=10;e++)f.push(d*(1-e/10*.5));G(r,s,f,5,H.STEM,{totalHeight:i,rnd:n.f(),flex0:.16,flex1:1,phase:n.f(),cap:!1,lumpy:.1});let p=8+n.int(8);for(let e=0;e<p;e++){let e=x(.08,.97,n.f()),t=Math.min(9,Math.floor(e*10)),a=s[t].clone(),o=Y().subVectors(s[t+1],s[t]).normalize(),c={t:Y(),b:Y()};De(o,c);let l=x(.22,.52,n.f()),u=l*x(1.7,2.8,n.f()),d=n.f()*Math.PI*2,f=Math.cos(d),p=Math.sin(d),m=Y().addScaledVector(c.t,f).addScaledVector(c.b,p),h=Y().addScaledVector(c.t,-p).addScaledVector(c.b,f);K(r,a.addScaledVector(m,l*.32),m,h,l,u,H.BLADE,{totalHeight:i,rnd:n.f(),flex:.92,phase:n.f(),droop:.95})}}return{mesh:r,height:i,radius:Math.max(r.radius,i*.38),material:`plant`}}function Ue(e,t={}){let n=new j(e),r=new W,i=x(1.35,3.2,n.f())*(t.scale??1),a=i*x(.055,.095,n.f()),o=[],s=n.range(-.38,.38),c=n.range(-.22,.28);for(let e=0;e<=9;e++){let t=e/9;o.push(Y(s*i*t*t*.28,a*(.55+c*Math.sin(t*Math.PI)+.18*Math.sin(t*5.1)),t*i))}let l=[];for(let e=0;e<=9;e++){let t=e/9;l.push(a*(1-t*.62)*(1+.06*Math.sin(t*7)))}G(r,o.slice(1),l.slice(1),10,H.WOOD,{totalHeight:a*2,rnd:n.f(),lumpy:.26,cap:!0,capStart:!0,vScale:4.2});let u=o[0];Oe(r,u,Y().subVectors(o[1],o[0]).normalize().clone().negate(),a*1.06,10,H.WOOD,{rnd:n.f(),inset:a*.02,jitter:.36});let d=(e,t,i,a,o,s)=>{let c=r.pos.length;q(r,n,{radial:8,rings:4,hemi:!1,rx:a,ry:o,rz:s,rough:.55,part:H.WOOD,rnd:n.f()});let l=o*.55;for(let n=c;n<r.pos.length;n+=3)r.pos[n]+=u.x+e,r.pos[n+1]+=u.y+t-l,r.pos[n+2]+=u.z+i;for(let e=c/3;e<r.extra.length/4;e++)r.extra[e*4+2]=2};d(0,0,i*.07,a*1.22,a*1.22,i*.14),d(a*.18,a*.1,-a*.15,a*.7,a*.58,a*.88),d(-a*.14,-a*.08,a*.2,a*.62,a*.55,a*.8);let f=a*x(1.2,2,n.f()),p=a*x(.1,.16,n.f()),m=Y(n.range(-.35,.35),n.range(-.25,.35),-.85).normalize();G(r,[u.clone(),u.clone().addScaledVector(m,f)],[p,p*.2],4,H.WOOD,{totalHeight:a*2,rnd:n.f(),lumpy:.16,cap:!0,capStart:!0,vScale:5});let h=o[2+n.int(2)],g=x(.52,.95,n.f()),_=i*x(.4,.62,n.f()),v=Y(.1*(n.f()<.5?1:-1),Math.sin(g),Math.cos(g)).normalize(),y=[];for(let e=0;e<=4;e++){let t=e/4,n=Math.sin(t*Math.PI)*_*.1;y.push(h.clone().addScaledVector(v,_*t).add(Y(0,n,0)))}let b=a*x(.55,.74,n.f());G(r,y,[b,b*.9,b*.72,b*.5,b*.28],7,H.WOOD,{totalHeight:a*2,rnd:n.f(),lumpy:.18,cap:!0,capStart:!0,vScale:4.4});let S=(e,t)=>{let i=r.pos.length;q(r,n,{radial:7,rings:3,hemi:!1,rx:t*1.55,ry:t*1.55,rz:t*2.1,rough:.38,part:H.WOOD,rnd:n.f()});let a=t*1.55*.55;for(let t=i;t<r.pos.length;t+=3)r.pos[t]+=e.x,r.pos[t+1]+=e.y-a,r.pos[t+2]+=e.z};return S(o[9],l[9]),S(y[y.length-1],b*.28),{mesh:r,height:r.height,radius:r.radius,material:`solid`,sink:a*.5}}function We(e,t={}){let n=new j(e),r=new W,i=x(.2,.65,n.f())*(t.scale??1),a=2+n.int(4);for(let e=0;e<a;e++){let e=n.f()*Math.PI*2,t=i*.5*Math.sqrt(n.f()),a=Math.cos(e)*t,o=Math.sin(e)*t,s=r.pos.length;q(r,n,{radial:8,rings:3,hemi:!0,rx:i*x(.25,.5,n.f()),ry:i*x(.05,.13,n.f()),rz:i*x(.25,.5,n.f()),rough:.5,part:H.MOSS,rnd:n.f()});for(let e=s;e<r.pos.length;e+=3)r.pos[e]+=a,r.pos[e+2]+=o}return{mesh:r,height:r.height,radius:r.radius,material:`solid`}}var X=[{key:`fern`,build:Ae,variants:3,density:.42,maxDist:46,score:e=>.1+e.canopy*1.7+e.moisture*1.5-e.rock*1.4-e.slope*1-Math.max(0,e.waterDepth+.2)*3},{key:`bush`,build:je,variants:3,density:.11,maxDist:48,score:e=>.25+(1-e.canopy)*1.5+e.moisture*.6-e.rock*.9-e.slope*.8-Math.max(0,e.waterDepth+.3)*3},{key:`bramble`,build:Ve,variants:2,density:.055,maxDist:52,score:e=>.05+(1-e.canopy)*1.9+e.litter*.5-e.rock*.8-e.slope*1.1-Math.max(0,e.waterDepth+.3)*3},{key:`flower`,build:Me,variants:3,density:.62,maxDist:26,score:e=>.1+e.moisture*.95+e.litter*.45+(1-e.canopy)*.85-e.rock*1-e.slope*.6-Math.max(0,e.waterDepth+.2)*4},{key:`herb`,build:Re,variants:2,density:.72,maxDist:14,score:e=>.08+e.canopy*1.4+e.moisture*1.1+e.litter*.35-e.rock*1.1-e.slope*.8-Math.max(0,e.waterDepth+.15)*4},{key:`mushroom`,build:Ne,variants:3,density:.48,maxDist:18,score:e=>-.15+e.litter*1.9+e.canopy*1.2+e.moisture*1.1-e.rock*1.5-Math.max(0,e.waterDepth+.2)*4},{key:`rock`,build:Pe,variants:4,density:.14,maxDist:78,score:e=>.06+e.rock*2.6+e.slope*1.1-e.litter*.4+Math.max(0,.38-Math.abs(e.waterDepth+.06))*4.2},{key:`twig`,build:Fe,variants:3,density:.88,maxDist:22,score:e=>.05+e.litter*1.7+e.canopy*.9-Math.max(0,e.waterDepth+.2)*4},{key:`leafPatch`,build:Le,variants:3,density:1.35,maxDist:20,score:e=>-.05+e.litter*2.3+e.canopy*.7-Math.max(0,e.waterDepth+.1)*5},{key:`sedge`,build:ze,variants:3,density:.42,maxDist:48,score:e=>-.1+e.moisture*1.5+Math.max(0,.55-Math.abs(e.waterDepth+.08))*8.2-e.rock*.8-e.slope*1},{key:`lily`,build:Be,variants:3,density:.16,maxDist:22,score:e=>{let t=e.waterDepth;return t<.5||t>2.4?0:.18+Math.max(0,.85-Math.abs(t-.7))*5.4-e.slope*1.4-e.canopy*.25}},{key:`moss`,build:We,variants:3,density:.52,maxDist:22,score:e=>-.25+e.moisture*1.8+e.canopy*1.1+e.rock*.5-e.slope*.6-Math.max(0,e.waterDepth+.2)*3},{key:`log`,build:Ie,variants:3,density:.018,maxDist:72,score:e=>.05+e.canopy*1.2+e.moisture*.4-e.slope*.9-Math.max(0,e.waterDepth+.3)*3},{key:`vine`,build:He,variants:3,density:.13,maxDist:52,score:e=>-.15+e.canopy*2.4+e.moisture*.8-e.rock*1.2-e.slope*.6-Math.max(0,e.waterDepth+.25)*4},{key:`limb`,build:Ue,variants:3,density:.055,maxDist:44,score:e=>-.05+e.litter*1.4+e.canopy*1.1-e.slope*.7-Math.max(0,e.waterDepth+.25)*4}],Ge=`
in vec4 iPosScale;   // xyz base position, w scale
in vec4 iRot;        // cos/sin yaw, lean x, lean z
in vec4 iVar;        // wind phase, tint, variant random, lod fade
`,Ke=`
uniform float uPlantHeight;
uniform float uWindAmp;
uniform float uAlignGround;   // 0 = stay upright, 1 = lie along the slope
uniform float uFloatWater;    // 1 = sit on the water surface, not the bed

mat3 instBasis(){
  mat3 yaw = mat3(iRot.x, 0.0, iRot.y, 0.0, 1.0, 0.0, -iRot.y, 0.0, iRot.x);
  mat3 lean = mat3(1.0, 0.0, 0.0, iRot.z, 1.0, iRot.w, 0.0, 0.0, 1.0);
  return lean * yaw;
}

vec3 instanceBase(){
  float gy = mix(iPosScale.y, groundHeight(iPosScale.xz), mapInside(iPosScale.xz));
  gy += max(mapWaterDepth(iPosScale.xz), 0.0) * uFloatWater + 0.022 * uFloatWater;
  return vec3(iPosScale.x, gy, iPosScale.z);
}

vec3 clutterVertex(vec3 local, float heightNorm, float flex, float phase, float t){
  mat3 B = instBasis();
  vec3 p = B * (local * iPosScale.w);
  vec3 base = instanceBase();
  if(uAlignGround > 0.01){
    // sit flat on the terrain: tilt the whole object into the ground plane
    vec3 gn = groundNormalMap(iPosScale.xz, uMapInfo.w * 2.0);
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 axis = cross(up, gn);
    float s = length(axis);
    if(s > 1e-4){
      axis /= s;
      float c = clamp(dot(up, gn), -1.0, 1.0);
      float ang = acos(c) * uAlignGround;
      float sa = sin(ang), ca = cos(ang);
      p = p * ca + cross(axis, p) * sa + axis * dot(axis, p) * (1.0 - ca);
    }
  }
  vec3 world = base + p;
  float hAbove = max(heightNorm, 0.0) * uPlantHeight * iPosScale.w;
  vec3 d = windSwayAt(world, hAbove, 1.0 - flex * 0.95, phase, uWindAmp * (0.3 + 1.0 * flex), t);
  // small-scale flutter on the outer parts
  float s2 = windStrengthAt(world.xz, t);
  float a = t * (4.4 + 3.1 * phase) + phase * 37.0 + dot(world.xz, vec2(0.41, 0.33));
  d += vec3(sin(a), cos(a * 1.31) * 0.35, cos(a)) * (s2 * 0.0035 * flex * flex * uPlantHeight * iPosScale.w);
  return world + d;
}
`,qe=`
uniform vec3 uLeafA;
uniform vec3 uLeafB;
uniform vec3 uStemA;
uniform vec3 uStemB;
uniform vec4 uPlantParams;   // x transmission, y leaflet count, z serration, w petal hue spread
uniform float uLitter;       // 1 = papery fallen leaves, not living foliage

/**
 * Pinnate frond mask. uv.y runs along the rachis, uv.x across it. Leaflets are
 * cut on both sides at a regular pitch with a length profile, so the ribbon
 * reads as a compound frond rather than a strap.
 */
float frondMask(vec2 uv, float rnd, out float rib, out float leafletT){
  float along = uv.y;
  float across = uv.x * 2.0 - 1.0;
  float n = uPlantParams.y;
  // rachis: always solid, thin
  float rachisW = 0.16 * (1.0 - along * 0.55);
  rib = 1.0 - smoothstep(rachisW * 0.5, rachisW, abs(across));

  float pitch = fract(along * n + rnd * 0.37);
  leafletT = pitch;
  // alternate leaflets left and right
  float sideSel = step(0.5, fract(along * n * 0.5 + rnd * 0.11)) * 2.0 - 1.0;
  float lobe = 1.0 - abs(pitch * 2.0 - 1.0);
  lobe = pow(clamp(lobe, 0.0, 1.0), 0.55);
  // leaflet length shrinks toward the tip and near the base
  float prof = pow(max(sin(3.14159 * clamp(along * 0.95 + 0.05, 0.0, 1.0)), 0.0), 0.45);
  float reach = lobe * prof;
  float sideMask = (across * sideSel > 0.0) ? 1.0 : 0.72;
  float edge = reach * sideMask;
  float m = step(abs(across), max(edge, rachisW));
  // serrated tip on each leaflet
  float serr = uPlantParams.z * 0.09 * sin(pitch * 26.0 + rnd * 40.0);
  m = step(abs(across), max(edge + serr, rachisW));
  return max(m, rib);
}

/** Simple leaf outline for blades, bush leaves and litter. */
float bladeMask(vec2 uv, float rnd, out float rib){
  float x = uv.x * 2.0 - 1.0;
  float y = clamp(uv.y, 0.0, 1.0);
  float w = pow(max(sin(3.14159 * y), 0.0), 0.5);
  w *= 1.0 - 0.30 * smoothstep(0.62, 1.0, y);
  w += uPlantParams.z * 0.10 * sin(y * 28.0 + rnd * 30.0) * smoothstep(0.06, 0.2, y) * smoothstep(1.0, 0.85, y);
  rib = 1.0 - smoothstep(0.0, 0.10, abs(x));
  float side = 1.0 - smoothstep(0.0, 0.6, abs(fract(y * 8.0 + abs(x) * 3.0) - 0.5) * 2.0);
  rib = clamp(rib + side * 0.30 * smoothstep(0.05, 0.3, abs(x)), 0.0, 1.0);
  return step(abs(x), w);
}

/** Petal outline: rounded, slightly notched, with a darker throat. */
float petalMask(vec2 uv, float rnd, out float throat){
  float x = uv.x * 2.0 - 1.0;
  float y = clamp(uv.y, 0.0, 1.0);
  float w = pow(max(sin(3.14159 * (0.06 + y * 0.94)), 0.0), 0.42);
  w *= 1.0 - 0.18 * abs(sin(y * 9.0 + rnd * 12.0));
  throat = 1.0 - smoothstep(0.0, 0.45, y);
  return step(abs(x), w);
}

/** Lily pad: notched disc, slightly irregular so it is not a debug circle. */
float padMask(vec2 uv, float rnd, out float rib){
  vec2 p = uv * 2.0 - 1.0;
  float r = length(p);
  float ang = atan(p.y, p.x);
  float notch = (1.0 - smoothstep(0.32, 0.62, abs(ang))) * 0.42;
  float rad = 0.90 - notch;
  rad *= 0.93 + 0.07 * sin(ang * 5.0 + rnd * 9.0);
  rib = 1.0 - smoothstep(0.0, 0.22, r);
  return step(r, rad);
}
`,Je=`
uniform vec3 uStoneA;
uniform vec3 uStoneB;
uniform vec3 uWoodA;
uniform vec3 uWoodB;
uniform vec4 uSolidParams;   // x cap hue, y roughness bias, z moss bias, w unused

vec3 perturbN(vec3 N, vec3 T, vec3 B, vec2 grad, float amount){
  return normalize(N - (T * grad.x + B * grad.y) * amount);
}
`;function Ye(){return y.pick(`uTime`,`uDelta`,`uCamPos`,`uWind`,`uWindPhase`,`uWeather`,`uJitter`,`uViewProj`,`uPrevViewProj`)}function Z(e){return`
precision highp float;
precision highp int;
uniform float uTime; uniform float uDelta; uniform vec3 uCamPos; uniform vec4 uWeather;
${M}
${_}
${w}
${Ge}
${Ke}
uniform mat4 projectionMatrix; uniform mat4 viewMatrix;
uniform mat4 uViewProj; uniform mat4 uPrevViewProj;
in vec3 position; in vec3 normal; in vec2 uv; in vec4 aExtra; in vec2 aSway;
out vec3 vWorld; out vec3 vNormal; out vec2 vUv; out vec4 vExtra;
out vec4 vCur; out vec4 vPrev; out float vFade; out float vTint;
void main(){
  float phase = fract(aSway.y + iVar.x);
  vec3 world = clutterVertex(position, aExtra.z, aSway.x, phase, uWindPhase.x);
  vec3 prev  = clutterVertex(position, aExtra.z, aSway.x, phase, uWindPhase.x - uDelta);
  vWorld = world;
  vNormal = normalize(instBasis() * normal);
  vUv = uv;
  vExtra = aExtra;
  vFade = iVar.w;
  vTint = iVar.y;
  vCur = uViewProj * vec4(world, 1.0);
  vPrev = uPrevViewProj * vec4(prev, 1.0);
  gl_Position = ${e?`projectionMatrix * (viewMatrix * vec4(world, 1.0))`:`vCur`};
}
`}var Xe=`
precision highp float;
precision highp int;
uniform vec3 uCamPos; uniform vec4 uWeather; uniform float uTime;
`,Ze=`
float coverageOf(int part, vec2 uv, float rnd, out float rib, out float throat, out float lt){
  rib = 0.0; throat = 0.0; lt = 0.0;
  if(part == ${H.FROND}) return frondMask(uv, rnd, rib, lt);
  if(part == ${H.BLADE}) return bladeMask(uv, rnd, rib);
  if(part == ${H.PETAL}) return petalMask(uv, rnd, throat);
  if(part == ${H.PAD}) return padMask(uv, rnd, rib);
  return 1.0;
}
`;function Qe(e,t,n={}){let r={...Ye(),...e.sharedUniforms,uPlantHeight:{value:t.height??.6},uWindAmp:{value:t.windAmp??.03},uAlignGround:{value:t.alignGround??0},uFloatWater:{value:+!!t.floatWater},uLitter:{value:+!!t.litter},uLeafA:{value:new a(...t.leafA??[.03,.072,.024])},uLeafB:{value:new a(...t.leafB??[.07,.13,.04])},uStemA:{value:new a(...t.stemA??[.045,.058,.026])},uStemB:{value:new a(...t.stemB??[.085,.095,.045])},uPlantParams:{value:new o(t.transmission??.72,t.leaflets??13,t.serration??1,t.petalHue??.5)}};return n.shadow?new c({glslVersion:P,uniforms:r,vertexShader:Z(!0),fragmentShader:`
${Xe}
${M}
${qe}
${Ze}
layout(location = 0) out vec4 oCol;
in vec3 vWorld; in vec3 vNormal; in vec2 vUv; in vec4 vExtra;
in vec4 vCur; in vec4 vPrev; in float vFade; in float vTint;
void main(){
  float rib, throat, lt;
  float cov = coverageOf(int(vExtra.x + 0.5), vUv, vExtra.w, rib, throat, lt);
  if(cov < 0.5) discard;
  oCol = vec4(1.0);
}
`,side:2}):new c({glslVersion:P,uniforms:r,vertexShader:Z(!1),fragmentShader:`
${Xe}
${M}
${w}
${qe}
${Ze}
${g}
in vec3 vWorld; in vec3 vNormal; in vec2 vUv; in vec4 vExtra;
in vec4 vCur; in vec4 vPrev; in float vFade; in float vTint;
void main(){
  if(vFade < 0.999){
    if(ign(gl_FragCoord.xy, uTime * 0.27) > vFade) discard;
  }
  int part = int(vExtra.x + 0.5);
  float rib, throat, lt;
  float cov = coverageOf(part, vUv, vExtra.w, rib, throat, lt);
  if(cov < 0.5) discard;

  vec3 dp1 = dFdx(vWorld), dp2 = dFdy(vWorld);
  vec2 du1 = dFdx(vUv), du2 = dFdy(vUv);
  vec3 T = dp1 * du2.y - dp2 * du1.y;
  vec3 B = -dp1 * du2.x + dp2 * du1.x;
  float tl = length(T), bl = length(B);
  T = tl > 1e-6 ? T / tl : vec3(1.0, 0.0, 0.0);
  B = bl > 1e-6 ? B / bl : vec3(0.0, 0.0, 1.0);
  vec3 N = normalize(vNormal);
  if(!gl_FrontFacing) N = -N;

  vec4 eco = ecoSample(vWorld.xz);
  float wet = clamp(mapWetness(vWorld.xz) * 0.8 + uWeather.w * 0.9, 0.0, 1.0);
  float idv = fract(vExtra.w * 7.31 + vTint * 3.1);

  vec3 alb; float rough; float trans; float occ; float matId; float thin;

  if(part == ${H.STEM}){
    alb = mix(uStemA, uStemB, idv) * mix(0.75, 1.15, fract(idv * 5.3));
    // woody at the base, green toward the tip
    alb = mix(alb * vec3(1.25, 1.0, 0.72), alb, clamp(vExtra.z * 1.4, 0.0, 1.0));
    rough = 0.82;
    trans = 0.10;
    occ = mix(0.55, 1.0, vExtra.z);
    matId = ${1 .toFixed(1)};
    thin = 0.2;
    alb *= mix(1.0, 0.70, wet);
    rough = clamp(rough - wet * 0.18, 0.12, 1.0);
  } else if(part == ${H.PETAL}){
    // saturated but not neon: real petals sit around 0.2-0.45 albedo
    vec3 h = vec3(0.5) + 0.42 * cos(6.2831853 * (uPlantParams.w + idv * 0.85) + vec3(0.0, 2.09, 4.19));
    alb = h * mix(0.24, 0.44, fract(idv * 3.7));
    alb = mix(alb, alb * vec3(1.15, 1.05, 0.7), throat * 0.85);
    rough = 0.46;
    trans = 0.85;
    occ = mix(0.7, 1.0, vUv.y);
    matId = ${1 .toFixed(1)};
    thin = 0.95;
    alb *= mix(1.0, 0.78, wet);
    rough = clamp(rough - wet * 0.16, 0.18, 1.0);
  } else if(part == ${H.PAD}){
    vec3 olive = mix(uLeafA, uLeafB, fract(idv * 2.4));
    alb = olive * mix(0.70, 1.08, fract(idv * 5.1));
    alb *= mix(0.52, 1.0, 1.0 - rib * 0.55);
    alb = mix(alb, alb * vec3(0.55, 0.48, 0.28), smoothstep(0.72, 0.92, fract(idv * 8.3)) * 0.35);
    rough = 0.36;
    trans = 0.12;
    occ = mix(0.70, 1.0, 1.0 - rib * 0.4);
    matId = ${1 .toFixed(1)};
    thin = 0.15;
    alb *= mix(1.0, 0.78, wet);
    rough = clamp(rough - wet * 0.10, 0.22, 1.0);
  } else if(part == ${H.CENTRE}){
    alb = mix(vec3(0.26, 0.20, 0.045), vec3(0.35, 0.27, 0.06), idv);
    rough = 0.62; trans = 0.05; occ = 0.75;
    matId = ${1 .toFixed(1)};
    thin = 0.2;
    alb *= mix(1.0, 0.75, wet);
    rough = clamp(rough - wet * 0.12, 0.28, 1.0);
  } else if(uLitter > 0.5){
    // hardwood litter: ochre, rust, umber, a few leftover green blades.
    // papery and matte — the living-leaf wet path made these plastic.
    vec3 ochre = mix(uLeafA, uLeafB, fract(idv * 2.9));
    vec3 rust = vec3(0.155, 0.052, 0.022);
    vec3 umber = vec3(0.072, 0.048, 0.026);
    vec3 olive = vec3(0.062, 0.064, 0.028);
    float kind = fract(idv * 9.1);
    alb = mix(ochre, rust, smoothstep(0.52, 0.88, kind));
    alb = mix(alb, umber, smoothstep(0.18, 0.0, kind) * 0.70);
    alb = mix(alb, olive, smoothstep(0.22, 0.08, kind) * 0.45);
    alb *= mix(0.70, 1.08, fract(idv * 4.7));
    alb *= mix(1.0, 0.58, rib * 0.85);
    float across = vUv.x * 2.0 - 1.0;
    N = normalize(N + T * across * 2.0 + B * (vUv.y - 0.5) * 1.25);
    rough = mix(0.80, 0.96, fract(idv * 4.1));
    trans = 0.16;
    occ = mix(0.52, 0.94, clamp(vUv.y, 0.0, 1.0));
    matId = ${1 .toFixed(1)};
    thin = 0.82;
    alb *= mix(1.0, 0.80, wet);
    rough = clamp(rough - wet * 0.06, 0.68, 1.0);
  } else {
    // frond leaflets and leaf blades
    float lush = clamp(0.35 + eco.r * 0.7 - eco.b * 0.35, 0.0, 1.3);
    vec3 green = mix(uLeafA, uLeafB, fract(idv * 2.9)) * mix(0.62, 1.30, lush);
    // fronds brown from the tip inward as they age
    float age = clamp(vTint * 0.9 + fract(idv * 11.3) * 0.5 - 0.15, 0.0, 1.0);
    float tipAge = clamp(age * (0.35 + 1.25 * vUv.y), 0.0, 1.0);
    vec3 dead = mix(vec3(0.115, 0.072, 0.028), vec3(0.175, 0.125, 0.045), idv);
    alb = mix(green, dead, tipAge * 0.85);
    alb *= mix(1.0, 0.68, rib * 0.8);
    // curl the leaflet across its width and along the frond
    float across = vUv.x * 2.0 - 1.0;
    N = normalize(N + T * across * 1.1 + B * (vUv.y - 0.5) * 0.5);
    rough = mix(0.38, 0.66, fract(idv * 4.1));
    trans = uPlantParams.x * mix(0.8, 1.2, 1.0 - rib) * mix(1.0, 0.5, tipAge);
    occ = mix(0.45, 1.0, clamp(vExtra.z * 1.3, 0.0, 1.0));
    matId = ${1 .toFixed(1)};
    thin = 1.0 - rib * 0.55;
    alb *= mix(1.0, 0.70, wet);
    rough = clamp(rough - wet * 0.22, 0.05, 1.0);
  }

  writeGBuffer(alb, occ, N, rough, trans, vCur, vPrev, matId, thin);
}
`,side:2})}function $e(e,t,n={}){let r={...Ye(),...e.sharedUniforms,uPlantHeight:{value:t.height??.4},uWindAmp:{value:t.windAmp??0},uAlignGround:{value:t.alignGround??.9},uStoneA:{value:new a(...t.stoneA??[.055,.053,.05])},uStoneB:{value:new a(...t.stoneB??[.125,.12,.112])},uWoodA:{value:new a(...t.woodA??[.055,.044,.032])},uWoodB:{value:new a(...t.woodB??[.13,.108,.078])},uSolidParams:{value:new o(t.capHue??.08,t.roughBias??0,t.mossBias??0,0)}};return n.shadow?new c({glslVersion:P,uniforms:r,vertexShader:Z(!0),fragmentShader:`precision highp float;
        layout(location = 0) out vec4 oCol;
        void main(){ oCol = vec4(1.0); }`,side:0}):new c({glslVersion:P,uniforms:r,vertexShader:Z(!1),fragmentShader:`
${Xe}
${M}
${w}
${Je}
${g}
in vec3 vWorld; in vec3 vNormal; in vec2 vUv; in vec4 vExtra;
in vec4 vCur; in vec4 vPrev; in float vFade; in float vTint;
void main(){
  if(vFade < 0.999){
    if(ign(gl_FragCoord.xy, uTime * 0.23 + 2.7) > vFade) discard;
  }
  int part = int(vExtra.x + 0.5);
  vec3 N = normalize(vNormal);
  if(!gl_FrontFacing) N = -N;
  vec3 dp1 = dFdx(vWorld), dp2 = dFdy(vWorld);
  vec3 T = normalize(cross(N, vec3(0.0, 1.0, 0.0)) + vec3(1e-4, 0.0, 0.0));
  vec3 B = cross(N, T);

  vec4 eco = ecoSample(vWorld.xz);
  float wetMap = mapWetness(vWorld.xz);
  float wd = mapWaterDepth(vWorld.xz);
  float hAbove = vWorld.y - groundHeight(vWorld.xz);
  // soak the lower faces of stones sitting in the wet band
  float lip = smoothstep(-0.95, 0.04, wd) * (1.0 - smoothstep(0.10, 0.48, wd));
  float soak = lip * (1.0 - smoothstep(0.05, 0.52, hAbove));
  float wet = clamp(max(wetMap * 0.85 + uWeather.w * 0.9, soak * 0.94), 0.0, 1.0);
  float idv = fract(vExtra.w * 5.71 + vTint * 2.3);
  float lodPx = length(vec2(length(dFdx(vWorld.xz)), length(dFdy(vWorld.xz))));
  float det = clamp(1.0 - lodPx * 3.5, 0.0, 1.0);

  vec3 alb; float rough; float occ = 1.0; float matId = ${3 .toFixed(1)};
  float trans = 0.0;

  if(part == ${H.STONE}){
    // granular stone with bedding and a chipped, faceted feel
    float g1 = fbm(vWorld * 26.0, 3, 2.1, 0.5) * 0.5 + 0.5;
    float g2 = fbm(vWorld * 105.0, 3, 2.1, 0.5) * 0.5 + 0.5;
    float bed = fbm(vec3(vWorld.y * 9.0, (vWorld.x + vWorld.z) * 1.4, 0.0) + idv * 20.0, 3, 2.2, 0.5);
    vec3 stone = mix(uStoneA, uStoneB, g1 * 0.7 + 0.3 * (bed * 0.5 + 0.5));
    stone *= 0.82 + 0.4 * g2;
    // quartz speckle
    stone += vec3(0.055) * smoothstep(0.80, 0.96, g2) * det;
    float crack = smoothstep(0.74, 0.97, ridged(vWorld.xz * 12.0 + vWorld.y * 4.0, 3, 2.2, 0.5));
    stone = mix(stone, stone * 0.42, crack * 0.7);
    alb = stone;
    vec3 d1 = noised(vWorld.xz * 30.0 + vWorld.y * 8.0);
    N = perturbN(N, T, B, d1.yz * 0.55 * det, 0.5);
    rough = mix(0.55, 0.80, g1) + uSolidParams.y;
    occ = mix(0.7, 1.0, 1.0 - crack * 0.6);
    // lichen crusts on the upper faces, moss on the shaded damp ones
    float up = clamp(N.y, 0.0, 1.0);
    float lich = smoothstep(0.55, 0.9, fbm(vWorld * 6.5 + 41.0, 4, 2.1, 0.5) * 0.5 + 0.5) * up;
    alb = mix(alb, mix(vec3(0.135, 0.142, 0.108), vec3(0.195, 0.190, 0.140), g1), lich * 0.5);
    float moss = smoothstep(0.42, 0.85, eco.r) * up * smoothstep(0.4, 0.85, fbm(vWorld * 3.1 + 7.0, 3, 2.1, 0.5) * 0.5 + 0.5);
    moss = clamp(moss * (1.0 + uSolidParams.z), 0.0, 1.0);
    alb = mix(alb, mix(vec3(0.028, 0.058, 0.020), vec3(0.058, 0.100, 0.032), g1), moss * 0.85);
    rough = mix(rough, 0.95, moss);
  } else if(part == ${H.WOOD} || part == ${H.BARK}){
    float grain = fbm(vec3(vWorld.x * 2.2, vWorld.y * 42.0, vWorld.z * 2.2) + idv * 13.0, 3, 2.1, 0.5) * 0.5 + 0.5;
    float ridge = ridged(vec2(vUv.x * 3.4, vUv.y * 0.22) + idv * 9.0, 4, 2.13, 0.52);
    vec3 wood = mix(uWoodA, uWoodB, grain * 0.55 + ridge * 0.45);
    if(vExtra.z > 1.5){
      float rr = length(vUv - 0.5);
      float rings = 0.5 + 0.5 * sin(rr * 38.0 + idv * 8.0);
      wood = mix(vec3(0.145, 0.102, 0.062), vec3(0.205, 0.150, 0.088), rings);
    }
    // rotting wood goes grey and soft
    float rot = smoothstep(0.45, 0.9, fbm(vWorld * 1.7 + 61.0, 3, 2.1, 0.5) * 0.5 + 0.5);
    wood = mix(wood, mix(vec3(0.085, 0.080, 0.070), vec3(0.145, 0.138, 0.122), grain), rot * 0.7);
    alb = wood;
    vec3 d1 = noised(vec2(vUv.x * 9.0, vUv.y * 1.2) + idv * 5.0);
    N = perturbN(N, T, B, d1.yz * 0.7 * det, 0.35);
    rough = mix(0.78, 0.94, grain);
    occ = mix(0.62, 1.0, ridge);
    matId = ${2 .toFixed(1)};
    float up = clamp(N.y, 0.0, 1.0);
    float moss = smoothstep(0.35, 0.80, eco.r) * up * smoothstep(0.35, 0.8, fbm(vWorld * 4.3 + 3.0, 3, 2.1, 0.5) * 0.5 + 0.5);
    moss = clamp(moss * (1.0 + uSolidParams.z * 1.4), 0.0, 1.0);
    alb = mix(alb, mix(vec3(0.026, 0.055, 0.019), vec3(0.055, 0.098, 0.030), grain), moss * 0.9);
    rough = mix(rough, 0.96, moss);
  } else if(part == ${H.CAP}){
    float hue = uSolidParams.x + idv * 0.12;
    vec3 base = vec3(0.5) + 0.40 * cos(6.2831853 * (hue) + vec3(0.0, 1.1, 2.2));
    base *= mix(0.22, 0.48, fract(idv * 3.3));
    // radial fibres and a paler margin
    float fib = fbm(vec2(atan(vWorld.z, vWorld.x) * 6.0, vUv.y * 5.0) + idv * 17.0, 3, 2.1, 0.5) * 0.5 + 0.5;
    base *= 0.78 + 0.45 * fib;
    base = mix(base, base * 1.5 + 0.03, smoothstep(0.7, 1.0, vUv.y));
    // speckles on some caps
    float spot = smoothstep(0.82, 0.94, fbm(vWorld * 90.0 + idv * 30.0, 2, 2.1, 0.5) * 0.5 + 0.5);
    base = mix(base, vec3(0.55, 0.52, 0.46), spot * step(0.6, fract(idv * 7.7)) * 0.8 * det);
    alb = base;
    rough = mix(0.42, 0.72, fib);
    trans = 0.35;
    occ = mix(0.8, 1.0, vUv.y);
    matId = ${5 .toFixed(1)};
  } else if(part == ${H.GILL}){
    float r = length(vec2(vUv.x - 0.5, vUv.y - 0.5));
    float gills = 0.5 + 0.5 * sin(atan(vUv.y - 0.5, vUv.x - 0.5) * 90.0);
    alb = mix(vec3(0.115, 0.098, 0.082), vec3(0.185, 0.165, 0.140), gills) * mix(0.7, 1.1, idv);
    rough = 0.88;
    occ = 0.42;
    trans = 0.5;
    matId = ${5 .toFixed(1)};
  } else {
    // moss cushion
    float m1 = fbm(vWorld * 22.0, 4, 2.1, 0.5) * 0.5 + 0.5;
    float m2 = fbm(vWorld * 78.0, 3, 2.1, 0.5) * 0.5 + 0.5;
    alb = mix(vec3(0.024, 0.052, 0.018), vec3(0.062, 0.108, 0.034), m1 * 0.7 + m2 * 0.3);
    alb *= 0.8 + 0.45 * m2;
    // sporophytes: tiny reddish stalks
    alb = mix(alb, vec3(0.115, 0.075, 0.040), smoothstep(0.88, 0.97, m2) * 0.5 * det);
    vec3 d1 = noised(vWorld.xz * 90.0);
    N = perturbN(N, T, B, d1.yz * 1.1 * det, 0.6);
    rough = 0.96;
    trans = 0.45;
    occ = mix(0.55, 1.0, clamp(N.y, 0.0, 1.0));
    matId = ${1 .toFixed(1)};
  }

  alb *= mix(1.0, 0.62, wet);
  if(part == ${H.STONE}){
    // keep lithic colour; a soaked hem is darker grit, not mud
    alb *= mix(1.0, 0.78, soak);
    alb = mix(alb, alb * vec3(0.72, 0.70, 0.64), soak * 0.50);
    rough = mix(rough, 0.22, soak * 0.70);
  }
  rough = clamp(rough - wet * 0.22, 0.16, 1.0);
  writeGBuffer(clamp(alb, vec3(0.003), vec3(0.85)), occ, N, rough, trans, vCur, vPrev, matId, 0.5);
}
`,side:0})}var Q=24,et=12,tt=2.8,nt=class{constructor(){this.data=new Float32Array(768),this.count=0}reset(){this.count=0}push(e){let t=(this.count+1)*et;if(t>this.data.length){let e=new Float32Array(Math.max(t,this.data.length*2));e.set(this.data),this.data=e,this.dirtyAlloc=!0}this.data.set(e,this.count*et),this.count++}},rt=class{constructor(e,t){this.forest=e,this.maps=e.maps,this.quality=t,this.densityScale=t.clutterDensity,this.distScale=E(t.clutterRadius/62,.4,1.4),this.mix=Object.create(null),this.meshes=[],this.shadowMeshes=[],this.chunks=new Map,this.pending=[],this.kinds=[],this._eco={},this._last=new a(1e9,1e9,1e9),this._frame=0,this.radius=0,this.stats={instances:0,kinds:0},this.maxInstances=2200}async build(e){let t=this.maps,n=0,i=X.reduce((e,t)=>e+t.variants,0);for(let o=0;o<X.length;o++){let s=X[o],c=s.maxDist*this.distScale;this.radius=Math.max(this.radius,c);let l=[];for(let d=0;d<s.variants;d++){let f=k(o*7919+17,d*104729+3),p=s.build(f,{}),m=p.mesh.toGeometry();if(!m)continue;let h=this._materialConfig(s.key,p),g=p.material===`plant`||p.material===`litter`,_=new nt,v=new r;v.index=m.index;for(let e of[`position`,`normal`,`uv`,`aExtra`,`aSway`])v.setAttribute(e,m.getAttribute(e));v.boundingSphere=new u(new a,1e6);let y=this._attach(v,_),b=g?Qe(t,h):$e(t,h),x=g?Qe(t,h,{shadow:!0}):$e(t,h,{shadow:!0}),C=new S(v,b);C.frustumCulled=!1,C.matrixAutoUpdate=!1;let w=new S(v,x);w.frustumCulled=!1,w.matrixAutoUpdate=!1,w.userData.cascades=p.height>1.2?[0,1]:[0];let T={arch:s,variantIndex:d,geo:v,buf:y,bucket:_,mesh:C,shadowMesh:w,height:p.height,radius:p.radius,sink:p.sink??0,maxDist:c,triangles:p.mesh.triangles};l.push(T),this.meshes.push(C),this.shadowMeshes.push(w),n++,e?.(n/i,`growing ${s.key} ${d+1}/${s.variants}`),await new Promise(e=>setTimeout(e,0))}this.kinds.push({arch:s,variants:l,maxDist:c})}this.stats.kinds=this.kinds.length}setLook({density:e,distScale:t,mix:n,maxInstances:r}={}){let i=!1;if(e!=null){let t=E(e,.02,1.5);Math.abs(t-this.densityScale)>1e-4&&(this.densityScale=t,i=!0)}if(t!=null){let e=E(t,.35,1.25);if(Math.abs(e-this.distScale)>.001){this.distScale=e,this.radius=0;for(let e of this.kinds)e.maxDist=e.arch.maxDist*this.distScale,this.radius=Math.max(this.radius,e.maxDist);i=!0}}if(r!=null&&(this.maxInstances=r),n){for(let e of Object.keys(n))Math.abs((this.mix[e]??1)-n[e])>.001&&(i=!0);Object.assign(this.mix,n)}i&&this.invalidate()}invalidate(){this.chunks.clear(),this.pending.length=0,this._last.set(1e9,1e9,1e9)}_streamRadius(){return this.radius+Q*1.5}_chunkCenter(e,t){return{x:(e+.5)*Q,z:(t+.5)*Q}}_forItems(e){for(let t of this.chunks.values())for(let n of t.byKind)for(let t of n)e(t)}_pruneFar(e){let t=this._streamRadius()+Q*2.4;for(let n of this.chunks.keys()){let[r,i]=n.split(`,`).map(Number),a=this._chunkCenter(r,i);Math.hypot(a.x-e.x,a.z-e.z)>t&&this.chunks.delete(n)}}_pruneOutsideMaps(){let e=this.maps;if(e?.covers)for(let t of this.chunks.keys()){let[n,r]=t.split(`,`).map(Number),i=this._chunkCenter(n,r);e.covers(i.x,i.z)||this.chunks.delete(t)}}_enqueueMissing(e){let t=this._streamRadius(),n=Math.floor((e.x-t)/Q),r=Math.floor((e.x+t)/Q),i=Math.floor((e.z-t)/Q),a=Math.floor((e.z+t)/Q),o=[];for(let s=i;s<=a;s++)for(let i=n;i<=r;i++){let n=`${i},${s}`;if(this.chunks.has(n))continue;let r=this._chunkCenter(i,s),a=Math.hypot(r.x-e.x,r.z-e.z);a>t+Q*.25||o.push({cx:i,cz:s,key:n,dist:a})}o.sort((e,t)=>e.dist-t.dist),this.pending=o}_ageAppear(e){if(e<=0)return!1;let t=e*tt,n=!1;return this._forItems(e=>{let r=e._appear??0;r<1&&(e._appear=Math.min(1,r+t),n=!0)}),n}fillAround(e,{settle:t=!1}={}){let n=e.position;for(this._pruneFar(n),this._pruneOutsideMaps(),this.pending.length=0,this._enqueueMissing(n);this.pending.length;){let e=this.pending.shift();this.chunks.has(e.key)||this.chunks.set(e.key,this._generateChunk(e.cx,e.cz))}t&&this._forItems(e=>{e._appear=1}),this._last.copy(n),this._rebuild(e)}_materialConfig(e,t){let n={height:Math.max(t.height,.05),alignGround:0,windAmp:.03};switch(e){case`fern`:return{...n,leaflets:15,serration:.6,transmission:.8,windAmp:.026,leafA:[.026,.066,.022],leafB:[.062,.122,.036]};case`bush`:return{...n,leaflets:9,serration:1,transmission:.72,windAmp:.024,leafA:[.036,.082,.026],leafB:[.082,.14,.044],stemA:[.052,.048,.03],stemB:[.095,.085,.052]};case`bramble`:return{...n,leaflets:7,serration:1.4,transmission:.66,windAmp:.03,leafA:[.032,.07,.026],leafB:[.075,.125,.042],stemA:[.07,.048,.038],stemB:[.12,.08,.058]};case`flower`:return{...n,leaflets:5,serration:.8,transmission:.85,windAmp:.045,petalHue:.62,leafA:[.04,.09,.03],leafB:[.09,.15,.048]};case`sedge`:return{...n,leaflets:3,serration:.2,transmission:.88,windAmp:.038,leafA:[.048,.082,.028],leafB:[.11,.138,.042]};case`lily`:return{...n,leaflets:1,serration:0,transmission:.12,windAmp:.006,floatWater:!0,alignGround:0,leafA:[.026,.058,.018],leafB:[.055,.095,.028]};case`leafPatch`:return{...n,leaflets:5,serration:1.2,transmission:.18,windAmp:.004,alignGround:1,litter:!0,leafA:[.112,.068,.028],leafB:[.068,.042,.02]};case`herb`:return{...n,leaflets:3,serration:.4,transmission:.82,windAmp:.028,leafA:[.034,.078,.026],leafB:[.072,.132,.042]};case`mushroom`:return{...n,alignGround:.45,windAmp:.002,capHue:.075,mossBias:0};case`rock`:return{...n,alignGround:1,windAmp:0,mossBias:.2};case`twig`:return{...n,alignGround:1,windAmp:.002,mossBias:.1};case`log`:return{...n,alignGround:.85,windAmp:0,mossBias:.9,woodA:[.062,.05,.036],woodB:[.14,.118,.086]};case`moss`:return{...n,alignGround:1,windAmp:.002,mossBias:1};case`vine`:return{...n,leaflets:11,serration:.7,transmission:.74,windAmp:.034,leafA:[.028,.072,.024],leafB:[.07,.128,.04],stemA:[.04,.038,.024],stemB:[.08,.07,.042]};case`limb`:return{...n,alignGround:1,windAmp:0,mossBias:.35,woodA:[.055,.042,.028],woodB:[.125,.1,.068]};default:return n}}_attach(e,t){let r=new n(t.data,et,1);return r.setUsage(F),e.setAttribute(`iPosScale`,new l(r,4,0)),e.setAttribute(`iRot`,new l(r,4,4)),e.setAttribute(`iVar`,new l(r,4,8)),e.instanceCount=0,r}_generateChunk(e,t){let n=this.maps,r=this._eco,i={byKind:X.map(()=>[]),cx:e,cz:t},a=new j(k(e,t)^739982445),o=e=>this.mix[e]??1,s=X.reduce((e,t)=>e+t.density*o(t.key),0)*this.densityScale,c=1/Math.sqrt(Math.max(s,1e-4)),l=Math.max(1,Math.min(56,Math.round(Q/c))),u=Q/l,d=e*Q,f=t*Q,p=new Float32Array(X.length);for(let e=0;e<l;e++)for(let t=0;t<l;t++){let c=d+(t+a.f())*u,l=f+(e+a.f())*u,m=a.f(),h=a.f();if(n.sample(c,l,r),!r.inside)continue;let g=0;for(let e=0;e<X.length;e++){let t=X[e],n=Math.max(0,t.score(r))*t.density*o(t.key);p[e]=n,g+=n}if(g<=1e-6||h>E(g/(s*.85),0,1))continue;let _=m*g,v=0;for(let e=0;e<X.length;e++)if(_-=p[e],_<=0){v=e;break}let y=this.kinds[v];if(!y||!y.variants.length)continue;let b=y.variants[a.int(y.variants.length)],S=a.f()*Math.PI*2,C=E(.5-r.moisture*.6+r.rock*.5+a.sym()*.25,0,1),w=x(.72,1.35,a.f()**.85)*x(.8,1.15,r.moisture),T=(.03+r.slope*.22)*a.f(),D=a.f()*Math.PI*2;i.byKind[v].push({x:c,z:l,y:r.height-b.sink*w,scale:w,cos:Math.cos(S),sin:Math.sin(S),tiltX:Math.cos(D)*T,tiltZ:Math.sin(D)*T,phase:a.f(),tint:C,rnd:a.f(),variant:b,height:b.height*w,radius:Math.max(b.radius*w,.1),_appear:0})}let m=[],h=0;for(let e=0;e<X.length;e++){let t=X[e].key;(t===`leafPatch`||t===`moss`||t===`mushroom`||t===`twig`||t===`flower`||t===`herb`||t===`rock`||t===`lily`)&&(m.push(e),h+=X[e].density*o(X[e].key))}let g=Math.max(8,Math.round(Q/1.05)),_=Q/g;for(let e=0;e<g;e++)for(let t=0;t<g;t++){let s=d+(t+a.f())*_,c=f+(e+a.f())*_;if(n.sample(s,c,r),!r.inside)continue;let l=0;for(let e of m){let t=Math.max(0,X[e].score(r))*X[e].density*o(X[e].key);p[e]=t,l+=t}if(l<=1e-6||a.f()>E(l/(h*this.densityScale*.95),0,1))continue;let u=a.f()*l,g=m[0];for(let e of m)if(u-=p[e],u<=0){g=e;break}let v=this.kinds[g];if(!v||!v.variants.length)continue;let y=v.variants[a.int(v.variants.length)],b=a.f()*Math.PI*2,S=E(.5-r.moisture*.6+r.rock*.5+a.sym()*.25,0,1),C=x(.65,1.15,a.f()**.85),w=(.02+r.slope*.18)*a.f(),T=a.f()*Math.PI*2;i.byKind[g].push({x:s,z:c,y:r.height-y.sink*C,scale:C,cos:Math.cos(b),sin:Math.sin(b),tiltX:Math.cos(T)*w,tiltZ:Math.sin(T)*w,phase:a.f(),tint:S,rnd:a.f(),variant:y,height:y.height*C,radius:Math.max(y.radius*C,.1),_appear:0})}return this._plantLogFungi(i,a),i}_plantLogFungi(e,t){let n=X.findIndex(e=>e.key===`log`),r=X.findIndex(e=>e.key===`mushroom`),i=this.kinds[r];if(n<0||!i?.variants.length)return;let a=e.byKind[n],o=e.byKind[r],s=this._eco;for(let e of a){let n=2+t.int(3),r=Math.max(e.radius,.9);for(let a=0;a<n;a++){let n=(t.f()-.5)*1.55,a=(t.f()-.5)*.42,c=e.x+e.cos*n*r-e.sin*a,l=e.z+e.sin*n*r+e.cos*a;if(this.maps.sample(c,l,s),!s.inside||s.waterDepth>-.04)continue;let u=i.variants[t.int(i.variants.length)],d=x(.9,1.55,t.f()),f=t.f()*Math.PI*2;o.push({x:c,z:l,y:s.height-(u.sink??0)*d+.03,scale:d,cos:Math.cos(f),sin:Math.sin(f),tiltX:0,tiltZ:0,phase:t.f(),tint:.12,rnd:t.f(),variant:u,height:u.height*d,radius:Math.max(u.radius*d,.05),_appear:0})}}}onMapsRebaked(){this._pruneOutsideMaps(),this.pending.length=0,this._last.set(1e9,1e9,1e9)}update(e,t){this._frame++;let n=t.position;this._pruneFar(n),this.pending.length===0&&this._enqueueMissing(n);let r=this.chunks.size===0?36:this.pending.length>12?10:5,i=0;for(;this.pending.length&&i<r;){let e=this.pending.shift();this.chunks.has(e.key)||(this.chunks.set(e.key,this._generateChunk(e.cx,e.cz)),i++)}let a=this._ageAppear(e);(i>0||a||this._last.distanceTo(n)>3||this._frame%40==0)&&(this._last.copy(n),this._rebuild(t))}_rebuild(n){let r=n.position;for(let e of this.kinds)for(let t of e.variants)t.bucket.reset();let i=this._frustum??=new t,a=this._mvp??=new e;a.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),i.setFromProjectionMatrix(a);let o=this._sphere??=new u,s=new Float32Array(et),c=0,l=this.maxInstances||2200,d=[...this.chunks.values()].sort((e,t)=>{let n=e.cx*Q+Q*.5-r.x,i=e.cz*Q+Q*.5-r.z,a=t.cx*Q+Q*.5-r.x,o=t.cz*Q+Q*.5-r.z;return n*n+i*i-(a*a+o*o)});for(let e of d){if(c>=l)break;let t=e.cx*Q,n=e.cz*Q,a=Math.max(t,Math.min(r.x,t+Q)),u=Math.max(n,Math.min(r.z,n+Q)),d=Math.hypot(r.x-a,r.z-u);for(let t=0;t<e.byKind.length;t++){let n=this.kinds[t];if(!n||d>n.maxDist)continue;let a=n.maxDist;for(let n of e.byKind[t]){if(c>=l)break;let e=n.x-r.x,t=n.z-r.z,u=Math.sqrt(e*e+t*t);u>a||u>8&&(o.center.set(n.x,n.y+n.height*.5,n.z),o.radius=Math.max(n.radius,n.height)*1.4+.5,!i.intersectsSphere(o))||(s[0]=n.x,s[1]=n.y,s[2]=n.z,s[3]=n.scale,s[4]=n.cos,s[5]=n.sin,s[6]=n.tiltX,s[7]=n.tiltZ,s[8]=n.phase,s[9]=n.tint,s[10]=n.rnd,s[11]=(1-m(a*.8,a,u))*(n._appear??1),n.variant.bucket.push(s),c++)}if(c>=l)break}}for(let e of this.kinds)for(let t of e.variants)t.bucket.dirtyAlloc&&(t.buf=this._attach(t.geo,t.bucket),t.bucket.dirtyAlloc=!1),t.geo.instanceCount=t.bucket.count,t.mesh.visible=t.bucket.count>0,t.shadowMesh.visible=t.bucket.count>0,t.buf.needsUpdate=!0;this.stats.instances=c}beforeShadow(e,t){for(let e of this.kinds)for(let n of e.variants)n.shadowMesh.visible=n.bucket.count>0&&n.shadowMesh.userData.cascades.includes(t)}},$=16,it=24;function at(e){let t=e+1,n=new Float32Array(t*t*3),i=[],o=0;for(let r=0;r<t;r++)for(let i=0;i<t;i++)n[o++]=i/e,n[o++]=0,n[o++]=r/e;for(let n=0;n<e;n++)for(let r=0;r<e;r++){let e=n*t+r,a=e+1,o=e+t,s=o+1;i.push(e,o,a,a,o,s)}let s=new r;return s.setAttribute(`position`,new I(n,3)),s.setIndex(i),s.boundingSphere=new u(new a,1e6),s}var ot=`
uniform vec4 uWaterWave;   // x ripple scale, y ripple amp, z chop, w rain ripples

/**
 * Ripple normal. Three octaves of gradient noise advected along the local flow
 * plus a wind-driven cross component; rain adds concentric micro-ripples whose
 * phase is randomised per cell so the surface stirs rather than pulses.
 */
vec3 rippleNormal(vec2 p, vec2 flow, float flowMag, float depth, float lodPx){
  float t = uTime;
  vec2 fdir = flowMag > 1e-4 ? flow / flowMag : vec2(0.0, 1.0);
  float amp = uWaterWave.y * mix(0.35, 1.0, smoothstep(0.0, 0.45, depth));
  // Still ponds used to keep 22% of the chop and read as a painted slab.
  amp *= mix(0.78, 1.0, smoothstep(0.05, 0.42, flowMag));
  float det = clamp(1.0 - lodPx * 6.0, 0.0, 1.0);

  vec2 q1 = p * (0.85 * uWaterWave.x) - fdir * t * (0.35 + flowMag * 1.6);
  vec2 q2 = p * (2.30 * uWaterWave.x) - fdir * t * (0.62 + flowMag * 2.9) + 11.0;
  vec2 q3 = p * (6.10 * uWaterWave.x) - fdir * t * (1.05 + flowMag * 4.7) + 27.0;
  vec2 q4 = p * (14.0 * uWaterWave.x) + vec2(-fdir.y, fdir.x) * t * 0.9 + 41.0;

  vec3 d1 = noised(q1);
  vec3 d2 = noised(q2);
  vec3 d3 = noised(q3);
  vec3 d4 = noised(q4);
  vec2 grad = d1.yz * 0.55 + d2.yz * 0.34 + d3.yz * 0.22 * det + d4.yz * 0.13 * det;
  grad *= amp * (1.0 + flowMag * 2.2);

  // standing waves upstream of obstructions: sharpen the crests in fast flow
  grad += vec2(d3.y, d3.z) * flowMag * uWaterWave.z * 0.6 * det;

  if(uWaterWave.w > 0.001){
    // rain impact rings — cell size ~1.2 m so they survive a tiny plate
    vec3 w = worley2(p * 0.85 + floor(t * 1.4) * 9.1, 1.0);
    float ring = sin(w.x * 18.0 - fract(t * 1.4) * 14.0) * exp(-w.x * 3.4);
    vec3 wg = noised(p * 0.85 + floor(t * 1.4) * 9.1);
    grad += wg.yz * ring * uWaterWave.w * 1.35;
  }
  return normalize(vec3(-grad.x, 1.0, -grad.y));
}

/** Geometric chop. Normals alone left close cells as a flat 16 m slab. */
float rippleHeight(vec2 p, vec2 flow, float flowMag, float depth){
  float t = uTime;
  vec2 fdir = flowMag > 1e-4 ? flow / flowMag : vec2(0.0, 1.0);
  // centimetre chop dies at 528 px. Riffle-scale displacement is what
  // still reads as a surface when the camera sits on the bank.
  float amp = uWaterWave.y * mix(0.20, 0.58, smoothstep(0.0, 0.42, depth));
  amp *= mix(0.78, 1.0, smoothstep(0.05, 0.42, flowMag));
  vec2 q1 = p * (0.85 * uWaterWave.x) - fdir * t * (0.35 + flowMag * 1.6);
  vec2 q2 = p * (2.30 * uWaterWave.x) - fdir * t * (0.62 + flowMag * 2.9) + 11.0;
  float h = (noised(q1).x * 2.0 - 1.0) * 0.64 + (noised(q2).x * 2.0 - 1.0) * 0.30;
  return h * amp * (1.0 + flowMag * 1.55);
}

/** Procedural caustics: interference of two rotating worley fields.
 *  Metre-scale cores. A soft field graded to milk on the tea plate. */
float caustics(vec2 p, float t){
  float a = worley2(p * 0.95 + vec2(t * 0.16, -t * 0.11), 1.0).x;
  float b = worley2(p * 1.40 + vec2(-t * 0.13, t * 0.19) + 7.0, 1.0).x;
  float c = 1.0 - min(a, b);
  return smoothstep(0.64, 0.90, c);
}
`,st=class{constructor(e,t){this.forest=e,this.maps=e.maps,this.quality=t,this.grid=t.waterGrid??it,this.geometry=at(this.grid),this.maxCells=t.waterCells??240,this.data=new Float32Array(this.maxCells*4),this.buf=new n(this.data,4,1),this.buf.setUsage(F),this.geometry.setAttribute(`iCell`,new l(this.buf,4,0)),this.geometry.instanceCount=0,this.cells=[],this.generation=-1,this.radius=t.waterRadius??260,this.uniforms={...y.pick(`uTime`,`uDelta`,`uCamPos`,`uWind`,`uWindPhase`,`uWeather`,`uSunDir`,`uSunColor`,`uMoonDir`,`uMoonColor`,`uSkyAmbient`,`uJitter`,`uViewProj`,`uPrevViewProj`,`uInvViewProj`,`uResolution`,`uNearFar`,`uFlash`,`uFlashColor`,`uFire`,`uFireColor`,`uSkyProbe`,`uSkyIrradiance`,`uShadowMap`,`uShadowMatrices`,`uShadowSplits`,`uShadowTexel`),...this.maps.sharedUniforms,uSceneColor:{value:null},uSceneDepth:{value:null},uCellSize:{value:$},uGrid:{value:this.grid},uWaterWave:{value:new o(1,.3,.5,0)},uAbsorb:{value:new a(.4,.13,.062)},uScatter:{value:new a(.018,.038,.07)},uFoam:{value:1}},this.look={tint:.42,foam:1,waves:1},this.material=new c({glslVersion:P,uniforms:this.uniforms,vertexShader:this._vertex(),fragmentShader:this._fragment(),side:2,transparent:!1,depthTest:!1,depthWrite:!1}),this.waterMesh=new S(this.geometry,this.material),this.waterMesh.frustumCulled=!1,this.waterMesh.matrixAutoUpdate=!1,this.stats={cells:0},this._causticHeld=!1}setLook({radius:e,tint:t,foam:n,waves:r}={}){e!=null&&(this.radius=Math.max(16,Math.min(e,260))),n!=null&&(this.look.foam=n),r!=null&&(this.look.waves=r),t!=null&&this._applyTint(t)}_applyTint(e){this.look.tint=e;let t=[.22,.08,.045],n=[.01,.022,.048],r=[.4,.13,.062],i=[.018,.038,.07],a=[.62,.38,.28],o=[.055,.042,.018],s=(e,t,n)=>[e[0]+(t[0]-e[0])*n,e[1]+(t[1]-e[1])*n,e[2]+(t[2]-e[2])*n],[c,l]=e<.5?[s(t,r,e/.5),s(n,i,e/.5)]:[s(r,a,(e-.5)/.5),s(i,o,(e-.5)/.5)];this.uniforms.uAbsorb.value.set(c[0],c[1],c[2]),this.uniforms.uScatter.value.set(l[0],l[1],l[2])}holdCaustics(e,t,n){this._causticHeld=!0,p.uCausticHold.value.set(e,t,n,1)}_vertex(){return`
precision highp float;
precision highp int;
${M}
${w}
uniform float uTime;
${ot}
uniform mat4 uViewProj;
uniform vec3 uCamPos;
uniform vec4 uWind;
uniform float uCellSize;
uniform float uGrid;
in vec3 position;
in vec4 iCell;    // xy cell origin, z lod scale, w unused
out vec3 vWorld;
out vec4 vCur;
out float vLodPx;
void main(){
  vec2 wp = iCell.xy + position.xz * uCellSize;
  vec4 m = mapSample(wp);
  float surf = m.g;
  float ground = m.r;
  float depth = max(surf - ground, 0.0);
  vec2 flow = uWind.xy;
  float fl = length(flow);
  flow = fl > 1e-4 ? flow / fl : vec2(0.0, 1.0);
  float dist = length(vec3(wp.x, surf, wp.y) - uCamPos);
  float fade = 1.0 - smoothstep(110.0, 280.0, dist);
  float near = 1.0 - smoothstep(4.0, 22.0, dist);
  float stillBoost = 1.0 + (1.0 - smoothstep(0.04, 0.28, clamp(m.a, 0.0, 1.0))) * 0.35;
  float chop = rippleHeight(wp, flow, clamp(m.a, 0.0, 1.0), depth)
             * (fade + near * 0.70) * stillBoost;
  // Dry verts stay on the bank. Sinking them 0.35 m made black wedges
  // along the waterline on the close still.
  float y = depth > 0.0 ? max(surf + chop, ground + 0.01) : ground + 0.02;
  vec3 world = vec3(wp.x, y, wp.y);
  vWorld = world;
  vLodPx = length(world - uCamPos);
  vCur = uViewProj * vec4(world, 1.0);
  gl_Position = vCur;
}
`}_fragment(){return`
precision highp float;
precision highp int;
precision highp sampler2DShadow;
uniform vec3 uCamPos; uniform vec4 uWeather; uniform float uTime;
uniform vec4 uWind;
uniform vec3 uSunDir; uniform vec3 uSunColor; uniform vec3 uMoonDir; uniform vec3 uMoonColor;
uniform vec3 uSkyAmbient;
uniform vec4 uFlash; uniform vec3 uFlashColor;
uniform vec4 uFire; uniform vec3 uFireColor;
${M}
${w}
${D}
${A}
${ot}
uniform sampler2D uSceneColor;
uniform sampler2D uSceneDepth;
uniform mat4 uInvViewProj;
uniform mat4 uViewProj;
uniform vec2 uResolution;
uniform vec3 uAbsorb;
uniform vec3 uScatter;
uniform float uFoam;
layout(location = 0) out vec4 oColor;
in vec3 vWorld;
in vec4 vCur;
in float vLodPx;

vec3 sceneAt(vec2 uv){ return texture(uSceneColor, uv).rgb; }

/** Screen-space reflection with a sky-probe fallback. */
vec3 reflection(vec3 p, vec3 R, vec3 skyFallback, float rough){
  float stepLen = 0.16;
  vec3 q = p + R * 0.06;
  vec3 hit = skyFallback;
  float hitW = 0.0;
  for(int i = 0; i < 32; i++){
    q += R * stepLen;
    stepLen *= 1.22;
    vec4 c = uViewProj * vec4(q, 1.0);
    if(c.w <= 0.0) break;
    vec2 uv = (c.xy / c.w) * 0.5 + 0.5;
    if(any(lessThan(uv, vec2(0.002))) || any(greaterThan(uv, vec2(0.998)))) break;
    float d = texture(uSceneDepth, uv).r;
    if(d >= 0.999999) continue;
    vec3 sp = worldFromDepth(uv, d, uInvViewProj);
    float along = dot(sp - p, R);
    float behind = length(sp - p) - length(q - p);
    if(behind < -0.04 && behind > -4.2 && along > 0.0){
      vec2 e = min(uv, 1.0 - uv);
      float edge = smoothstep(0.0, 0.08, min(e.x, e.y));
      return mix(skyFallback, sceneAt(uv), edge * 0.94);
    }
  }
  // Planar hints toward the opposite bank when the march misses. Without
  // this a still pond is only sky + a painted column.
  vec3 Rp = normalize(vec3(R.x, abs(R.y) + 0.10, R.z));
  vec4 pc = uViewProj * vec4(p + Rp * 5.5, 1.0);
  if(pc.w > 0.0){
    vec2 uv = (pc.xy / pc.w) * 0.5 + 0.5;
    if(all(greaterThan(uv, vec2(0.02))) && all(lessThan(uv, vec2(0.98)))){
      float d = texture(uSceneDepth, uv).r;
      if(d < 0.9995){
        vec2 e = min(uv, 1.0 - uv);
        float edge = smoothstep(0.0, 0.10, min(e.x, e.y));
        hit = mix(skyFallback, sceneAt(uv), edge * 0.70);
        hitW = 1.0;
      }
    }
  }
  if(hitW < 0.5){
    pc = uViewProj * vec4(p + Rp * 14.0, 1.0);
    if(pc.w > 0.0){
      vec2 uv = (pc.xy / pc.w) * 0.5 + 0.5;
      if(all(greaterThan(uv, vec2(0.02))) && all(lessThan(uv, vec2(0.98)))){
        float d = texture(uSceneDepth, uv).r;
        if(d < 0.9995){
          vec2 e = min(uv, 1.0 - uv);
          float edge = smoothstep(0.0, 0.10, min(e.x, e.y));
          hit = mix(skyFallback, sceneAt(uv), edge * 0.62);
          hitW = 1.0;
        }
      }
    }
  }
  return mix(skyFallback, hit, hitW);
}

void main(){
  vec2 uvScreen = (vCur.xy / vCur.w) * 0.5 + 0.5;
  // manual depth test against the scene: the target has no depth attachment
  float sceneDepth = texture(uSceneDepth, uvScreen).r;
  if(gl_FragCoord.z > sceneDepth + 1.0e-7) discard;

  vec2 wxz = vWorld.xz;
  if(mapInside(wxz) < 0.08) discard;
  vec4 m = mapSample(wxz);
  float surf = m.g;
  float ground = m.r;
  float depth = surf - ground;
  if(depth <= 0.006) discard;
  float body = smoothstep(0.12, 0.85, depth);

  float flowMag = clamp(m.a, 0.0, 1.0);
  // flow follows the downhill gradient of the water surface
  float e = uMapInfo.w * 2.0;
  float sL = texture(uMapTex, mapUv(wxz - vec2(uMapInfo.z * e, 0.0))).g;
  float sR = texture(uMapTex, mapUv(wxz + vec2(uMapInfo.z * e, 0.0))).g;
  float sD = texture(uMapTex, mapUv(wxz - vec2(0.0, uMapInfo.z * e))).g;
  float sU = texture(uMapTex, mapUv(wxz + vec2(0.0, uMapInfo.z * e))).g;
  vec2 flow = vec2(sL - sR, sD - sU);
  float fl = length(flow);
  flow = fl > 1e-6 ? flow / fl : normalize(uWind.xy + vec2(0.0, 0.18));
  flowMag = clamp(flowMag * 0.55 + fl * 22.0, 0.0, 1.4);

  float lodPx = length(vec2(length(dFdx(wxz)), length(dFdy(wxz))));
  vec3 N = rippleNormal(wxz, flow, flowMag, depth, lodPx);
  vec3 V = normalize(uCamPos - vWorld);
  if(dot(N, V) < 0.0) N = reflect(N, V);

  float viewDist = length(uCamPos - vWorld);
  // Close bank: a finer wind ripple so the plate is not a 16 m facet.
  float nearW = 1.0 - smoothstep(5.0, 22.0, viewDist);
  if(nearW > 0.01){
    vec3 nClose = noised(wxz * 18.0 - flow * uTime * 1.6 + 3.1);
    vec3 nFine  = noised(wxz * 34.0 + flow.yx * uTime * 0.85 + 9.0);
    N = normalize(N + vec3(
      -(nClose.y * 0.55 + nFine.y * 0.32),
      0.0,
      -(nClose.z * 0.55 + nFine.z * 0.32)
    ) * nearW * 0.30);
  }
  vec2 uv = uvScreen;

  // ---- refraction: offset the lookup by the surface slope, scaled by depth
  float refrScale = clamp(depth * 0.42, 0.0, 0.72) * (22.0 / max(viewDist, 1.0));
  vec2 refrOff = N.xz * refrScale * 0.075;
  vec2 ruv = clamp(uv + refrOff, vec2(0.002), vec2(0.998));
  float bedDepthTex = texture(uSceneDepth, ruv).r;
  vec3 bedPos = worldFromDepth(ruv, bedDepthTex, uInvViewProj);
  // reject samples that are actually in front of the water
  if(bedDepthTex < 0.999999 && length(bedPos - uCamPos) < viewDist - 0.05){
    ruv = uv;
    refrOff = vec2(0.0);
    bedDepthTex = texture(uSceneDepth, uv).r;
    bedPos = worldFromDepth(uv, bedDepthTex, uInvViewProj);
  }
  // a little lateral chromatic split so the column reads as a thick medium
  vec3 bed;
  bed.r = sceneAt(clamp(uv + refrOff * 1.14, vec2(0.002), vec2(0.998))).r;
  bed.g = sceneAt(ruv).g;
  bed.b = sceneAt(clamp(uv + refrOff * 0.86, vec2(0.002), vec2(0.998))).b;
  // Empty / sky refraction is the black hole and the glowing slab: the
  // pond then shows the clear colour or the sky instead of a lake bed.
  float bedSky = step(0.9994, bedDepthTex);
  float bedAbove = step(surf + 0.20, bedPos.y);
  float noBed = max(bedSky, bedAbove);
  vec3 siltBed = vec3(0.052, 0.078, 0.070);
  vec3 deepBed = vec3(0.028, 0.068, 0.108);
  vec3 mapFloor = mix(siltBed, deepBed, body);
  mapFloor *= 0.55 + 0.70 * luma(skyIrradiance(vec3(0.0, 1.0, 0.0)));
  bed = mix(bed, mapFloor, noBed);

  // ---- path length through the water for absorption
  float cosV = max(dot(N, V), 0.08);
  float pathLen = min(depth / cosV, 6.0) + min(depth, 3.0);
  // shallows stay crystal; deeper water goes lake-blue, not tea
  vec3 absorb = uAbsorb * mix(0.38, 1.15, smoothstep(0.07, 0.95, depth));
  vec3 trans = exp(-absorb * pathLen * 1.15);

  // ---- caustics on the bed. Keep a floor in canopy shade so a forest
  // stream is not a dead brown slab the moment a trunk shadows it.
  vec2 causticP = bedPos.xz + N.xz * depth * 1.6;
  float caus = caustics(causticP, uTime);
  vec2 rnd = vec2(ign(gl_FragCoord.xy, uTime), ign(gl_FragCoord.yx + 7.0, uTime));
  float sunShadowK = sunShadow(vWorld, vec3(0.0, 1.0, 0.0), 1.0, viewDist, rnd, 1.0);
  float skyOpen = 0.38 + 0.62 * max(uSunDir.y, 0.0);
  float causAmt = caus * exp(-depth * 0.32) * mix(0.62, sunShadowK, 0.38) * skyOpen;
  vec3 bedLit = bed * (1.0 + causAmt * 1.6) * trans;

  // ---- in-water scattering (turbidity) builds up with depth
  vec3 inScatter = uScatter * vec3(0.48, 0.78, 1.18)
    * (0.32 + luma(skyIrradiance(vec3(0.0, 1.0, 0.0)))) * (1.0 - trans) * 0.82;

  // ---- reflection
  vec3 R = reflect(-V, N);
  if(R.y < 0.02) R.y = 0.02;
  vec3 skyRef = skyRadiance(R, 0.03);
  vec3 refl = reflection(vWorld, R, skyRef, 0.03);

  float f0 = 0.045;
  float fres = f0 + (1.0 - f0) * pow(1.0 - cosV, 5.0);
  fres = mix(fres, clamp(fres * 1.35, 0.0, 0.88), clamp(flowMag * 0.45, 0.0, 1.0));
  float still = 1.0 - smoothstep(0.06, 0.40, flowMag);
  // Grazing water has to take the sky. The old 0.26–0.36 cap painted
  // every pond as a flat glowing slab. A missing bed must not take the
  // sky either — that is the other glowing plate.
  fres = clamp(fres, 0.045, 0.86);
  fres = mix(fres, fres * 0.52, noBed * still);

  // Lift only a crushed bed. A hard cyan floor flattened the column.
  vec3 lake = vec3(0.048, 0.110, 0.168) * (0.70 + luma(skyIrradiance(vec3(0.0, 1.0, 0.0))) * 1.15);
  lake += uSunColor * max(uSunDir.y, 0.0) * vec3(0.03, 0.06, 0.10);
  float bedL = luma(bedLit);
  bedLit = mix(bedLit, max(bedLit, lake * mix(0.36, 0.78, body)), smoothstep(0.055, 0.016, bedL));
  vec3 col = mix(bedLit + inScatter, refl, fres);
  col = mix(col, max(col, lake * 0.40), smoothstep(0.050, 0.014, luma(col)));
  // Crest / trough so a still column is not a single painted value.
  col *= 1.0 + (N.y - 0.88) * 0.22;

  // ---- specular sun glint
  vec3 H = normalize(uSunDir + V);
  float nh = max(dot(N, H), 0.0);
  float a = 0.045 + flowMag * 0.05;
  float spec = D_GGX(nh, a) * V_SmithGGXCorrelated(cosV, max(dot(N, uSunDir), 1e-3), a);
  col += uSunColor * spec * sunShadowK * max(dot(N, uSunDir), 0.0) * 0.30;
  col += uMoonColor * pow(max(dot(N, normalize(uMoonDir + V)), 0.0), 220.0) * 3.0;
  if(uFlash.w > 0.001){
    vec3 fd = normalize(uFlash.xyz - vWorld);
    col += uFlashColor * uFlash.w * pow(max(dot(N, normalize(fd + V)), 0.0), 90.0) * 2.2;
  }
  if(uFire.w > 0.001){
    vec3 toFire = uFire.xyz - vWorld;
    float fd2 = dot(toFire, toFire);
    vec3 fd = toFire * inversesqrt(fd2 + 1e-4);
    float atten = uFire.w / (1.0 + fd2 * 0.014);
    col += uFireColor * atten * pow(max(dot(N, normalize(fd + V)), 0.0), 48.0) * 3.2;
  }

  // ---- foam: meniscus, riffle streaks along the flow, rain agitation
  // Shore lace has to be a few decimetres wide or the waterline dies at
  // 528 px. Keep large holes so it is not a painted white stripe.
  float shore = 1.0 - smoothstep(0.0, 0.30, depth);
  float riffle = smoothstep(0.20, 0.72, flowMag) * (1.0 - smoothstep(0.50, 1.35, depth));
  float across = dot(wxz, vec2(-flow.y, flow.x));
  float along = dot(wxz, flow);
  float streak = fbm(vec2(across * 1.15, along * 0.22 - uTime * (0.55 + flowMag * 1.4)), 3, 2.15, 0.5);
  streak = smoothstep(0.28, 0.74, streak * 0.5 + 0.5);
  float foamNoise = fbm(wxz * 1.15 - flow * uTime * 0.8, 3, 2.1, 0.5) * 0.5 + 0.5;
  float foamNoise2 = fbm(wxz * 2.4 - flow * uTime * 1.3 + 9.0, 2, 2.1, 0.5) * 0.5 + 0.5;
  float rainFoam = uWeather.z * (0.14 + foamNoise2 * 0.28);
  float lace = smoothstep(0.42, 0.80, foamNoise * 0.40 + foamNoise2 * 0.60);
  float foam = shore * 0.70 + riffle * 0.48 * streak + rainFoam;
  foam *= mix(0.06, 1.0, lace);
  foam = clamp(foam * uFoam, 0.0, 1.0);
  // a cool body tint so deep water reads as lake, not stained tea
  col *= mix(vec3(1.0), vec3(0.80, 0.93, 1.08), body * 0.38);
  col += vec3(0.32, 0.58, 0.92) * causAmt * 0.42;
  vec3 foamCol = vec3(0.58, 0.57, 0.50) * (0.90 + luma(skyIrradiance(vec3(0.0, 1.0, 0.0))) * 0.32)
               + uSkyAmbient * 0.28 + uSunColor * sunShadowK * 0.10;
  col = mix(col, foamCol, foam * 0.44);
  float meniscus = exp(-depth * depth * 48.0) * (1.0 - smoothstep(0.10, 0.26, depth));
  col = mix(col, foamCol * 1.08, meniscus * 0.48);

  // ---- sediment plume near the banks
  float silt = shore * smoothstep(0.35, 0.85, foamNoise) * 0.5;
  col = mix(col, col * vec3(1.25, 1.05, 0.78), silt);
  // pollen film on still water. Metre-scale so it survives tiny; keep
  // it off the foam lip so the meniscus stays a dirt line.
  float film = fbm(wxz * 0.48 + 21.0, 3, 2.1, 0.5) * 0.5 + 0.5;
  film = smoothstep(0.56, 0.80, film) * still * smoothstep(0.14, 0.50, depth);
  film *= 1.0 - shore;
  col = mix(col, col * vec3(0.88, 0.94, 1.02) + vec3(0.012, 0.022, 0.030), film * 0.22);

  // rain impact rings as colour. Fine worley cells died as speckle at
  // tiny; metre-scale rings on tea still read after AgX.
  if(uWaterWave.w > 0.02){
    vec3 rw = worley2(wxz * 0.62 + floor(uTime * 1.05) * 6.3, 1.0);
    float rad = mix(0.16, 0.46, fract(rw.z * 4.1 + uTime * 0.28));
    float ring = 1.0 - smoothstep(0.030, 0.110, abs(rw.x - rad));
    ring *= exp(-rw.x * 1.35) * uWaterWave.w;
    col += vec3(0.78, 0.84, 0.76) * ring * 1.7;
    vec3 rw2 = worley2(wxz * 1.05 + floor(uTime * 1.35) * 8.2 + 17.0, 1.0);
    float rad2 = mix(0.12, 0.38, fract(rw2.z * 5.7 + uTime * 0.41));
    float ring2 = 1.0 - smoothstep(0.022, 0.080, abs(rw2.x - rad2));
    col += vec3(0.84, 0.88, 0.80) * ring2 * exp(-rw2.x * 1.8) * uWaterWave.w * 1.15;
  }
  col += vec3(0.04, 0.06, 0.09) * uWeather.z;
  float sunUp = clamp(uSunDir.y, 0.0, 1.0);
  col += uSkyAmbient * mix(0.12, 0.04, sunUp);
  col += vec3(0.008, 0.018, 0.034) * mix(0.22, 0.04, sunUp);

  // soften the very edge so the waterline is not a hard cut.
  // Mix toward a dim lake floor, not a crushed bed or a bright slab.
  float edgeFade = smoothstep(0.006, 0.05, depth);
  col = mix(max(bed, lake * 0.52), col, edgeFade);

  oColor = vec4(clamp(col, vec3(0.0), vec3(2.2)), 1.0);
}
`}_rebuildCells(){let e=this.maps,t=e.cpuRes,n=e.span,r=e.center.x,i=e.center.y,a=new Set,o=[];n/t;for(let s=0;s<t;s++)for(let c=0;c<t;c++){let l=(s*t+c)*4;if(e.cpuA[l+1]<=.02)continue;let u=r+(c/t-.5)*n,d=i+(s/t-.5)*n;for(let e=-1;e<=1;e++)for(let t=-1;t<=1;t++){let n=Math.floor(u/$)+t,r=Math.floor(d/$)+e,i=n*100003+r;a.has(i)||(a.add(i),o.push({x:n*$,z:r*$}))}}this.cells=o,this.generation=e.generation}onMapsRebaked(){this.generation=-1}update(n,r){this.generation!==this.maps.generation&&this._rebuildCells();let i=r.position,a=this.radius,o=0,s=this._frustum??=new t,c=this._mvp??=new e;c.multiplyMatrices(r.projectionMatrix,r.matrixWorldInverse),s.setFromProjectionMatrix(c);let l=this._box??=new N,u=this.cells.map(e=>{let t=e.x+$*.5-i.x,n=e.z+$*.5-i.z;return{c:e,d2:t*t+n*n}}).filter(e=>e.d2<=a*a).sort((e,t)=>e.d2-t.d2);for(let e of u){if(o>=this.maxCells)break;let t=e.c;if(l.min.set(t.x,-400,t.z),l.max.set(t.x+$,400,t.z+$),!s.intersectsBox(l))continue;let n=o*4;this.data[n]=t.x,this.data[n+1]=t.z,this.data[n+2]=1,this.data[n+3]=0,o++}this.geometry.instanceCount=o,this.buf.needsUpdate=!0,this.waterMesh.visible=o>0,this.stats.cells=o;let d=p.uWeather.value,f=this.look.waves;this.uniforms.uFoam.value=this.look.foam,this.uniforms.uWaterWave.value.set(1*f,(.34+d.y*.55+Math.min(p.uWind.value.z*.012,.35))*f,(.48+d.y*.8)*f,d.z),this._causticHeld||(p.uCausticHold.value.w=0)}beforeWater(e,t){this.uniforms.uSceneColor.value=e,this.uniforms.uSceneDepth.value=t}};function ct(){let e=new r;return e.setAttribute(`position`,new I(new Float32Array([-1,-1,0,1,-1,0,-1,1,0,-1,1,0,1,-1,0,1,1,0]),3)),e.boundingSphere=new u(new a,1e6),e}function lt(e){let t=new Float32Array(e);for(let n=0;n<e;n++)t[n]=n;return new f(t,1)}var ut=`
precision highp float;
precision highp int;
${M}
${_}
${w}

uniform mat4 uViewProj;
uniform vec3 uCamPos;
uniform vec3 uCamPrevPos;
uniform float uDelta;
uniform vec4 uWeather;
uniform float uTime;
uniform float uCount;
uniform vec3 uVolume;      // xz half-extent, y height
uniform float uProjScaleY;

in vec3 position;
in float iSeed;

out vec2 vUv;
out float vAlpha;
out float vKind;           // 0 streak, 1 close bead
out float vFlash;

void main(){
  uint id = uint(iSeed + 0.5);
  vec4 h = hashI4(id * 17u + 3u);
  vec3 h3 = hashI3(id * 31u + 9u);
  float hero = step(float(id), 72.0);

  float rain = uWeather.z;
  // thin the field at the start of a shower so it builds instead of popping on
  float alive = step(h.x, mix(0.18, 1.0, smoothstep(0.02, 0.92, rain)));
  if(alive < 0.5 || rain < 0.018){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0;
    vUv = vec2(0.0);
    vKind = 0.0;
    vFlash = 0.0;
    return;
  }

  vec2 wdir = normalize(uWind.xy + vec2(1e-5));
  float gust = windGust(uCamPos.xz);
  float wind = uWind.z * (0.55 + 0.45 * gust);

  float speed = mix(8.4, 17.5, h.y) * (1.0 + uWeather.y * 0.22);
  float drift = (0.055 + wind * 0.018) * speed;

  vec3 origin = uCamPos + vec3(0.0, 1.4, 0.0);
  vec3 vol = uVolume;
  if(hero > 0.5) vol *= 0.38;
  // wrap a box that follows the camera; wind slides the lattice so streaks
  // travel through the stand rather than hovering
  vec3 cell = h3;
  vec2 adv = wdir * drift * uTime;
  vec3 p;
  p.x = origin.x + (fract(cell.x + 0.5 + adv.x / max(vol.x * 2.0, 0.01)) - 0.5) * vol.x * 2.0;
  p.z = origin.z + (fract(cell.z + 0.5 + adv.y / max(vol.x * 2.0, 0.01)) - 0.5) * vol.x * 2.0;
  p.y = origin.y + vol.y * 0.62 - fract(cell.y + uTime * speed / max(vol.y, 0.01)) * vol.y;

  vec4 eco = ecoSample(p.xz);
  vec4 mapv = mapSample(p.xz);
  float ground = mapv.r;
  float water = max(mapv.g - mapv.r, 0.0);
  float canopy = clamp(eco.g, 0.0, 1.0);
  float canopyH = ground + mix(3.5, 15.0, canopy);

  // a fraction of drops terminate in the crown so the understorey is not
  // raining as hard as the open sky
  float crownHit = step(0.42, canopy) * step(h.z, canopy * 0.62);
  float floorY = crownHit > 0.5 ? canopyH : ground + water * 0.15;
  if(p.y < floorY + 0.05){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0;
    vUv = vec2(0.0);
    vKind = 0.0;
    vFlash = 0.0;
    return;
  }

  vec3 vel = vec3(wdir.x * drift, -speed, wdir.y * drift);
  vec3 camVel = (uCamPos - uCamPrevPos) / max(uDelta, 0.001);
  // clamp so a hitch does not stretch every drop across the frame
  float camSp = length(camVel);
  if(camSp > 28.0) camVel *= 28.0 / camSp;
  vec3 rel = vel - camVel * 0.72;
  float relSp = length(rel);
  vec3 along = relSp > 1e-4 ? rel / relSp : vec3(0.0, -1.0, 0.0);

  vec3 view = p - uCamPos;
  float dist = length(view);
  vec3 viewN = view / max(dist, 1e-4);

  vec3 side = cross(along, viewN);
  float sl = length(side);
  if(sl < 0.04) side = cross(along, vec3(0.0, 1.0, 0.0));
  side = normalize(side);

  // close drops stay bead-like; distant ones become streaks. A handful of
  // hero beads sit in a tighter volume so a still has readable 3D drops,
  // not only sub-pixel sparkle after AgX.
  float near = 1.0 - smoothstep(1.4, 8.5, dist);
  float streak = mix(0.12, 0.48, rain) * mix(0.65, 1.55, h.w)
               + relSp * 0.018
               + near * 0.06;
  streak *= mix(1.0, 1.7, hero);
  float thick = mix(0.012, 0.032, h.y) * mix(1.0, 2.2, near);
  thick *= mix(1.0, 2.4, hero);
  float minW = mix(3.2, 5.0, hero) / max(uProjScaleY / max(dist, 1.0), 1.0);
  thick = max(thick, minW);

  vec3 world = p + along * (position.y * streak * 0.5) + side * (position.x * thick);

  vec3 local = world - origin;
  vec3 edge = abs(local) / vec3(vol.x, vol.y * 0.55, vol.x);
  float fade = 1.0 - smoothstep(0.70, 0.98, max(edge.x, max(edge.y, edge.z)));
  float nearFade = smoothstep(0.28, 1.15, dist);
  float farFade = 1.0 - smoothstep(vol.x * 0.85, vol.x * 1.15, dist);
  vAlpha = fade * nearFade * farFade * mix(0.55, 1.0, rain) * mix(0.62, 1.0, 1.0 - canopy * 0.28);
  vUv = position.xy;
  vKind = near;
  vFlash = 0.0;

  gl_Position = uViewProj * vec4(world, 1.0);
}
`,dt=`
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uSceneDepth;
uniform vec2 uResolution;
uniform vec3 uSunColor;
uniform vec3 uSkyAmbient;
uniform vec4 uFlash;
uniform vec3 uFlashColor;
uniform vec4 uWeather;

in vec2 vUv;
in float vAlpha;
in float vKind;
in float vFlash;
layout(location = 0) out vec4 oColor;

void main(){
  if(vAlpha < 0.004) discard;

  vec2 uv = gl_FragCoord.xy / uResolution;
  float sceneZ = texture(uSceneDepth, uv).r;
  if(gl_FragCoord.z > sceneZ + 2.0e-4) discard;

  // capsule: fat head, thin tail. vUv.y = +1 is the leading tip
  float head = vUv.y * 0.5 + 0.5;
  float taper = mix(0.22, 1.0, pow(head, 1.35));
  vec2 q = vec2(vUv.x / max(taper, 0.08), vUv.y);
  float d = length(q);
  float body = 1.0 - smoothstep(0.22, 1.0, d);
  float tip = exp(-length(vec2(vUv.x * 1.8, (vUv.y - 0.62) * 2.6)) * 4.2);
  float bead = exp(-length(vUv) * 2.4);
  float mask = mix(body * 0.85 + tip * 1.4, bead, vKind * 0.72);
  mask = clamp(mask, 0.0, 1.0);
  if(mask < 0.02) discard;

  vec3 col = vec3(0.90, 0.94, 1.0) * (0.85 + vKind * 0.85);
  col += uSkyAmbient * 0.85;
  col += uSunColor * 0.22;
  col += uFlashColor * uFlash.w * 0.85;
  float a = mask * vAlpha * mix(0.90, 1.65, uWeather.z);
  oColor = vec4(col * a, a);
}
`,ft=`
precision highp float;
precision highp int;
${M}
${w}

uniform mat4 uViewProj;
uniform vec3 uCamPos;
uniform vec3 uCamFwd;
uniform vec4 uWeather;
uniform float uTime;
uniform float uHold;
uniform vec3 uVolume;

in vec3 position;
in float iSeed;

out vec2 vUv;
out float vAlpha;
out float vKind;     // 0 ground, 1 water ring, 2 canopy
out float vAge;

void main(){
  uint id = uint(iSeed + 0.5);
  vec4 h = hashI4(id * 23u + 5u);
  vec3 h3 = hashI3(id * 41u + 11u);

  float rain = max(uWeather.z, step(0.0, uHold) * 0.55);
  float alive = step(h.x, mix(0.12, 1.0, smoothstep(0.04, 0.95, rain)));
  if(uHold >= 0.0) alive = step(float(id), 3.5);
  if(alive < 0.5 || rain < 0.03){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vKind = 0.0; vAge = 0.0;
    return;
  }

  float rate = mix(2.4, 5.6, h.y) * mix(0.75, 1.35, rain);
  float age = uHold >= 0.0
    ? mix(0.16, 0.46, h.z)
    : fract(uTime * rate + h.z);
  // short life: expand and die
  if(age > 0.55){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vKind = 0.0; vAge = age;
    return;
  }

  vec3 origin = uCamPos;
  float span = uVolume.x * 1.15;
  vec2 xz;
  if(uHold >= 0.0){
    vec3 look = normalize(uCamFwd + vec3(1e-5, 0.0, 0.0));
    vec3 rt = cross(look, vec3(0.0, 1.0, 0.0));
    if(length(rt) < 0.08) rt = cross(look, vec3(1.0, 0.0, 0.0));
    rt = normalize(rt);
    xz = origin.xz + look.xz * mix(6.2, 12.0, h3.x) + rt.xz * (h3.z - 0.5) * 4.2;
  } else {
    xz = origin.xz + (h3.xz - 0.5) * span * 2.0;
  }
  vec4 mapv = mapSample(xz);
  float water = max(mapv.g - mapv.r, 0.0);
  if(uHold >= 0.0 && water < 0.06){
    vec3 look = normalize(uCamFwd + vec3(1e-5, 0.0, 0.0));
    xz += look.xz * 2.8;
    mapv = mapSample(xz);
    water = max(mapv.g - mapv.r, 0.0);
  }
  vec4 eco = ecoSample(xz);
  float ground = mapv.r;
  float canopy = clamp(eco.g, 0.0, 1.0);

  float kind = 0.0;
  float y = ground + 0.025;
  if(water > 0.05){
    kind = 1.0;
    y = mapv.g + 0.04;
  } else if(canopy > 0.45 && h.w > 0.55){
    kind = 2.0;
    y = ground + mix(5.0, 14.0, canopy) * (0.72 + h.y * 0.28);
  }

  if(uHold >= 0.0 && kind < 0.5){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vKind = 0.0; vAge = age;
    return;
  }

  // fewer ground hits under a closed canopy (those drops never arrived)
  if(kind < 0.5 && canopy > 0.55 && h.w < canopy * 0.7){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vKind = 0.0; vAge = age;
    return;
  }

  float grow = 1.0 - exp(-age * 7.0);
  float rad = mix(0.12, 0.50, h.y) * mix(0.85, 1.50, rain) * mix(0.45, 1.4, grow);
  if(kind > 1.5) rad *= 0.50;
  if(kind > 0.5 && kind < 1.5) rad *= uHold >= 0.0 ? 4.8 : 2.8;

  vec3 world = vec3(xz.x, y, xz.y);
  // mostly a horizontal disc; a little camera-facing lift so rings read at grazing angles
  vec3 view = normalize(uCamPos - world);
  vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), view));
  vec3 fw = normalize(cross(rt, vec3(0.0, 1.0, 0.0)));
  world += rt * position.x * rad + fw * position.y * rad;
  world.y += abs(position.y) * rad * 0.18;

  float dist = length(world - uCamPos);
  float fade = 1.0 - smoothstep(span * 0.55, span * 1.05, dist);
  vAlpha = fade * (uHold >= 0.0
    ? 0.62
    : (1.0 - age / 0.55) * (1.0 - age / 0.55) * mix(0.4, 1.0, rain));
  vUv = position.xy;
  vKind = kind;
  vAge = age;

  gl_Position = uViewProj * vec4(world, 1.0);
}
`,pt=`
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uSceneDepth;
uniform vec2 uResolution;
uniform vec3 uSkyAmbient;
uniform vec3 uSunColor;
uniform vec4 uFlash;
uniform vec3 uFlashColor;

in vec2 vUv;
in float vAlpha;
in float vKind;
in float vAge;
layout(location = 0) out vec4 oColor;

void main(){
  if(vAlpha < 0.008) discard;
  vec2 uv = gl_FragCoord.xy / uResolution;
  float sceneZ = texture(uSceneDepth, uv).r;
  if(gl_FragCoord.z > sceneZ + 3.0e-4) discard;

  float r = length(vUv);
  float mask = 0.0;
  if(vKind > 0.5 && vKind < 1.5){
    // water: expanding ring, fat enough to survive AgX and a tiny plate
    float ring = abs(r - mix(0.18, 0.82, vAge / 0.55));
    mask = 1.0 - smoothstep(0.045, 0.16, ring);
    mask *= 1.0 - smoothstep(0.95, 1.05, r);
    mask = max(mask, exp(-r * r * 9.0) * (1.0 - vAge / 0.55) * 0.28);
  } else {
    // ground / canopy: soft crown that thins as it grows
    float inner = smoothstep(0.0, 0.18, r);
    float outer = 1.0 - smoothstep(0.35, 1.0, r);
    mask = inner * outer;
    if(vKind > 1.5) mask *= 0.65;
  }
  if(mask < 0.02) discard;

  vec3 col = vec3(0.86, 0.90, 0.88) * mix(0.90, 1.12, step(0.5, vKind) * (1.0 - step(1.5, vKind)));
  col += uSkyAmbient * 0.28 + uSunColor * 0.05;
  col += uFlashColor * uFlash.w * 0.35;
  float a = mask * vAlpha * mix(1.05, 1.35, step(0.5, vKind) * (1.0 - step(1.5, vKind)));
  oColor = vec4(col * a, a);
}
`,mt=class{constructor(e,t){this.forest=e,this.quality=t,this.dropCount=t.rainParticles??24e3,this.splashCount=Math.max(800,Math.round(this.dropCount*.18)),this.holdSplash=-1,this._fwd=new a(0,0,-1),this.dropGeo=ct(),this.dropGeo.setAttribute(`iSeed`,lt(this.dropCount)),this.dropGeo.instanceCount=this.dropCount,this.splashGeo=ct(),this.splashGeo.setAttribute(`iSeed`,lt(this.splashCount)),this.splashGeo.instanceCount=this.splashCount;let n={...y.pick(`uTime`,`uDelta`,`uCamPos`,`uCamPrevPos`,`uWeather`,`uWind`,`uWindPhase`,`uSunDir`,`uSunColor`,`uMoonColor`,`uSkyAmbient`,`uFlash`,`uFlashColor`,`uViewProj`,`uInvViewProj`,`uResolution`,`uNearFar`,`uProjScaleY`),...e.maps.sharedUniforms,uSceneDepth:{value:null},uCount:{value:this.dropCount},uVolume:{value:new a(16,14,16)}};this.dropMat=new c({glslVersion:P,uniforms:{...n},vertexShader:ut,fragmentShader:dt,transparent:!0,depthTest:!1,depthWrite:!1,blending:5,blendEquation:100,blendSrc:201,blendDst:205,blendSrcAlpha:201,blendDstAlpha:205}),this.splashMat=new c({glslVersion:P,uniforms:{...n,uCount:{value:this.splashCount},uHold:{value:-1},uCamFwd:{value:this._fwd}},vertexShader:ft,fragmentShader:pt,transparent:!0,depthTest:!1,depthWrite:!1,blending:5,blendEquation:100,blendSrc:201,blendDst:205,blendSrcAlpha:201,blendDstAlpha:205}),this.dropMesh=new S(this.dropGeo,this.dropMat),this.dropMesh.frustumCulled=!1,this.dropMesh.matrixAutoUpdate=!1,this.dropMesh.visible=!1,this.splashMesh=new S(this.splashGeo,this.splashMat),this.splashMesh.frustumCulled=!1,this.splashMesh.matrixAutoUpdate=!1,this.splashMesh.visible=!1,this.forwardMeshes=[this.dropMesh,this.splashMesh],this.stats={drops:0,splashes:0}}update(e,t){t&&t.getWorldDirection(this._fwd);let n=p.uWeather.value.z,r=this.holdSplash>=0,i=n>.018||r;if(this.dropMesh.visible=i&&!r,this.splashMesh.visible=n>.03||r,this.splashMat.uniforms.uHold.value=this.holdSplash,this.splashMat.uniforms.uCamFwd.value.copy(this._fwd),!i){this.stats.drops=0,this.stats.splashes=0;return}let a=C.lerp(16,11,C.clamp(n,0,1)),o=C.lerp(11,15,C.clamp(n,0,1));this.dropMat.uniforms.uVolume.value.set(a,o,a),this.splashMat.uniforms.uVolume.value.set(a,o,a);let s=Math.max(1,Math.floor(this.dropCount*C.smoothstep(n,.02,.95))),c=Math.max(1,Math.floor(this.splashCount*C.smoothstep(n,.04,.95)));this.dropGeo.instanceCount=r?0:s,this.splashGeo.instanceCount=r?6:c,this.stats.drops=r?0:s,this.stats.splashes=r?4:c}beforeForward(e,t){this.dropMat.uniforms.uSceneDepth.value=t,this.splashMat.uniforms.uSceneDepth.value=t}},ht=720,gt=`
precision highp float;
precision highp int;

in vec3 position;
in vec2 uv;   // x side -1..1, y signed brightness

out float vSide;
out float vBright;
out float vGlow;

void main(){
  vSide = uv.x;
  vBright = max(abs(uv.y), 0.2);
  vGlow = 1.0 - step(0.0, uv.y);
  // position is NDC; z is forced to 0 so a 70 m strike is not far-clipped
  gl_Position = vec4(position, 1.0);
}
`,_t=`
precision highp float;
precision highp int;

uniform vec3 uFlashColor;
uniform float uAmp;

in float vSide;
in float vBright;
in float vGlow;
layout(location = 0) out vec4 oColor;

void main(){
  float ax = abs(vSide);
  float core = exp(-ax * ax * 5.2);
  float halo = exp(-ax * ax * 0.95);
  float mask = vGlow > 0.5 ? max(halo, 0.28) : max(core * 1.6 + halo * 0.4, 0.72);
  // same HDR league as the still that read (unconditional ~40). AgX + 0.05
  // bloom turns a 16-nit line into fog.
  vec3 hot = mix(vec3(38.0, 42.0, 54.0), vec3(12.0, 14.0, 20.0), vGlow);
  oColor = vec4(hot * mask * max(uAmp, 1.0), 1.0);
}
`;function vt(e,t){let n=Math.abs(e.y)<.92?new a(0,1,0):new a(1,0,0),r=new a().crossVectors(e,n).normalize(),i=new a().crossVectors(e,r).normalize(),o=t()*2-1,s=t()*2-1;return r.multiplyScalar(o).add(i.multiplyScalar(s*.7))}function yt(e){let t=e|0;return t=Math.imul(t^t>>>16,2146121005),t=Math.imul(t^t>>>15,2221713035),((t^t>>>16)>>>0)/4294967296}var bt=class{constructor(e,t){this.forest=e,this.seed=1,this.active=!1,this.sawFlash=!1,this.lightPos=new a,this.cloud=new a,this.ground=new a,this.stats={segs:0};let n=ht*12;this._pos=new Float32Array(n*3),this._meta=new Float32Array(n*2),this.bufPos=new I(this._pos,3),this.bufMeta=new I(this._meta,2),this.bufPos.setUsage(F),this.bufMeta.setUsage(F);let r=new h;r.setAttribute(`position`,this.bufPos),r.setAttribute(`uv`,this.bufMeta),r.setDrawRange(0,0),r.boundingSphere=new u(new a,1e6),this.geometry=r,this.uniforms={...y.pick(`uFlashColor`),uAmp:{value:0}},this._camera=null,this._ndc=new a,this._segs=[],this._dir=new a,this._view=new a,this._side=new a,this._p0=new a,this._p1=new a,this._p2=new a,this._p3=new a,this._up=new a(0,1,0),this.material=new c({glslVersion:P,uniforms:this.uniforms,vertexShader:gt,fragmentShader:_t,transparent:!1,depthTest:!1,depthWrite:!1,blending:0}),this.mesh=new S(this.geometry,this.material),this.mesh.frustumCulled=!1,this.mesh.matrixAutoUpdate=!1,this.mesh.visible=!1,this.mesh.renderOrder=20,this.forwardMeshes=[this.mesh],this._uvA=new a,this._uvB=new a,this.held=!1,this._boltLocked=!1}_rnd(){return this.seed=this.seed+1|0,yt(this.seed*747796405+2891336453)}_push(e,t,n,r,i){i.length>=ht||i.push({a:e,b:t,width:n,bright:r})}_grow(e,t,n,r,i,a,o,s){let c=[e.clone(),t.clone()],l=n;for(let e=0;e<r;e++){let t=[c[0]];for(let n=0;n<c.length-1;n++){let u=c[n],d=c[n+1],f=d.clone().sub(u),p=f.length();if(p<.4){t.push(d);continue}f.multiplyScalar(1/p);let m=u.clone().add(d).multiplyScalar(.5);if(m.addScaledVector(vt(f,()=>this._rnd()),l*(.35+this._rnd()*.85)),m.y-=l*.12,t.push(m,d),e<r-1&&this._rnd()<s&&o.length<680){let t=vt(f,()=>this._rnd()).normalize();t.y-=.55+this._rnd()*.6,t.normalize();let n=p*(.28+this._rnd()*.45),c=m.clone().addScaledVector(t,n);this._grow(m,c,l*.55,r-e-1,i*.45,a*.4,o,s*.45)}}c.length=0,c.push(...t),l*=.48}for(let e=0;e<c.length-1;e++)this._push(c[e],c[e+1],i,a,o)}onLightning(e,t,n,r=200,i=null){let o=this.forest.maps,s=this.forest.camPos??e;this.seed=e.x*913^e.z*457^(t*1e3|0)|0;let c=new a(e.x,e.y,e.z),l=[],u=!!(i&&Number.isFinite(i.x));if(!u&&!n&&this._rnd()<.38){let e=c.clone();e.x+=(this._rnd()-.5)*380,e.z+=(this._rnd()-.5)*380,e.y+=(this._rnd()-.5)*90,this._grow(c,e,55,5,1.6+t*1.2,.85,l,.55);for(let t=0;t<3;t++){let t=e.clone().lerp(c,this._rnd()),n=t.clone();n.y-=40+this._rnd()*80,this._grow(t,n,18,3,.55,.4,l,.2)}this.lightPos.copy(c).add(e).multiplyScalar(.5),this.cloud.copy(c),this.ground.copy(e)}else{let e,r,d;if(u)e=i.x,r=i.z,d=Number.isFinite(i.y)?i.y:o.height?.(e,r)??0;else{let t=n?28+this._rnd()*70:40+this._rnd()*160,i=this._rnd()*Math.PI*2;e=c.x+Math.cos(i)*t*.25,r=c.z+Math.sin(i)*t*.25,n&&(e=C.lerp(e,s.x,.35),r=C.lerp(r,s.z,.35),e+=(this._rnd()-.5)*36,r+=(this._rnd()-.5)*36),d=o.height?.(e,r)??0}let f=new a(e,d+(u?0:.4),r);this.cloud.copy(c),this.ground.copy(f);let p=n?6:5,m=n?1.7+t*1.15:2.2+t*1.4,h=u?10:n?22:48;if(this._grow(c,f,h,p,m,1,l,u?.28:n?.42:.32),n&&l.length>8){let e=f.clone();e.y+=8+this._rnd()*18;let t=e.clone();t.x+=(this._rnd()-.5)*22,t.z+=(this._rnd()-.5)*22,t.y+=6,this._grow(e,t,7,3,m*.35,.45,l,.15)}this.lightPos.lerpVectors(c,f,n?.58:.42)}this._segs=l,this.active=l.length>0,this.sawFlash=!1,this.mesh.visible=this.active,this.uniforms.uAmp.value=Math.max(p.uFlash.value.w,1.25),this._rebuild(this._camera)}_rebuild(e){let t=e&&e.isCamera?e:this._camera,n=t?t.position:this.forest.camPos??p.uCamPos.value,r=this._pos,i=this._meta,a=this._dir,o=this._view,s=this._side,c=this._p0,l=this._p1,u=this._p2,d=this._p3,f=0,m=(e,t,n)=>{let a=f*3,o=f*2;r[a]=e.x,r[a+1]=e.y,r[a+2]=e.z,i[o]=t,i[o+1]=n,f++},h=(e,t,i,p)=>{if(f+6>r.length/3)return;a.subVectors(t,e);let h=a.length();h<.001||(a.multiplyScalar(1/h),o.subVectors(e,n),s.crossVectors(a,o),s.lengthSq()<1e-6&&s.crossVectors(a,this._up),s.normalize(),c.copy(e).addScaledVector(s,-i),l.copy(e).addScaledVector(s,i),u.copy(t).addScaledVector(s,-i),d.copy(t).addScaledVector(s,i),m(c,-1,p),m(l,1,p),m(u,-1,p),m(u,-1,p),m(l,1,p),m(d,1,p))};for(let e of this._segs)h(e.a,e.b,Math.max(e.width*.4,1.4),e.bright),h(e.a,e.b,Math.max(e.width*2.8,4.2),-(e.bright*.48));if(t){let e=this._ndc;t.updateMatrixWorld(!0);for(let n=0;n<f;n++){let i=n*3;e.set(r[i],r[i+1],r[i+2]).project(t),r[i]=e.x,r[i+1]=e.y,r[i+2]=0}let n=.034;for(let a of this._segs){if(a.bright<.72||f+6>r.length/3)continue;let o=e.copy(a.a).project(t),s=o.x,c=o.y,l=e.copy(a.b).project(t),u=l.x,d=l.y;if(c<-1.15&&d<-1.15||c>1.15&&d>1.15)continue;let p=u-s,m=d-c,h=Math.hypot(p,m)||1,g=-m/h*n,_=p/h*n,v=[s-g,c-_,s+g,c+_,u-g,d-_,u-g,d-_,s+g,c+_,u+g,d+_];for(let e=0;e<6;e++){let t=f*3,n=f*2;r[t]=v[e*2],r[t+1]=v[e*2+1],r[t+2]=0,i[n]=e===0||e===2||e===3?-1:1,i[n+1]=1,f++}}}this.geometry.setDrawRange(0,f),this.bufPos.needsUpdate=!0,this.bufMeta.needsUpdate=!0,this.stats.segs=this._segs.length,this.stats.verts=f}update(e,t){if(t&&t.isCamera&&(this._camera=t),this.held&&this._boltLocked){this.mesh.visible=!0,this.active=!0,this.uniforms.uAmp.value=Math.max(p.uFlash.value.w,1.6),p.uFlash.value.w<.8&&(p.uFlash.value.w=1.6);return}if(!this.active){this.mesh.visible=!1,this.uniforms.uAmp.value=0,p.uBoltAmp.value.set(0,0,0,0);return}let n=p.uFlash.value.w>8e-4||this.held;this.mesh.visible=n||!this.sawFlash,this.uniforms.uAmp.value=n?Math.max(p.uFlash.value.w,this.held?1.6:.85):this.mesh.visible?1.2:0,n?(p.uFlash.value.x=this.lightPos.x,p.uFlash.value.y=this.lightPos.y,p.uFlash.value.z=this.lightPos.z,this.held&&p.uFlash.value.w<.8&&(p.uFlash.value.w=1.6),this.sawFlash=!0):this.sawFlash&&(this.active=!1,this.mesh.visible=!1,this.uniforms.uAmp.value=0),this.mesh.visible&&this._rebuild(this._camera),this._publishBolt(this._camera)}_publishBolt(e){if(!(this.active&&(this.mesh.visible||this.held||p.uFlash.value.w>.02))||!e||!e.isCamera){p.uBoltAmp.value.set(0,0,0,0);return}e.updateMatrixWorld(!0);let t=(t,n)=>(n.copy(t).project(e),n.x=n.x*.5+.5,n.y=n.y*.5+.5,n),n=t(this.cloud,this._uvA),r=t(this.ground,this._uvB);p.uBolt.value.set(n.x,n.y,r.x,r.y),p.uBoltAmp.value.set(Math.max(this.uniforms.uAmp.value,1.15),(this.seed&1023)*.17+1.3,1,0),this.held&&(this._boltLocked=!0);let i=!1,a=!1;p.uBoltF0.value.set(n.x,n.y,n.x,n.y),p.uBoltF1.value.set(n.x,n.y,n.x,n.y);for(let e of this._segs){if(e.bright<.28||e.bright>.72)continue;t(e.a,this._uvA),t(e.b,this._uvB);let n=this._uvB.x-this._uvA.x,r=this._uvB.y-this._uvA.y;if(!(n*n+r*r<4e-5)){if(!i)p.uBoltF0.value.set(this._uvA.x,this._uvA.y,this._uvB.x,this._uvB.y),i=!0;else if(!a){p.uBoltF1.value.set(this._uvA.x,this._uvA.y,this._uvB.x,this._uvB.y),a=!0;break}}}}};function xt(){let e=new r;return e.setAttribute(`position`,new I(new Float32Array([-1,-1,0,1,-1,0,-1,1,0,-1,1,0,1,-1,0,1,1,0]),3)),e.boundingSphere=new u(new a,1e6),e}function St(e){let t=new Float32Array(e);for(let n=0;n<e;n++)t[n]=n;return new f(t,1)}var Ct=`
precision highp float;
precision highp int;
${M}
${_}
${w}

uniform mat4 uViewProj;
uniform vec3 uCamPos;
uniform vec4 uWeather;
uniform float uTime;
uniform vec3 uVolume;
uniform vec4 uBurst;     // xyz world, w age 0..1
uniform float uProjScaleY;

in vec3 position;
in float iSeed;

out vec2 vUv;
out float vAlpha;
out float vKind;   // 0 leaf, 1 twig, 2 chunk
out float vAge;

void main(){
  uint id = uint(iSeed + 0.5);
  vec4 h = hashI4(id * 19u + 7u);
  vec3 h3 = hashI3(id * 29u + 4u);

  float storm = max(uWeather.y, smoothstep(7.0, 18.0, uWind.z));
  float rain = uWeather.z;
  float drive = clamp(storm * 0.75 + rain * 0.35 + uBurst.w * 0.8, 0.0, 1.4);
  float alive = step(h.x, mix(0.04, 1.0, smoothstep(0.08, 0.95, drive)));
  if(alive < 0.5 || drive < 0.06){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vKind = 0.0; vAge = 0.0;
    return;
  }

  float kind = h.y < 0.46 ? 0.0 : (h.y < 0.84 ? 1.0 : 2.0);
  vec2 wdir = normalize(uWind.xy + vec2(1e-5));
  float gust = windGust(uCamPos.xz);
  float wind = uWind.z * (0.5 + 0.5 * gust);

  float fall = mix(2.4, 9.5, h.z) * (kind > 0.5 ? 1.15 : 0.65);
  float drift = (0.12 + wind * 0.035) * mix(1.4, 0.7, kind);

  vec3 origin = uCamPos + vec3(0.0, 3.0, 0.0);
  vec3 vol = uVolume;
  vec2 adv = wdir * drift * uTime;
  vec3 p;
  p.x = origin.x + (fract(h3.x + 0.5 + adv.x / max(vol.x * 2.0, 0.01)) - 0.5) * vol.x * 2.0;
  p.z = origin.z + (fract(h3.z + 0.5 + adv.y / max(vol.x * 2.0, 0.01)) - 0.5) * vol.x * 2.0;
  p.y = origin.y + vol.y * 0.55 - fract(h3.y + uTime * fall / max(vol.y, 0.01)) * vol.y;

  // a burst after a strike: pull a subset toward the flash
  if(uBurst.w > 0.01 && h.w > 0.55){
    p = mix(p, uBurst.xyz + (h3 - 0.5) * 14.0, uBurst.w * 0.55);
  }

  vec4 mapv = mapSample(p.xz);
  float ground = mapv.r;
  if(p.y < ground + 0.04){
    // settle briefly as ground litter, then wrap
    float rest = fract(h3.y + uTime * fall / max(vol.y, 0.01));
    if(rest > 0.82){
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      vAlpha = 0.0; vUv = vec2(0.0); vKind = kind; vAge = rest;
      return;
    }
    p.y = ground + 0.03;
  }

  vec3 view = p - uCamPos;
  float dist = length(view);
  vec3 viewN = view / max(dist, 1e-4);
  vec3 up = vec3(0.0, 1.0, 0.0);
  vec3 side = normalize(cross(up, viewN));
  vec3 fwd = normalize(cross(viewN, side));

  float spin = uTime * mix(3.2, 9.0, h.w) + h.z * 12.0;
  float cs = cos(spin), sn = sin(spin);
  vec3 r1 = side * cs + fwd * sn;
  vec3 r2 = -side * sn + fwd * cs;
  if(kind > 0.5){
    // twigs: long and tumbling
    r2 = normalize(r2 + vec3(wdir.x, -0.4, wdir.y) * 0.6);
  }

  float len = kind < 0.5 ? mix(0.08, 0.20, h.z)
            : kind < 1.5 ? mix(0.28, 0.85, h.z)
            : mix(0.12, 0.32, h.z);
  float wid = kind < 0.5 ? len * 0.58 : (kind < 1.5 ? len * 0.14 : len * 0.38);
  float minW = 1.6 / max(uProjScaleY / max(dist, 1.0), 1.0);
  wid = max(wid, minW);

  vec3 world = p + r1 * (position.x * wid) + r2 * (position.y * len);
  vec3 local = world - origin;
  float fade = 1.0 - smoothstep(vol.x * 0.72, vol.x * 1.08, length(local.xz));
  fade *= smoothstep(0.4, 1.4, dist);
  vAlpha = fade * mix(0.55, 1.0, drive);
  vUv = position.xy;
  vKind = kind;
  vAge = fract(h3.y + uTime * 0.15);

  gl_Position = uViewProj * vec4(world, 1.0);
}
`,wt=`
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uSceneDepth;
uniform vec2 uResolution;
uniform vec3 uSunColor;
uniform vec3 uSkyAmbient;
uniform vec4 uFlash;
uniform vec3 uFlashColor;
uniform float uTime;

in vec2 vUv;
in float vAlpha;
in float vKind;
in float vAge;
layout(location = 0) out vec4 oColor;

void main(){
  if(vAlpha < 0.02) discard;
  vec2 uv = gl_FragCoord.xy / uResolution;
  float sceneZ = texture(uSceneDepth, uv).r;
  if(gl_FragCoord.z > sceneZ + 3.0e-4) discard;

  float mask = 0.0;
  if(vKind < 0.5){
    vec2 q = vUv;
    q.y *= 1.35;
    float leaf = 1.0 - smoothstep(0.35, 1.0, length(q));
    float notch = smoothstep(0.0, 0.2, abs(q.x) + q.y * 0.3);
    mask = leaf * notch;
  } else if(vKind < 1.5){
    mask = 1.0 - smoothstep(0.22, 0.95, abs(vUv.x));
    mask *= 1.0 - smoothstep(0.92, 1.0, abs(vUv.y));
  } else {
    mask = 1.0 - smoothstep(0.55, 1.0, length(vUv));
  }
  if(mask < 0.04) discard;

  vec3 col;
  if(vKind < 0.5){
    col = mix(vec3(0.18, 0.28, 0.08), vec3(0.36, 0.22, 0.06), fract(vAge * 3.1));
  } else if(vKind < 1.5){
    col = mix(vec3(0.16, 0.10, 0.06), vec3(0.28, 0.18, 0.09), fract(vAge * 5.0));
  } else {
    col = vec3(0.14, 0.11, 0.08);
  }
  col *= 0.45 + uSkyAmbient * 0.8 + uSunColor * 0.12;
  col += uFlashColor * uFlash.w * 0.35;
  float a = mask * vAlpha * 0.9;
  oColor = vec4(col * a, a);
}
`,Tt=class{constructor(e,t){this.forest=e,this.count=Math.max(1400,Math.round((t.rainParticles??24e3)*.18)),this.burst={pos:new a,t:-10},this.geo=xt(),this.geo.setAttribute(`iSeed`,St(this.count)),this.geo.instanceCount=this.count,this.uniforms={...y.pick(`uTime`,`uCamPos`,`uWeather`,`uWind`,`uWindPhase`,`uSunColor`,`uSkyAmbient`,`uFlash`,`uFlashColor`,`uViewProj`,`uResolution`,`uProjScaleY`),...e.maps.sharedUniforms,uSceneDepth:{value:null},uVolume:{value:new a(26,16,26)},uBurst:{value:new o(0,0,0,0)}},this.material=new c({glslVersion:P,uniforms:this.uniforms,vertexShader:Ct,fragmentShader:wt,transparent:!0,depthTest:!1,depthWrite:!1,blending:5,blendEquation:100,blendSrc:201,blendDst:205}),this.mesh=new S(this.geo,this.material),this.mesh.frustumCulled=!1,this.mesh.matrixAutoUpdate=!1,this.mesh.visible=!1,this.forwardMeshes=[this.mesh],this.stats={debris:0},this.suppressed=!1}onLightning(e){e&&(this.burst.pos.copy(e),this.burst.pos.y=(this.forest.maps.height?.(e.x,e.z)??e.y)+8,this.burst.t=0)}update(e){let t=p.uWeather.value.y,n=p.uWind.value.z,r=Math.max(t,C.smoothstep(n,7,18));this.mesh.visible=!this.suppressed&&r>.06,this.burst.t>=0&&(this.burst.t+=e,this.burst.t>1.6&&(this.burst.t=-10));let i=this.burst.t>=0?Math.exp(-this.burst.t*2.4):0;this.uniforms.uBurst.value.set(this.burst.pos.x,this.burst.pos.y,this.burst.pos.z,i);let a=Math.max(1,Math.floor(this.count*C.smoothstep(r,.06,.95)));this.geo.instanceCount=a,this.stats.debris=this.mesh.visible?a:0}beforeForward(e,t){this.uniforms.uSceneDepth.value=t}};function Et(e,t){let n=new Float32Array(e);for(let r=0;r<e;r++)n[r]=t+r;return new f(n,1)}function Dt(e){e.computeBoundingBox();let t=new a;e.boundingBox.getCenter(t),e.translate(-t.x,-t.y,-t.z),e.computeBoundingSphere()}var Ot=`
precision highp float;
precision highp int;
uniform float uTime;
uniform float uDelta;
uniform vec3 uCamPos;
uniform vec4 uWeather;
uniform float uDrive;
uniform float uPhase;
uniform vec3 uVolume;
uniform vec4 uBurst;
uniform vec3 uCamFwd;
${M}
${_}
${w}
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 uViewProj;
uniform mat4 uPrevViewProj;
in vec3 position;
in vec3 normal;
in vec2 uv;
in vec4 aExtra;
in float iSeed;

vec3 rotateAxis(vec3 p, vec3 axis, float ang){
  float s = sin(ang), c = cos(ang);
  return p * c + cross(axis, p) * s + axis * dot(axis, p) * (1.0 - c);
}

struct Fall {
  vec3 p;
  mat3 R;
  float sc;
  float tint;
  float alive;
};

Fall place(float tShift){
  Fall o;
  o.alive = 0.0;
  o.sc = 1.0;
  o.tint = 0.0;
  o.p = vec3(0.0);
  o.R = mat3(1.0);

  uint id = uint(iSeed + 0.5);
  vec4 h = hashI4(id * 17u + 3u);
  vec3 h3 = hashI3(id * 31u + 9u);

  float drive = max(uDrive, uBurst.w * 1.4);
  float alive = step(h.x, mix(0.10, 1.0, smoothstep(0.10, 0.88, drive)));
  // a held still wants exactly one instance — two copies of the same
  // fork stacked into a cone pile
  if(uPhase >= 0.0) alive = step(abs(iSeed - 11.0), 0.5);
  if(alive < 0.5 || drive < 0.07){
    return o;
  }

  vec2 wdir = normalize(uWind.xy + vec2(1e-5));
  float gust = windGust(uCamPos.xz);
  float wind = uWind.z * (0.45 + 0.55 * gust);

  float period = mix(3.2, 6.4, h.z);
  float t = uPhase >= 0.0
    ? fract(uPhase + h.w * 0.28)
    : fract((uTime + tShift) / period + h.w);

  if(uBurst.w > 0.02 && h.y > 0.42){
    t = mix(t, mix(0.16, 0.48, h.z), clamp(uBurst.w * 1.6, 0.0, 0.85));
  }

  vec3 origin = uCamPos;
  vec3 vol = uVolume;
  vec2 adv = wdir * (0.08 + wind * 0.018) * (uPhase >= 0.0 ? 0.0 : uTime);
  vec3 base;
  if(uPhase >= 0.0){
    // stills: sit on the look ray. A zenith glance makes world-up useless
    // as a right vector — that used to drop a limb on the lens.
    vec3 look = normalize(uCamFwd + vec3(1e-5, 0.0, 0.0));
    vec3 rt = cross(look, vec3(0.0, 1.0, 0.0));
    if(length(rt) < 0.08) rt = cross(look, vec3(1.0, 0.0, 0.0));
    rt = normalize(rt);
    vec3 lift = normalize(cross(rt, look));
    base = origin
      + look * mix(7.4, 9.6, h3.x)
      + rt * (h3.z - 0.5) * 0.9
      + lift * (h3.y - 0.5) * 0.7;
  } else {
    base.x = origin.x + (fract(h3.x + 0.5 + adv.x / max(vol.x * 2.0, 0.01)) - 0.5) * vol.x * 2.0;
    base.z = origin.z + (fract(h3.z + 0.5 + adv.y / max(vol.x * 2.0, 0.01)) - 0.5) * vol.x * 2.0;
    base.y = origin.y;
  }

  if(uBurst.w > 0.02 && h.w > 0.58){
    base.xz = mix(base.xz, uBurst.xz + (h3.xz - 0.5) * 10.0, uBurst.w * 0.65);
  }

  float ground = groundHeight(base.xz);
  float canopy = ground + mix(7.5, 16.5, h3.y);

  float hang = smoothstep(0.00, 0.10, t);
  float drop = clamp((t - 0.10) / 0.62, 0.0, 1.0);
  drop = drop * drop;
  float settle = smoothstep(0.74, 0.88, t);
  float bounce = 0.0;
  if(t > 0.72 && t < 0.86){
    float bt = (t - 0.72) / 0.14;
    bounce = sin(bt * 3.14159) * 0.55 * (1.0 - bt);
  }

  float y = mix(canopy, ground + 0.10, drop);
  y += bounce;
  y = mix(y, ground + 0.08, settle);
  y = mix(canopy, y, hang);

  if(uPhase >= 0.0){
    settle = 0.0;
  } else {
    base.xz += wdir * drop * mix(1.6, 7.5, h.z) * (0.55 + wind * 0.06);
    base.y = y;
  }

  float sc = uPhase >= 0.0 ? mix(1.75, 2.25, h.z) : mix(1.15, 2.05, h.z);
  vec3 ax1 = normalize(h3 - 0.5 + vec3(0.0, 0.2, 0.0));
  vec3 ax2 = cross(ax1, vec3(wdir.x, 0.15, wdir.y));
  if(length(ax2) < 1e-4) ax2 = cross(ax1, vec3(0.0, 1.0, 0.0));
  ax2 = normalize(ax2);
  float spin = mix(5.2, 11.0, h.y);
  float ang = drop * spin * (1.0 - settle * 0.92);
  vec3 q = rotateAxis(vec3(1.0, 0.0, 0.0), ax1, ang);
  q = rotateAxis(q, ax2, ang * 0.62 + h.w * 2.0);
  vec3 longA = normalize(mix(q, vec3(ax2.x, 0.0, ax2.z + 1e-4), settle));
  vec3 up = mix(normalize(cross(longA, ax1)), vec3(0.0, 1.0, 0.0), settle);
  if(length(up) < 1e-4) up = vec3(0.0, 1.0, 0.0);
  up = normalize(up);
  if(uPhase >= 0.0){
    // side-on to the lens so we see the fork, not the bore
    vec3 view = normalize(origin - base);
    vec3 across = cross(vec3(0.0, 1.0, 0.0), view);
    if(length(across) < 1e-4) across = vec3(1.0, 0.0, 0.0);
    across = normalize(across);
    vec3 lift = normalize(cross(across, view));
    float tip = (h3.y - 0.5) * 0.55;
    longA = normalize(across * cos(tip) + lift * sin(tip));
    longA = rotateAxis(longA, view, (h.w - 0.5) * 0.85);
    up = lift;
  }
  vec3 side = normalize(cross(up, longA));
  up = normalize(cross(longA, side));
  o.p = base;
  o.R = mat3(side, up, longA);
  o.sc = sc;
  o.tint = h.y;
  o.alive = 1.0;
  return o;
}

`,kt=`
${Ot}
out vec3 vWorld;
out vec3 vNormal;
out vec2 vUv;
out vec4 vExtra;
out vec4 vCur;
out vec4 vPrev;
out float vTint;
void main(){
  Fall cur = place(0.0);
  Fall prv = place(-uDelta);
  if(cur.alive < 0.5){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vWorld = vec3(0.0); vNormal = vec3(0.0, 1.0, 0.0); vUv = uv;
    vExtra = aExtra; vCur = vec4(2.0); vPrev = vec4(2.0); vTint = 0.0;
    return;
  }
  vec3 local = position * cur.sc;
  vec3 world = cur.p + cur.R * local;
  vec3 prevW = prv.alive > 0.5 ? prv.p + prv.R * (position * prv.sc) : world;
  vWorld = world;
  vNormal = normalize(cur.R * normal);
  vUv = uv;
  vExtra = aExtra;
  vTint = cur.tint;
  vCur = uViewProj * vec4(world, 1.0);
  vPrev = uPrevViewProj * vec4(prevW, 1.0);
  gl_Position = vCur;
}
`,At=`
${Ot}
void main(){
  Fall cur = place(0.0);
  if(cur.alive < 0.5){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }
  vec3 world = cur.p + cur.R * (position * cur.sc);
  gl_Position = projectionMatrix * (viewMatrix * vec4(world, 1.0));
}
`,jt=`
precision highp float;
precision highp int;
uniform vec4 uWeather;
${M}
${w}
${g}
in vec3 vWorld;
in vec3 vNormal;
in vec2 vUv;
in vec4 vExtra;
in vec4 vCur;
in vec4 vPrev;
in float vTint;
void main(){
  vec3 N = normalize(vNormal);
  if(!gl_FrontFacing) N = -N;
  vec3 T = normalize(cross(N, vec3(0.0, 1.0, 0.0)) + vec3(1e-4, 0.0, 0.0));
  vec3 B = cross(N, T);
  float idv = fract(vTint * 5.71 + vExtra.w * 2.3);
  float wet = clamp(mapWetness(vWorld.xz) * 0.45 + uWeather.w * 0.70, 0.0, 1.0);
  // along-grain fissures: uv.x around, uv.y along. stretched like real bark
  vec2 bp = vec2(vUv.x * 3.4, vUv.y * 0.78) + idv * 5.0;
  float r1 = ridged(vec2(bp.x, bp.y * 0.18), 4, 2.13, 0.52);
  float r2 = ridged(vec2(bp.x * 2.6, bp.y * 0.40) + 7.0, 3, 2.2, 0.5);
  float ridge = r1 * 0.68 + r2 * 0.32;
  float fissure = smoothstep(0.28, 0.86, ridge);
  float grain = fbm(vec3(vWorld.x * 2.4, vWorld.y * 28.0, vWorld.z * 2.4) + idv * 13.0, 3, 2.1, 0.5) * 0.5 + 0.5;
  vec3 woodA = vec3(0.145, 0.098, 0.058);
  vec3 woodB = vec3(0.270, 0.195, 0.118);
  vec3 alb = mix(woodA, woodB, grain * 0.55 + fissure * 0.45);
  alb *= mix(0.48, 1.08, smoothstep(0.0, 0.62, ridge));
  float rot = smoothstep(0.55, 0.94, fbm(vWorld * 1.5 + 61.0, 3, 2.1, 0.5) * 0.5 + 0.5);
  alb = mix(alb, mix(vec3(0.070, 0.066, 0.056), vec3(0.125, 0.116, 0.098), grain), rot * 0.28);
  vec3 w = worley2(vec2(bp.x * 0.85, bp.y * 0.28) + 3.7, 1.0);
  float plate = smoothstep(0.06, 0.44, w.x);
  alb *= mix(0.78, 1.04, plate);
  float hx = ridged(vec2(bp.x + 0.02, bp.y * 0.18), 3, 2.13, 0.52);
  float hy = ridged(vec2(bp.x, (bp.y + 0.02) * 0.18), 3, 2.13, 0.52);
  N = normalize(N - (T * (hx - r1) + B * (hy - r1)) * 2.4);
  float endGrain = step(1.5, vExtra.z);
  if(endGrain > 0.5){
    float rr = length(vUv - 0.5);
    float rings = 0.5 + 0.5 * sin(rr * 42.0 + idv * 9.0);
    vec3 heart = mix(vec3(0.145, 0.100, 0.058), vec3(0.210, 0.155, 0.090), rings);
    alb = mix(heart * (0.75 + 0.35 * grain), alb, 0.18);
  }
  float rough = mix(0.90, 0.98, grain);
  rough = mix(rough, 0.78, endGrain);
  // wet bark darkens a little; keep it matte so it does not read as metal
  alb *= mix(1.0, 0.90, wet * (1.0 - endGrain));
  rough = clamp(rough - wet * 0.04, 0.84, 1.0);
  float occ = mix(0.52, 1.0, fissure);
  occ = mix(occ, 0.78, endGrain);
  writeGBuffer(clamp(alb, vec3(0.018), vec3(0.55)), occ, N, rough, 0.0, vCur, vPrev, ${2 .toFixed(1)}, 0.0);
}
`;function Mt(e){return{...y.pick(`uTime`,`uDelta`,`uCamPos`,`uWind`,`uWindPhase`,`uWeather`,`uJitter`,`uViewProj`,`uPrevViewProj`),...e.maps.sharedUniforms,uDrive:{value:0},uPhase:{value:-1},uVolume:{value:new a(20,18,20)},uBurst:{value:new o},uCamFwd:{value:new a(0,0,-1)}}}var Nt=class{constructor(e,t){this.forest=e,this.holdPhase=-1,this.suppressed=!1,this.burst={pos:new a,t:-10},this._fwd=new a(0,0,-1);let n=Math.max(36,Math.round((t.rainParticles??24e3)*.01)),i=Math.ceil(n/3);this.meshes=[],this.shadowMeshes=[],this._layers=[];for(let t=0;t<3;t++){let n=Ue(Pt(t),{scale:1.85}).mesh.toGeometry();if(!n)continue;Dt(n);let o=new r;o.index=n.index;for(let e of[`position`,`normal`,`uv`,`aExtra`])o.setAttribute(e,n.getAttribute(e));o.setAttribute(`iSeed`,Et(i,t*409+11)),o.instanceCount=i,o.boundingSphere=new u(new a,1e6);let s=Mt(e),l=new c({glslVersion:P,uniforms:s,vertexShader:kt,fragmentShader:jt,side:0}),d=new c({glslVersion:P,uniforms:s,vertexShader:At,fragmentShader:`precision highp float; layout(location = 0) out vec4 oCol; void main(){ oCol = vec4(1.0); }`,side:0}),f=new S(o,l);f.frustumCulled=!1,f.matrixAutoUpdate=!1;let p=new S(o,d);p.frustumCulled=!1,p.matrixAutoUpdate=!1,p.userData.cascades=[0,1],this.meshes.push(f),this.shadowMeshes.push(p),this._layers.push({geo:o,uniforms:s,mesh:f,shadowMesh:p,count:i})}this.stats={falling:0,air:0}}onLightning(e){e&&(this.burst.pos.copy(e),this.burst.pos.y=(this.forest.maps.height?.(e.x,e.z)??e.y)+10,this.burst.t=0)}update(e,t){t&&t.getWorldDirection(this._fwd);let n=p.uWeather.value.y,r=p.uWind.value.z,i=Math.max(n,C.smoothstep(r,8,17)),a=this.holdPhase>=0,o=!this.suppressed&&(i>.08||a);this.burst.t>=0&&(this.burst.t+=e,this.burst.t>1.8&&(this.burst.t=-10));let s=this.burst.t>=0?Math.exp(-this.burst.t*1.8):0,c=a?Math.max(i,.92):i,l=0;for(let e=0;e<this._layers.length;e++){let t=this._layers[e],n=o&&(!a||e===0);t.mesh.visible=n,t.shadowMesh.visible=n,t.uniforms.uDrive.value=c,t.uniforms.uPhase.value=this.holdPhase,t.uniforms.uBurst.value.set(this.burst.pos.x,this.burst.pos.y,this.burst.pos.z,s),t.uniforms.uCamFwd.value.copy(this._fwd),l+=n?t.count:0}this.stats.falling=a&&o?1:l,this.stats.air=o?a?1:Math.round(l*C.smoothstep(i,.1,.9)):0}beforeShadow(e,t){for(let e of this._layers)e.shadowMesh.visible=e.mesh.visible&&e.shadowMesh.userData.cascades.includes(t)}};function Pt(e){let t=(e+1)*1103515245+12345;return t=(t^t>>>16)>>>0,t}function Ft(){let e=new r;return e.setAttribute(`position`,new I(new Float32Array([-1,-1,0,1,-1,0,-1,1,0,-1,1,0,1,-1,0,1,1,0]),3)),e.boundingSphere=new u(new a,1e6),e}function It(e){let t=new Float32Array(e);for(let n=0;n<e;n++)t[n]=n;return new f(t,1)}var Lt=[`uTime`,`uCamPos`,`uWeather`,`uWind`,`uWindPhase`,`uSunColor`,`uSkyAmbient`,`uFlash`,`uFlashColor`,`uViewProj`,`uResolution`,`uProjScaleY`,`uNightAmount`,`uSeason`];function Rt(e,t,n,r){return new c({glslVersion:P,uniforms:n,vertexShader:e,fragmentShader:t,transparent:!0,depthTest:!1,depthWrite:!1,blending:5,blendEquation:100,blendSrc:201,blendDst:r?201:205})}var zt=`
precision highp float;
precision highp int;
${M}
${_}
${w}

uniform mat4 uViewProj;
uniform vec3 uCamPos;
uniform vec4 uWeather;
uniform float uTime;
uniform float uNightAmount;
uniform vec3 uVolume;
uniform float uProjScaleY;

in vec3 position;
in float iSeed;

out vec2 vUv;
out float vAlpha;
out float vSeed;

void main(){
  uint id = uint(iSeed + 0.5);
  vec4 h = hashI4(id * 13u + 5u);
  vec3 h3 = hashI3(id * 27u + 2u);

  float rain = uWeather.z;
  float storm = uWeather.y;
  float dusk = smoothstep(0.06, 0.32, uNightAmount) * (1.0 - smoothstep(0.72, 0.96, uNightAmount));
  float drive = (0.22 + dusk * 1.35 + (1.0 - uNightAmount) * 0.18)
    * (1.0 - smoothstep(0.16, 0.52, rain))
    * (1.0 - smoothstep(0.50, 0.88, storm));
  float alive = step(h.x, mix(0.08, 1.0, smoothstep(0.06, 0.85, drive)));
  if(alive < 0.5 || drive < 0.05){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vSeed = 0.0;
    return;
  }

  vec3 origin = uCamPos;
  vec3 vol = uVolume;
  vec2 drift = vec2(sin(uTime * 0.07 + h.z * 6.0), cos(uTime * 0.055 + h.w * 5.0)) * 0.12;
  vec3 p;
  p.x = origin.x + (fract(h3.x + 0.5 + drift.x) - 0.5) * vol.x * 2.0;
  p.z = origin.z + (fract(h3.z + 0.5 + drift.y) - 0.5) * vol.z * 2.0;

  vec4 eco = ecoSample(p.xz);
  vec4 mapv = mapSample(p.xz);
  float ground = mapv.r;
  float wet = eco.r;
  float canopy = eco.g;
  float rock = eco.b;
  float water = max(mapv.g - mapv.r, 0.0);
  float fit = clamp(wet * 0.55 + canopy * 0.25 + (1.0 - rock) * 0.25, 0.0, 1.0);
  if(water > 0.08) fit *= 1.35;
  if(h.y > fit * 0.92 + 0.08){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vSeed = 0.0;
    return;
  }

  float hover = mix(0.28, 3.4, h.y);
  vec3 mill;
  mill.x = sin(uTime * mix(1.7, 4.4, h.y) + h.z * 9.0);
  mill.y = sin(uTime * mix(2.2, 5.6, h.z) + h.w * 11.0) * 0.42;
  mill.z = cos(uTime * mix(1.7, 4.4, h.y) + h.z * 9.0);
  mill *= mix(0.22, 0.85, h.w);
  p.y = ground + hover + mill.y;
  p.xz += mill.xz;

  vec3 view = p - uCamPos;
  float dist = length(view);
  vec3 viewN = view / max(dist, 1e-4);
  vec3 up = vec3(0.0, 1.0, 0.0);
  vec3 side = normalize(cross(up, viewN));
  vec3 fwd = normalize(cross(viewN, side));

  float len = mix(0.012, 0.028, h.z);
  float wid = len * 0.7;
  float minW = 1.15 / max(uProjScaleY / max(dist, 1.0), 1.0);
  wid = max(wid, minW);
  len = max(len, minW);

  vec3 world = p + side * (position.x * wid) + fwd * (position.y * len);
  float fade = 1.0 - smoothstep(vol.x * 0.78, vol.x * 1.08, length((p - origin).xz));
  fade *= smoothstep(0.35, 1.2, dist);
  vAlpha = fade * mix(0.35, 0.95, drive) * (0.55 + fit * 0.45);
  vUv = position.xy;
  vSeed = h.w;
  gl_Position = uViewProj * vec4(world, 1.0);
}
`,Bt=`
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uSceneDepth;
uniform vec2 uResolution;
uniform vec3 uSunColor;
uniform vec3 uSkyAmbient;

in vec2 vUv;
in float vAlpha;
in float vSeed;
layout(location = 0) out vec4 oColor;

void main(){
  if(vAlpha < 0.02) discard;
  vec2 uv = gl_FragCoord.xy / uResolution;
  float sceneZ = texture(uSceneDepth, uv).r;
  if(gl_FragCoord.z > sceneZ + 3.0e-4) discard;
  float mask = 1.0 - smoothstep(0.45, 1.0, length(vUv));
  if(mask < 0.04) discard;
  vec3 col = vec3(0.05, 0.055, 0.03) * (0.7 + uSkyAmbient * 1.1);
  col += uSunColor * 0.10;
  col *= 0.85 + 0.3 * fract(vSeed * 17.0);
  float a = mask * vAlpha;
  oColor = vec4(col * a, a);
}
`,Vt=`
precision highp float;
precision highp int;
${M}
${_}
${w}

uniform mat4 uViewProj;
uniform vec3 uCamPos;
uniform vec4 uWeather;
uniform float uTime;
uniform float uNightAmount;
uniform vec3 uVolume;
uniform vec3 uCamFwd;
uniform float uProjScaleY;
uniform float uHoldPulse;

in vec3 position;
in float iSeed;

out vec2 vUv;
out float vAlpha;
out float vPulse;

void main(){
  uint id = uint(iSeed + 0.5);
  vec4 h = hashI4(id * 21u + 8u);
  vec3 h3 = hashI3(id * 33u + 4u);

  float night = uNightAmount;
  float rain = uWeather.z;
  float drive = smoothstep(0.16, 0.52, night) * (1.0 - smoothstep(0.28, 0.72, rain));
  float alive = step(h.x, mix(0.06, 1.0, smoothstep(0.08, 0.9, drive)));
  if(alive < 0.5 || drive < 0.05){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vPulse = 0.0;
    return;
  }

  vec3 origin = uCamPos + uCamFwd * 5.0;
  vec3 vol = uVolume;
  vec2 wander = vec2(sin(uTime * 0.11 + h.z * 5.0), cos(uTime * 0.09 + h.w * 4.2)) * 0.08;
  vec3 p;
  p.x = origin.x + (fract(h3.x + 0.5 + wander.x) - 0.5) * vol.x * 2.0;
  p.z = origin.z + (fract(h3.z + 0.5 + wander.y) - 0.5) * vol.z * 2.0;

  vec4 eco = ecoSample(p.xz);
  vec4 mapv = mapSample(p.xz);
  float ground = mapv.r;
  float wet = eco.r;
  float canopy = eco.g;
  float rock = eco.b;
  float fit = clamp(wet * 0.5 + canopy * 0.4 + (1.0 - rock) * 0.25, 0.0, 1.0);
  if(h.y > fit * 0.98 + 0.35){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vPulse = 0.0;
    return;
  }

  float hover = mix(0.35, 2.4, h.y);
  p.y = ground + hover
    + sin(uTime * mix(0.4, 1.1, h.w) + h.z * 8.0) * 0.18;

  float pulse = uHoldPulse >= 0.0
    ? mix(0.08, 1.0, step(0.38, fract(h.w * 7.3 + uHoldPulse)))
    : mix(0.28, 1.0, pow(0.5 + 0.5 * sin(uTime * mix(1.5, 3.8, h.w) + h.z * 14.0), 3.2));

  vec3 view = p - uCamPos;
  float dist = length(view);
  vec3 viewN = view / max(dist, 1e-4);
  vec3 up = vec3(0.0, 1.0, 0.0);
  vec3 side = normalize(cross(up, viewN));
  vec3 fwd = normalize(cross(viewN, side));

  float size = mix(0.042, 0.080, h.z);
  float minW = 2.2 / max(uProjScaleY / max(dist, 1.0), 1.0);
  size = max(size, minW);

  vec3 world = p + side * (position.x * size) + fwd * (position.y * size);
  float fade = 1.0 - smoothstep(vol.x * 0.76, vol.x * 1.08, length((p - origin).xz));
  fade *= smoothstep(0.4, 1.6, dist);
  vAlpha = fade * drive * pulse;
  vUv = position.xy;
  vPulse = pulse;
  gl_Position = uViewProj * vec4(world, 1.0);
}
`,Ht=`
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uSceneDepth;
uniform vec2 uResolution;
uniform vec4 uFlash;
uniform vec3 uFlashColor;

in vec2 vUv;
in float vAlpha;
in float vPulse;
layout(location = 0) out vec4 oColor;

void main(){
  if(vAlpha < 0.01) discard;
  vec2 uv = gl_FragCoord.xy / uResolution;
  float sceneZ = texture(uSceneDepth, uv).r;
  // glow through the understorey: only discard if well behind a solid
  float dz = gl_FragCoord.z - sceneZ;
  if(dz > 0.012) discard;
  float d = length(vUv);
  float core = exp(-d * d * 22.0);
  float halo = exp(-d * d * 4.8);
  if(core + halo < 0.03) discard;
  vec3 col = mix(vec3(0.10, 0.55, 0.04), vec3(2.2, 2.4, 0.55), core);
  col *= 16.0 + vPulse * 36.0;
  col += uFlashColor * uFlash.w * 0.15;
  float a = (core + halo * 0.22) * vAlpha * (1.0 - smoothstep(0.0, 0.01, max(dz, 0.0)));
  oColor = vec4(col * a, 0.0);
}
`,Ut=`
precision highp float;
precision highp int;
${M}
${w}

uniform mat4 uViewProj;
uniform vec3 uCamPos;
uniform vec4 uWeather;
uniform float uTime;
uniform float uNightAmount;
uniform float uProjScaleY;

in vec3 position;
in float iSeed;

out vec2 vUv;
out float vAlpha;
out float vFlap;

void main(){
  uint id = uint(iSeed + 0.5);
  vec4 h = hashI4(id * 11u + 1u);
  vec3 h3 = hashI3(id * 19u + 6u);

  float night = uNightAmount;
  float storm = uWeather.y;
  float rain = uWeather.z;
  float drive = (1.0 - smoothstep(0.42, 0.78, night))
    * (1.0 - smoothstep(0.55, 0.92, storm))
    * (1.0 - smoothstep(0.45, 0.85, rain));
  if(drive < 0.08){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vFlap = 0.0;
    return;
  }

  float group = floor(h.x * 5.0);
  vec4 gh = hashI4(uint(group + 0.5) * 91u + 3u);
  float ang = uTime * mix(0.10, 0.24, gh.x) + gh.y * 6.28318;
  float rad = mix(70.0, 210.0, gh.z);
  vec2 centre = uCamPos.xz + vec2(cos(ang), sin(ang)) * rad;
  float gy = groundHeight(centre);
  vec3 p = vec3(
    centre.x + (h3.x - 0.5) * 16.0,
    gy + mix(20.0, 46.0, gh.w) + (h3.y - 0.5) * 5.0,
    centre.y + (h3.z - 0.5) * 16.0
  );

  vec3 view = p - uCamPos;
  float dist = length(view);
  if(dist < 35.0 || dist > 360.0){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vFlap = 0.0;
    return;
  }
  vec3 viewN = view / dist;
  vec3 up = vec3(0.0, 1.0, 0.0);
  vec3 side = normalize(cross(up, viewN));
  vec3 fwd = normalize(cross(viewN, side));

  float flap = 0.45 + 0.55 * abs(sin(uTime * mix(5.5, 10.0, h.w) + h.z * 9.0));
  float span = mix(1.1, 2.4, h.y);
  float minW = 2.6 / max(uProjScaleY / max(dist, 1.0), 1.0);
  float wid = max(span, minW);
  float len = max(span * mix(0.22, 0.42, flap), minW * 0.6);

  vec3 world = p + side * (position.x * wid) + fwd * (position.y * len);
  float fade = smoothstep(40.0, 85.0, dist) * (1.0 - smoothstep(250.0, 340.0, dist));
  vAlpha = fade * drive * 0.85;
  vUv = position.xy;
  vFlap = flap;
  gl_Position = uViewProj * vec4(world, 1.0);
}
`,Wt=`
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uSceneDepth;
uniform vec2 uResolution;
uniform vec3 uSkyAmbient;
uniform vec3 uSunColor;

in vec2 vUv;
in float vAlpha;
in float vFlap;
layout(location = 0) out vec4 oColor;

void main(){
  if(vAlpha < 0.02) discard;
  vec2 uv = gl_FragCoord.xy / uResolution;
  float sceneZ = texture(uSceneDepth, uv).r;
  if(gl_FragCoord.z > sceneZ + 3.0e-4) discard;

  // V-silhouette: body on the centreline, wings swept
  float body = 1.0 - smoothstep(0.06, 0.20, abs(vUv.x) + abs(vUv.y) * 0.45);
  float wing = 1.0 - smoothstep(0.12, 0.78, abs(vUv.x) - (0.08 - vUv.y * 0.42 * vFlap));
  wing *= smoothstep(-0.85, -0.05, vUv.y);
  float mask = max(body, wing * 0.9);
  if(mask < 0.08) discard;

  vec3 col = vec3(0.04, 0.045, 0.05) * (0.7 + uSkyAmbient * 0.6);
  col += uSunColor * 0.04;
  float a = mask * vAlpha;
  oColor = vec4(col * a, a);
}
`,Gt=`
precision highp float;
precision highp int;
${M}
${_}
${w}

uniform mat4 uViewProj;
uniform vec3 uCamPos;
uniform vec3 uCamFwd;
uniform vec4 uWeather;
uniform float uTime;
uniform float uSeason;
uniform float uHold;
uniform vec3 uVolume;
uniform float uProjScaleY;

in vec3 position;
in float iSeed;

out vec2 vUv;
out float vAlpha;
out float vAge;

void main(){
  uint id = uint(iSeed + 0.5);
  vec4 h = hashI4(id * 17u + 9u);
  vec3 h3 = hashI3(id * 29u + 3u);

  float storm = uWeather.y;
  float wind = uWind.z;
  float drive = (uSeason * 0.95 + smoothstep(2.6, 9.0, wind) * 0.28 + 0.06)
    * (1.0 - smoothstep(0.32, 0.72, storm));
  if(uHold >= 0.0) drive = max(drive, 0.85);
  float alive = step(h.x, mix(0.05, 1.0, smoothstep(0.07, 0.88, drive)));
  if(uHold >= 0.0) alive = step(float(id), 7.5);
  if(alive < 0.5 || drive < 0.05){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vAge = 0.0;
    return;
  }

  vec2 wdir = normalize(uWind.xy + vec2(1e-5));
  float fall = mix(0.7, 2.1, h.z);
  float drift = (0.08 + wind * 0.018) * mix(1.2, 0.7, h.w);

  vec3 origin = uCamPos + vec3(0.0, 4.0, 0.0);
  vec3 vol = uVolume;
  vec2 adv = wdir * drift * uTime;
  vec3 p;
  if(uHold >= 0.0){
    vec3 look = normalize(uCamFwd + vec3(1e-5, 0.0, 0.0));
    vec3 rt = cross(look, vec3(0.0, 1.0, 0.0));
    if(length(rt) < 0.08) rt = cross(look, vec3(1.0, 0.0, 0.0));
    rt = normalize(rt);
    vec3 up = normalize(cross(rt, look));
    float along = mix(2.8, 7.2, h3.x);
    p = uCamPos + look * along + rt * (h3.z - 0.5) * 1.8 + up * (h3.y - 0.35) * 1.35;
  } else {
    p.x = origin.x + (fract(h3.x + 0.5 + adv.x / max(vol.x * 2.0, 0.01)) - 0.5) * vol.x * 2.0;
    p.z = origin.z + (fract(h3.z + 0.5 + adv.y / max(vol.x * 2.0, 0.01)) - 0.5) * vol.x * 2.0;
    p.y = origin.y + vol.y * 0.5 - fract(h3.y + uTime * fall / max(vol.y, 0.01)) * vol.y;
  }

  vec4 mapv = mapSample(p.xz);
  float ground = mapv.r;
  if(uHold < 0.0 && p.y < ground + 0.03){
    float rest = fract(h3.y + uTime * fall / max(vol.y, 0.01));
    if(rest > 0.78){
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      vAlpha = 0.0; vUv = vec2(0.0); vAge = rest;
      return;
    }
    p.y = ground + 0.025;
  }

  vec3 view = p - uCamPos;
  float dist = length(view);
  vec3 viewN = view / max(dist, 1e-4);
  vec3 up = vec3(0.0, 1.0, 0.0);
  vec3 side = cross(up, viewN);
  if(length(side) < 0.08) side = cross(vec3(1.0, 0.0, 0.0), viewN);
  side = normalize(side);
  vec3 fwd = normalize(cross(viewN, side));
  float spin = (uHold >= 0.0 ? uHold * 6.4 : uTime * mix(1.4, 4.2, h.w)) + h.z * 10.0;
  float cs = cos(spin), sn = sin(spin);
  vec3 r1 = side * cs + fwd * sn;
  vec3 r2 = -side * sn + fwd * cs;

  float len = mix(0.10, 0.22, h.z);
  if(uHold >= 0.0) len *= 5.2;
  float wid = len * 0.62;
  float minW = 1.8 / max(uProjScaleY / max(dist, 1.0), 1.0);
  wid = max(wid, minW);

  vec3 world = p + r1 * (position.x * wid) + r2 * (position.y * len);
  float fade = 1.0 - smoothstep(vol.x * 0.74, vol.x * 1.08, length((p - origin).xz));
  fade *= smoothstep(0.4, 1.5, dist);
  vAlpha = fade * mix(0.4, 1.0, drive);
  vUv = position.xy;
  vAge = fract(h3.y + uTime * 0.12);
  gl_Position = uViewProj * vec4(world, 1.0);
}
`,Kt=`
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uSceneDepth;
uniform vec2 uResolution;
uniform vec3 uSunColor;
uniform vec3 uSkyAmbient;
uniform float uSeason;
uniform float uHold;

in vec2 vUv;
in float vAlpha;
in float vAge;
layout(location = 0) out vec4 oColor;

void main(){
  if(vAlpha < 0.02) discard;
  vec2 uv = gl_FragCoord.xy / uResolution;
  float sceneZ = texture(uSceneDepth, uv).r;
  // held cards sit on the look ray; do not let a trunk eat them
  if(uHold < 0.0 && gl_FragCoord.z > sceneZ + 3.0e-4) discard;
  vec2 q = vUv;
  q.y *= 1.3;
  float leaf = 1.0 - smoothstep(0.38, 1.0, length(q));
  float notch = smoothstep(0.0, 0.22, abs(q.x) + q.y * 0.28);
  float mask = leaf * notch;
  if(mask < 0.04) discard;
  vec3 green = vec3(0.16, 0.28, 0.07);
  vec3 autumn = mix(vec3(0.42, 0.22, 0.05), vec3(0.55, 0.14, 0.04), fract(vAge * 3.3));
  float turn = uHold >= 0.0 ? 1.0 : clamp(uSeason * 1.2 + fract(vAge * 5.0) * 0.25, 0.0, 1.0);
  vec3 col = mix(green, autumn, turn);
  col *= 0.62 + uSkyAmbient * 0.7 + uSunColor * 0.28;
  if(uHold >= 0.0) col = mix(col, vec3(0.62, 0.22, 0.05), 0.55) * 1.55;
  float a = mask * vAlpha * (uHold >= 0.0 ? 1.25 : 0.92);
  oColor = vec4(col * a, a);
}
`;function qt(e,t,n,r,i,a){let o=Ft();o.setAttribute(`iSeed`,It(t)),o.instanceCount=t;let s={...y.pick(...Lt),...e.maps.sharedUniforms,uSceneDepth:{value:null},...i},c=Rt(n,r,s,a),l=new S(o,c);return l.frustumCulled=!1,l.matrixAutoUpdate=!1,l.visible=!1,{geo:o,material:c,mesh:l,uniforms:s,count:t}}var Jt=class{constructor(e,t){this.forest=e;let n=t.rainParticles??24e3;this.insects=qt(e,Math.max(480,Math.round(n*.08)),zt,Bt,{uVolume:{value:new a(11,6,11)}},!1),this.fireflies=qt(e,Math.max(220,Math.round(n*.045)),Vt,Ht,{uVolume:{value:new a(5.4,2.5,5.4)},uCamFwd:{value:new a(0,0,-1)},uHoldPulse:{value:-1}},!0),this.birds=qt(e,Math.max(28,Math.round(n*.004)),Ut,Wt,{},!1),this.leaves=qt(e,Math.max(360,Math.round(n*.055)),Gt,Kt,{uVolume:{value:new a(20,14,20)},uCamFwd:{value:new a(0,0,-1)},uHold:{value:-1}},!1),this.forwardMeshes=[this.insects.mesh,this.fireflies.mesh,this.birds.mesh,this.leaves.mesh],this.stats={insects:0,fireflies:0,birds:0,leaves:0},this.holdPulse=-1,this.holdLeaves=-1,this.holdInsects=-1,this.holdBirds=-1,this.leavesSuppressed=!1,this._fwd=new a(0,0,-1)}update(e,t){if(t&&(t.getWorldDirection(this._fwd),t.getWorldDirection(this.fireflies.uniforms.uCamFwd.value),t.getWorldDirection(this.leaves.uniforms.uCamFwd.value)),this.leaves.uniforms.uHold&&(this.leaves.uniforms.uHold.value=this.holdLeaves),this.holdLeaves>=0&&t){let e=this.leaves.uniforms.uCamFwd.value;p.uLeafHold.value.set(t.position.x+e.x*5.4,t.position.y+e.y*5.4,t.position.z+e.z*5.4,1)}else p.uLeafHold.value.w=0;if(this.holdInsects>=0&&t){let e=this.forest.maps,n=t.position.x+this._fwd.x*6.4,r=t.position.z+this._fwd.z*6.4,i=e?.height?.(n,r)??t.position.y-1.6;p.uInsectHold.value.set(n,Math.max(t.position.y+this._fwd.y*6.4,i+2.35),r,1)}else p.uInsectHold.value.w=0;this.holdBirds>=0&&t?p.uBirdHold.value.set(t.position.x+this._fwd.x*92,t.position.y+this._fwd.y*92+16,t.position.z+this._fwd.z*92,1):p.uBirdHold.value.w=0,this.fireflies.uniforms.uHoldPulse&&(this.fireflies.uniforms.uHoldPulse.value=this.holdPulse);let n=p.uNightAmount.value,r=p.uWeather.value.z,i=p.uWeather.value.y,a=p.uWind.value.z,o=p.uSeason.value,s=(.22+C.smoothstep(n,.06,.32)*(1-C.smoothstep(n,.72,.96))*1.35+(1-n)*.18)*(1-C.smoothstep(r,.16,.52))*(1-C.smoothstep(i,.5,.88)),c=this.holdInsects>=0,l=this.holdBirds>=0;this.insects.mesh.visible=!c&&!l&&s>.05,this.insects.geo.instanceCount=c?0:this.insects.mesh.visible?Math.max(1,Math.floor(this.insects.count*C.smoothstep(s,.05,.85))):0;let u=C.smoothstep(n,.16,.52)*(1-C.smoothstep(r,.28,.72));this.fireflies.mesh.visible=u>.05,this.fireflies.geo.instanceCount=this.fireflies.mesh.visible?Math.max(1,Math.floor(this.fireflies.count*C.smoothstep(u,.05,.9))):0;let d=(1-C.smoothstep(n,.42,.78))*(1-C.smoothstep(i,.55,.92))*(1-C.smoothstep(r,.45,.85));this.birds.mesh.visible=!l&&!c&&d>.08,this.birds.geo.instanceCount=l?0:this.birds.mesh.visible?Math.max(1,Math.floor(this.birds.count*C.smoothstep(d,.08,.9))):0;let f=this.holdLeaves>=0,m=this.leavesSuppressed?0:f?1:(o*.95+C.smoothstep(a,2.6,9)*.28+.06)*(1-C.smoothstep(i,.32,.72));this.leaves.mesh.visible=!f&&m>.05,this.leaves.geo.instanceCount=f?0:this.leaves.mesh.visible?Math.max(1,Math.floor(this.leaves.count*C.smoothstep(m,.05,.88))):0,this.stats.insects=c?12:this.insects.geo.instanceCount,this.stats.fireflies=this.fireflies.geo.instanceCount,this.stats.birds=l?5:this.birds.geo.instanceCount,this.stats.leaves=f?4:this.leaves.geo.instanceCount}beforeForward(e,t){this.insects.uniforms.uSceneDepth.value=t,this.fireflies.uniforms.uSceneDepth.value=t,this.birds.uniforms.uSceneDepth.value=t,this.leaves.uniforms.uSceneDepth.value=t}};function Yt(){let e=new r;return e.setAttribute(`position`,new I(new Float32Array([-1,-1,0,1,-1,0,-1,1,0,-1,1,0,1,-1,0,1,1,0]),3)),e.boundingSphere=new u(new a,1e6),e}function Xt(e){let t=new Float32Array(e);for(let n=0;n<e;n++)t[n]=n;return new f(t,1)}var Zt=[`uTime`,`uCamPos`,`uWeather`,`uWind`,`uWindPhase`,`uSunColor`,`uSkyAmbient`,`uFlash`,`uFlashColor`,`uFire`,`uFireColor`,`uViewProj`,`uResolution`,`uProjScaleY`];function Qt(e,t,n,r){return new c({glslVersion:P,uniforms:n,vertexShader:e,fragmentShader:t,transparent:!0,depthTest:!1,depthWrite:!1,blending:5,blendEquation:100,blendSrc:201,blendDst:r?201:205})}var $t=`
precision highp float;
precision highp int;
${M}
${_}
${w}

uniform mat4 uViewProj;
uniform vec3 uCamPos;
uniform vec4 uFire;
uniform float uTime;
uniform float uProjScaleY;
uniform float uRadius;

in vec3 position;
in float iSeed;

out vec2 vUv;
out float vAlpha;
out float vHeat;

void main(){
  uint id = uint(iSeed + 0.5);
  vec4 h = hashI4(id * 15u + 2u);
  vec3 h3 = hashI3(id * 23u + 7u);

  if(uFire.w < 0.04){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vHeat = 0.0;
    return;
  }

  float ang = h.x * 6.28318;
  float rad = sqrt(h.y) * uRadius * mix(0.25, 1.0, uFire.w);
  vec3 p = uFire.xyz;
  p.x += cos(ang) * rad;
  p.z += sin(ang) * rad;

  vec4 mapv = mapSample(p.xz);
  vec4 eco = ecoSample(p.xz);
  float ground = mapv.r;
  float water = max(mapv.g - mapv.r, 0.0);
  float wet = mapv.b;
  float litter = eco.a;
  if(water > 0.06 || wet > 0.82){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vHeat = 0.0;
    return;
  }

  p.y = ground + 0.04;
  float flick = 0.7 + 0.3 * sin(uTime * mix(9.0, 18.0, h.z) + h.w * 20.0);
  float hero = step(float(id), 11.0);
  float ht = mix(1.4, 3.8, h.z) * uFire.w * flick * (0.75 + litter * 0.45);
  ht *= mix(1.0, 1.55, hero);

  vec3 view = p - uCamPos;
  float dist = length(view);
  vec3 viewN = view / max(dist, 1e-4);
  vec3 up = vec3(0.0, 1.0, 0.0);
  vec3 side = normalize(cross(up, viewN));

  float wid = mix(0.14, 0.38, h.w) * (0.60 + uFire.w * 0.7);
  wid *= mix(1.0, 1.35, hero);
  float minW = 2.0 / max(uProjScaleY / max(dist, 1.0), 1.0);
  wid = max(wid, minW);

  vec3 world = p + side * (position.x * wid) + up * ((position.y * 0.5 + 0.5) * ht);
  float fade = 1.0 - smoothstep(uRadius * 0.92, uRadius * 1.15, rad);
  fade *= smoothstep(0.4, 1.8, dist);
  vAlpha = fade * uFire.w * flick;
  vUv = position.xy;
  vHeat = flick * (1.0 - rad / max(uRadius, 0.01));
  gl_Position = uViewProj * vec4(world, 1.0);
}
`,en=`
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uSceneDepth;
uniform vec2 uResolution;
uniform vec3 uFireColor;

in vec2 vUv;
in float vAlpha;
in float vHeat;
layout(location = 0) out vec4 oColor;

void main(){
  if(vAlpha < 0.02) discard;
  vec2 uv = gl_FragCoord.xy / uResolution;
  float sceneZ = texture(uSceneDepth, uv).r;
  float dz = gl_FragCoord.z - sceneZ;
  if(dz > 0.01) discard;

  vec2 q = vUv;
  float t = q.y * 0.5 + 0.5;
  float halfW = mix(0.95, 0.16, t * t);
  float mask = 1.0 - smoothstep(halfW * 0.40, halfW, abs(q.x));
  mask *= 1.0 - smoothstep(0.88, 1.0, t);
  if(mask < 0.05) discard;

  vec3 cool = vec3(0.70, 0.05, 0.01);
  vec3 hot = vec3(2.4, 1.25, 0.22);
  float core = exp(-length(vec2(q.x / max(halfW, 0.08) * 1.4, (t - 0.12) * 1.6)) * 2.8);
  vec3 col = mix(cool, hot, clamp(vHeat * 0.50 + (1.0 - t) * 0.35 + core * 0.55, 0.0, 1.0));
  col *= uFireColor / max(uFireColor.r, 0.2);
  col *= 4.2 + vHeat * 5.5 + core * 7.0;
  float a = mask * vAlpha * (1.0 - smoothstep(0.0, 0.008, max(dz, 0.0)));
  oColor = vec4(col * a, a);
}
`,tn=`
precision highp float;
precision highp int;
${M}
${_}
${w}

uniform mat4 uViewProj;
uniform vec3 uCamPos;
uniform vec4 uFire;
uniform float uTime;
uniform float uProjScaleY;
uniform vec3 uVolume;

in vec3 position;
in float iSeed;

out vec2 vUv;
out float vAlpha;
out float vAge;

void main(){
  uint id = uint(iSeed + 0.5);
  vec4 h = hashI4(id * 19u + 4u);
  vec3 h3 = hashI3(id * 31u + 1u);

  if(uFire.w < 0.04){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vAge = 0.0;
    return;
  }

  vec2 wdir = normalize(uWind.xy + vec2(1e-5));
  float rise = mix(1.6, 5.2, h.y);
  float life = fract(h.z + uTime * mix(0.18, 0.45, h.w));
  vec3 p = uFire.xyz;
  p.x += (h3.x - 0.5) * uVolume.x * (0.4 + life * 1.4) + wdir.x * life * uWind.z * 0.22;
  p.z += (h3.z - 0.5) * uVolume.z * (0.4 + life * 1.4) + wdir.y * life * uWind.z * 0.22;
  p.y += life * uVolume.y * rise * 0.18 + h3.y * 0.4;

  vec3 view = p - uCamPos;
  float dist = length(view);
  vec3 viewN = view / max(dist, 1e-4);
  vec3 up = vec3(0.0, 1.0, 0.0);
  vec3 side = normalize(cross(up, viewN));
  vec3 fwd = normalize(cross(viewN, side));

  float size = mix(0.018, 0.055, h.z);
  float minW = 1.8 / max(uProjScaleY / max(dist, 1.0), 1.0);
  size = max(size, minW);

  vec3 world = p + side * (position.x * size) + fwd * (position.y * size);
  float fade = (1.0 - smoothstep(0.75, 1.0, life)) * smoothstep(0.0, 0.08, life);
  fade *= smoothstep(0.4, 2.0, dist);
  vAlpha = fade * uFire.w;
  vUv = position.xy;
  vAge = life;
  gl_Position = uViewProj * vec4(world, 1.0);
}
`,nn=`
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uSceneDepth;
uniform vec2 uResolution;
uniform vec3 uFireColor;

in vec2 vUv;
in float vAlpha;
in float vAge;
layout(location = 0) out vec4 oColor;

void main(){
  if(vAlpha < 0.01) discard;
  vec2 uv = gl_FragCoord.xy / uResolution;
  float sceneZ = texture(uSceneDepth, uv).r;
  float dz = gl_FragCoord.z - sceneZ;
  if(dz > 0.01) discard;
  float d = length(vUv);
  float core = exp(-d * d * 7.0);
  if(core < 0.02) discard;
  vec3 col = mix(vec3(1.45, 0.65, 0.10), vec3(0.75, 0.10, 0.02), vAge);
  col *= uFireColor / max(uFireColor.r, 0.2);
  col *= 6.0 + (1.0 - vAge) * 8.0;
  float a = core * vAlpha * (1.0 - smoothstep(0.0, 0.008, max(dz, 0.0)));
  oColor = vec4(col * a, 0.0);
}
`,rn=`
precision highp float;
precision highp int;
${M}
${_}
${w}

uniform mat4 uViewProj;
uniform vec3 uCamPos;
uniform vec4 uFire;
uniform float uTime;
uniform float uProjScaleY;
uniform vec3 uVolume;

in vec3 position;
in float iSeed;

out vec2 vUv;
out float vAlpha;
out float vAge;

void main(){
  uint id = uint(iSeed + 0.5);
  vec4 h = hashI4(id * 27u + 6u);
  vec3 h3 = hashI3(id * 41u + 9u);

  if(uFire.w < 0.05){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vAge = 0.0;
    return;
  }

  vec2 wdir = normalize(uWind.xy + vec2(1e-5));
  float life = fract(h.z + uTime * mix(0.06, 0.16, h.w));
  vec3 p = uFire.xyz;
  float spread = mix(0.6, 2.4, life);
  p.x += (h3.x - 0.5) * uVolume.x * spread + wdir.x * life * (3.0 + uWind.z * 0.35);
  p.z += (h3.z - 0.5) * uVolume.z * spread + wdir.y * life * (3.0 + uWind.z * 0.35);
  p.y += life * uVolume.y * mix(0.7, 1.4, h.y) + 0.4;

  vec3 view = p - uCamPos;
  float dist = length(view);
  vec3 viewN = view / max(dist, 1e-4);
  vec3 up = vec3(0.0, 1.0, 0.0);
  vec3 side = normalize(cross(up, viewN));
  vec3 fwd = normalize(cross(viewN, side));

  float size = mix(0.7, 2.8, life) * mix(0.7, 1.3, h.y);
  float minW = 2.4 / max(uProjScaleY / max(dist, 1.0), 1.0);
  size = max(size, minW);

  float spin = uTime * mix(0.15, 0.55, h.w) + h.z * 6.0;
  float cs = cos(spin), sn = sin(spin);
  vec3 r1 = side * cs + fwd * sn;
  vec3 r2 = -side * sn + fwd * cs;

  vec3 world = p + r1 * (position.x * size) + r2 * (position.y * size);
  float fade = (1.0 - smoothstep(0.7, 1.0, life)) * smoothstep(0.0, 0.12, life);
  fade *= smoothstep(0.8, 3.0, dist);
  vAlpha = fade * uFire.w * 0.55;
  vUv = position.xy;
  vAge = life;
  gl_Position = uViewProj * vec4(world, 1.0);
}
`,an=`
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uSceneDepth;
uniform vec2 uResolution;
uniform vec3 uSkyAmbient;
uniform vec3 uSunColor;
uniform vec3 uFireColor;
uniform vec4 uFire;

in vec2 vUv;
in float vAlpha;
in float vAge;
layout(location = 0) out vec4 oColor;

void main(){
  if(vAlpha < 0.015) discard;
  vec2 uv = gl_FragCoord.xy / uResolution;
  float sceneZ = texture(uSceneDepth, uv).r;
  if(gl_FragCoord.z > sceneZ + 3.0e-4) discard;
  float d = length(vUv);
  float ang = atan(vUv.y, vUv.x);
  float wob = 1.0 + 0.22 * sin(ang * 3.0 + vAge * 9.0) + 0.10 * sin(ang * 7.0);
  float mask = 1.0 - smoothstep(0.42 * wob, 0.92 * wob, d);
  if(mask < 0.08) discard;
  vec3 col = mix(vec3(0.08, 0.065, 0.055), vec3(0.22, 0.18, 0.15), vAge);
  col *= 0.50 + uSkyAmbient * 0.7 + uSunColor * 0.06;
  col += uFireColor * uFire.w * 0.10 * (1.0 - vAge);
  float a = mask * vAlpha * 0.82;
  oColor = vec4(col * a, a);
}
`;function on(e,t,n,r,i,a){let o=Yt();o.setAttribute(`iSeed`,Xt(t)),o.instanceCount=t;let s={...y.pick(...Zt),...e.maps.sharedUniforms,uSceneDepth:{value:null},...i},c=Qt(n,r,s,a),l=new S(o,c);return l.frustumCulled=!1,l.matrixAutoUpdate=!1,l.visible=!1,{geo:o,material:c,mesh:l,uniforms:s,count:t}}var sn=class{constructor(e,t){this.forest=e;let n=t.rainParticles??24e3;this.origin=new a,this.strength=0,this.age=0,this.held=!1,this.holdSmoke=!1,this.holdEmbers=!1,this.flames=on(e,Math.max(180,Math.round(n*.03)),$t,en,{uRadius:{value:5.2}},!1),this.embers=on(e,Math.max(400,Math.round(n*.07)),tn,nn,{uVolume:{value:new a(6,14,6)}},!0),this.smoke=on(e,Math.max(220,Math.round(n*.04)),rn,an,{uVolume:{value:new a(8,22,8)}},!1),this.forwardMeshes=[this.smoke.mesh,this.flames.mesh,this.embers.mesh],this.stats={flames:0,embers:0,smoke:0,strength:0}}ignite(e,t=1){if(!e)return;this.origin.copy(e);let n=this.forest.maps.height?.(e.x,e.z);Number.isFinite(n)&&(this.origin.y=n+.15),this.strength=Math.max(this.strength,C.clamp(t,.35,1)),this.age=0}onLightning(e){if(!e)return;let t=p.uWeather.value.w,n=p.uWeather.value.z;t>.55||n>.45||this.forest.maps.sample(e.x,e.z,{}).waterDepth>.08||this.ignite(e,.7+(1-t)*.35)}update(e){let t=p.uWeather.value.z,n=p.uWeather.value.w;if(this.held&&this.strength>0)this.strength=Math.max(this.strength,.94);else if(this.strength>0){this.age+=e;let r=t*.55+Math.max(0,n-.45)*.25;this.strength=Math.max(0,this.strength-e*(.012+r)),this.strength<.03&&(this.strength=0)}p.uFire.value.set(this.origin.x,this.origin.y+.8,this.origin.z,this.strength),this.holdSmoke&&this.strength>.04?p.uSmokeHold.value.set(this.origin.x,this.origin.y+1.15,this.origin.z,1):p.uSmokeHold.value.set(0,0,0,0),this.holdEmbers&&this.strength>.04?p.uEmberHold.value.set(this.origin.x,this.origin.y+1.35,this.origin.z,1):p.uEmberHold.value.set(0,0,0,0);let r=this.strength>.04;this.flames.mesh.visible=r,this.embers.mesh.visible=r&&!this.holdEmbers,this.smoke.mesh.visible=r&&!this.holdSmoke;let i=C.smoothstep(this.strength,.04,.95);this.flames.geo.instanceCount=r?Math.max(1,Math.floor(this.flames.count*i)):0,this.embers.geo.instanceCount=r&&!this.holdEmbers?Math.max(1,Math.floor(this.embers.count*i)):0,this.smoke.geo.instanceCount=r&&!this.holdSmoke?Math.max(1,Math.floor(this.smoke.count*i)):0,this.stats.flames=this.flames.geo.instanceCount,this.stats.embers=this.holdEmbers?12:this.embers.geo.instanceCount,this.stats.smoke=this.holdSmoke?5:this.smoke.geo.instanceCount,this.stats.strength=this.strength}beforeForward(e,t){this.flames.uniforms.uSceneDepth.value=t,this.embers.uniforms.uSceneDepth.value=t,this.smoke.uniforms.uSceneDepth.value=t}};async function cn(e,t,n){let r=new Se(e,t);await r.build((e,t)=>n(e*.62,t)),e.addSystem(r),e.trees=r,n(.62,`growing undergrowth`);let i=new rt(e,t);await i.build((e,t)=>n(.62+e*.2,t)),e.addSystem(i),e.clutter=i,n(.85,`seeding grass`);let a=new Ee(e,t);e.addSystem(a),e.grass=a,n(.93,`filling streams`);let o=new st(e,t);e.addSystem(o),e.water=o,n(.97,`seeding rain`);let s=new mt(e,t);e.addSystem(s),e.rain=s;let c=new bt(e,t);e.addSystem(c),e.lightning=c;let l=new Tt(e,t);e.addSystem(l),e.debris=l;let u=new Nt(e,t);e.addSystem(u),e.falling=u;let d=new Jt(e,t);e.addSystem(d),e.life=d;let f=new sn(e,t);e.addSystem(f),e.fire=f,n(1,`ready`)}export{cn as registerSystems};